"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react";
import { redirect, RedirectType } from "next/navigation";
import styles from "../page.module.css";
import { Flag, VideoDataClient } from "@/lib/types";
import VoteCounter from "./vote_counter";
import VoteField from "./vote_field";
import { testLink } from "@/lib/util";
import { removeBallotItem, validate } from "@/lib/api";
import { labels } from "@/lib/labels";

interface InitialProps {
  i_inputs: string[]
  i_flags: Flag[][]
  i_video_data: (VideoDataClient | null)[]
}

export default function VoteForm({ i_inputs, i_flags, i_video_data }: InitialProps) {
  const [initialFlags, setInitialFlags] = useState(i_flags) // TODO edit maybe too short logic
  const [videoData, setVideoData] = useState(i_video_data)
  const [inputs, setInputs] = useState(i_inputs)
  const [warning, setWarning] = useState(false)
  const inputTimeouts = useRef<NodeJS.Timeout[]>([])
  const deletionTimeouts = useRef<NodeJS.Timeout[]>([])
  const pasting = useRef(false)

  /**
   * Shorthand for updating the array states at a specified index
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateArr = (val: any, setter: Dispatch<SetStateAction<any[]>>, index: number) => {
    setter(old => {
      const updated = [...old]
      updated[index] = val
      return updated
    })
  }

  /**
   * Rerender the page using the results of the validation request
   * @param input user input, ideally a well formed link from a supported domain
   * @param field_index used by the server to save the entry's position
   */
  const applyValidation = async (input: string, field_index: number) => {
    const { field_flags, video_data } = await validate(input, field_index)
    updateArr(field_flags, setInitialFlags, field_index)
    updateArr(video_data || null, setVideoData, field_index)
  }

  /**
   * Tell the server to forget the entry at the specified index
   */
  const removeFieldSave = (field_index: number) => {
    // Assume already not present whien there's no video data
    if (!videoData[field_index])
      return

    // Wait until the user stops editing the entry field to avoid spamming requests
    clearTimeout(inputTimeouts.current[field_index])
    clearTimeout(deletionTimeouts.current[field_index])

    deletionTimeouts.current[field_index] = setTimeout(() => {
      removeBallotItem(field_index)
    }, 1000);
  }

  /**
   * Handler for changes to the ballot entry fields
   */
  const changed = async (e: React.ChangeEvent<HTMLInputElement>, field_index: number) => {    
    const input = e.currentTarget.value.trim()
    const isLink = testLink(input)

    updateArr(input, setInputs, field_index)
    updateArr(null, setVideoData, field_index)

    if (!input) {
      updateArr([], setInitialFlags, field_index)
      removeFieldSave(field_index)
    }
    else if (!isLink) {
      updateArr([labels.invalid_link], setInitialFlags, field_index)
      removeFieldSave(field_index)
    }
    else if (isLink.length) {
      updateArr(isLink, setInitialFlags, field_index)
      removeFieldSave(field_index)
    }
    else if (pasting.current) {
      pasting.current = false
      updateArr(undefined, setVideoData, field_index)
      clearTimeout(deletionTimeouts.current[field_index])
      applyValidation(input, field_index)
    }
    else {
      clearTimeout(inputTimeouts.current[field_index])
      updateArr(undefined, setVideoData, field_index)
      clearTimeout(deletionTimeouts.current[field_index])
      inputTimeouts.current[field_index] = setTimeout(() => applyValidation(input, field_index), 2500)
    }
  }

  /**
   * Assuming this would normally be a link, prevent changed() from delaying requests
   */
  const pasted = () => { pasting.current = true }

  /**
   * Exports votes to the main form, and shows a warning if there's a chance that < 5 might be ineligible
   */
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement

    if (submitter.value === "warn")
      return setWarning(true)

    let responses = inputs.filter(vote => vote != "")
    responses = [...responses, ...Array(10 - responses.length).fill("")]

    const base = "https://docs.google.com/forms/d/e/1FAIpQLSdVi1gUmI8c2nBnYde7ysN8ZJ79EwI5WSBTbHKqIgC7js0PYg/viewform?usp=pp_url&"
    const params = [
      "entry.1539722665=",
      "entry.762566163=",
      "entry.1505751621=",
      "entry.1836454367=",
      "entry.111008931=",
      "entry.1232436476=",
      "entry.345333698=",
      "entry.543465209=",
      "entry.289193595=",
      "entry.578807278=",
    ]

    redirect(`${base}${params.map((key, i) => {
      let url = responses[i]
      if (!url) return key

      url = encodeURIComponent(`${url}${url.split("/").at(-1)!.includes("?") ? "&f=1" : "?f=1"}`) // todo: edge case
      return `${key}${url}`
    }).join("&")}`, RedirectType.push)
  }

  // Ballot rules are checked in the client, here
  const videos = new Set()
  const creatorCounts = new Map()

  const flags: Flag[][] = initialFlags.map(item_flags => { return [...item_flags] })

  for (const i in videoData) {
    const vid_data = videoData[i]

    if (!vid_data)
      continue

    const vid_id = `${vid_data.id}-${vid_data.platform}`
    const creator_id = `${vid_data.uploader}-${vid_data.platform}`

    if (videos.has(vid_id))
      flags[i].push(labels.duplicate_votes)
    else
      videos.add(vid_id)

    const newCount = (creatorCounts.get(vid_data.uploader) || 0) + 1
    creatorCounts.set(creator_id, newCount)

    if (newCount > 2)
      flags[i].push(labels.no_simping)
  }

  const unique_creators = creatorCounts.size
  const eligible = flags.filter((item_flags: Flag[], i) => inputs[i] && !item_flags.find(flag => flag.type === "ineligible"))  
  const eligible_gte5 = eligible.length >= 5

  const should_warn = unique_creators < 5 || !eligible_gte5 || eligible.length !== inputs.filter(input => input !== "").length

  return (
    <>
      <VoteCounter eligibleCount={eligible.length} uniqueCreatorCount={unique_creators}/>
      <form className={styles.form} onSubmit={submit} autoComplete="off">
        {
          warning && <div className={styles.mask}>
            <div className={styles.warning_prompt}>
              <span><b>Warning</b></span>
              <span>Ineligible votes will not be counted</span>
              <span>If <b>less than 5</b> eligible votes are present, then <b>0</b> will be counted</span>
              <span>Please continue only if you are sure these are eligible</span>
              <div>
                <button type="submit" value="export" className={styles.confirm}>Continue</button>
                <button className={styles.go_back} onClick={() => {setWarning(false)}}>Go Back</button>
              </div>
            </div>
          </div>
        }
        <div className={styles.headerfield}>
          <label>Test Voting Form</label>
          <p>
            This form aims to make managing and submitting votes easier. This is done by showing video details with each vote and checking their eligibility in advance.<br/><br/>
            Note that only basic checks are done by the form, so be sure the videos&apos; content also aligns with the rules.<br/><br/>
            Symbol Meanings:<br/>
            ✅ = Eligible<br/>
            ⚠️ = Maybe ineligible<br/>
            ❌ = Ineligible<br/><br/>
            If you aren&apos;t familiar with the rules or need any reminder, be sure to carefully read the full rules <a href="https://www.thetop10ponyvideos.com/voting-info#h.j2voxvq0owh8" className={styles.link}>here</a>.
          </p>
        </div>
        {inputs.map((input, i) =>
          <VoteField
            key={i}
            index={i}
            fieldInput={input}
            fieldFlags={flags[i]}
            displayData={videoData[i]}
            onChanged={changed}
            onPaste={pasted}
          />
        )}
        <div className={styles.field}>
          <label>Contact Email, or Discord name, or Twitter, or Mastodon</label>
          <div>
            Feel free to leave this blank, however, <b>including consistent contact info every time you vote helps us to recognize regular voters!</b>&nbsp; It also makes it possible to contact voters if there&apos;s an issue or question. <i>More information and privacy policy can be found here: <a href="https://www.thetop10ponyvideos.com/links-info-credits/privacy-policy">https://www.thetop10ponyvideos.com/links-info-credits/privacy-policy</a></i>
          </div>
          <div className={styles.input} style={{ color: "grey", fontSize: 14, pointerEvents: "none" }}>For privacy reasons, only enter contact info on the official form</div>
        </div>
        <button type="submit" value={should_warn ? "warn" : "export" } className={styles.submitButton}>Export Votes</button>
      </form>
    </>
  );
}
