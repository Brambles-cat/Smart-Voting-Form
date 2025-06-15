"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react";
import { redirect } from "next/navigation";
import styles from "../page.module.css";
import { APIRemoveRequestBody, APIValidateRequestBody, APIValidateResponseBody, Flag, VideoDataClient } from "@/lib/types";
import VoteCounter from "./vote_counter";
import VoteField from "./vote_field";

interface InitialProps {
  i_inputs: string[]
  i_flags: Flag[][]
  i_video_data: (VideoDataClient | null | undefined)[]
}

const noSimpingRule = "5b. You can include up to two videos from a creator if the videos are unique and you're including votes for at least five creators total. Don’t vote for multiple parts in a series or very similar videos from the same creator"

export default function VoteForms({ i_inputs, i_flags, i_video_data }: InitialProps) {
  const [initialFlags, setInitialFlags] = useState(i_flags) // TODO edit maybe too short logic
  const [videoData, setVideoData] = useState(i_video_data)
  const [inputs, setInputs] = useState(i_inputs)
  const [warning, setWarning] = useState(false)
  const inputTimeouts = useRef<NodeJS.Timeout[]>([])
  const deleteTimeouts = useRef<NodeJS.Timeout[]>([])
  const pasting = useRef(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateArr = (val: any, setter: Dispatch<SetStateAction<any[]>>, index: number) => {
    setter(old => {
      const updated = [...old]
      updated[index] = val
      return updated
    })
  }

  const applyValidation = async (input: string, field_index: number) => {
    const { field_flags, video_data } = await validate(input, field_index)
    updateArr(field_flags, setInitialFlags, field_index)
    updateArr(video_data || null, setVideoData, field_index)
  }

  const removeFieldSave = (field_index: number) => {
    if (!videoData[field_index])
      return

    clearTimeout(inputTimeouts.current[field_index])
    clearTimeout(deleteTimeouts.current[field_index])
    deleteTimeouts.current[field_index] = setTimeout(() => {
      remove(field_index)
    }, 1000);
  }

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
      updateArr([{ type: "ineligible", note: "Not a valid link" } as Flag], setInitialFlags, field_index)
      removeFieldSave(field_index)
    }
    else if (isLink.length) {
      updateArr(isLink, setInitialFlags, field_index)
      removeFieldSave(field_index)
    }
    else if (pasting.current) {
      pasting.current = false
      updateArr(undefined, setVideoData, field_index)
      clearTimeout(deleteTimeouts.current[field_index])
      applyValidation(input, field_index)
    }
    else {
      clearTimeout(inputTimeouts.current[field_index])
      updateArr(undefined, setVideoData, field_index)
      clearTimeout(deleteTimeouts.current[field_index])
      inputTimeouts.current[field_index] = setTimeout(() => applyValidation(input, field_index), 3000)
    }
  }

  const pasted = () => { pasting.current = true }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement
    
    if (submitter.value === "warn")
      return setWarning(true)

    const formData = new FormData(e.currentTarget);
    const data: { [k: string]: FormDataEntryValue } = Object.fromEntries(formData.entries());
    let votes: unknown[] = Object.values(data)

    votes = votes.filter(vote => vote != "")
    
    const responses = [...votes, ...Array(10 - votes.length).fill("")]

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
    
    redirect(`${base}${params.map((key, i) => `${key}${responses[i]}`).join("&")}`)
  }

  const videos = new Set()
  const creatorCounts = new Map()

  const flags: Flag[][] = initialFlags.map(item_flags => { return [...item_flags] })

  for (const i in videoData) {
    const vid_data = videoData[i]
    
    if (!vid_data)
      continue

    const vid_id = `${vid_data.video_id}-${vid_data.platform}`
    const creator_id = `${vid_data.uploader}-${vid_data.platform}`

    if (videos.has(vid_id))
      flags[i].push({ type: "ineligible", note: "Duplicate votes are not eligible" })
    else
      videos.add(vid_id)

    const newCount = (creatorCounts.get(vid_data.uploader) || 0) + 1
    creatorCounts.set(creator_id, newCount)

    if (newCount > 2)
      flags[i].push({ type: "ineligible", note: noSimpingRule })
  }

  const unique_creators = creatorCounts.size
  const eligible = flags.filter((item_flags: { type: string, note: string }[], i) => inputs[i] && !item_flags.find(flag => flag.type === "ineligible"))  
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
          <label>Test Smort Form #2</label>
          <div>Features:</div>
          <ul>
            <li>
              Displays videos on the ballot to make keeping track of what was or wasn&apos;t on there easier when making changes
            </li>
            <li>
              Closing the tab, refreshing, or revisitting will not cause inputted votes to reset
            </li>
            <li>
              Playlists
              <ul>
                <li>Able to import public YouTube playlists</li>
                <li>Playlists with {"<"}= 10 videos can be turned into a ballot for validation</li>
                <li>Ballots can be turned into a playlist</li>
                <li>Links to playists are shareable</li>
              </ul>
            </li>
          </ul>
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

// function search() {}

async function validate(url: string, index: number): Promise<APIValidateResponseBody> {
  const res = await fetch("/api/validate", {
    method: "POST",
    body: JSON.stringify({
      link: url,
      index: index
    } as APIValidateRequestBody),
  })

  return await res.json()
}

function remove(field_index: number) {
  fetch("/api/remove", {
    method: "POST",
    body: JSON.stringify({
      index: field_index
    } as APIRemoveRequestBody)
  })
}

/**
 * @returns false if input is not a link, or an array of 0 or 1 flag if the link is or isn't from a supported platform respectively
 */
function testLink(input: string): false | Flag[] {
  const valid = /(https?:\/\/)?(\w+\.)?(pony\.tube|youtube\.com|youtu\.be|bilibili\.com|vimeo\.com|thishorsie\.rocks|dailymotion\.com|dai\.ly|tiktok\.com|twitter\.com|x\.com|odysee\.com|newgrounds\.com|bsky\.app)\/?[^\s]{0,500}/
  const link = /https?:\/\//

  if (valid.test(input)) return []
  if (link.test(input)) return [{ type: "ineligible", note: "1c. Currently allowed platforms: Bilibili, Bluesky, Dailymotion, Newgrounds, Odysee, Pony.Tube, ThisHorsie.Rocks, Tiktok, Twitter/X, Vimeo, and YouTube. This list is likely to change over time" }]
  return false
}
