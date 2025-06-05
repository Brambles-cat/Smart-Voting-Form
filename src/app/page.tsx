"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import Image from "next/image";
import { ValidationResponse } from "@/lib/types";

const fiveChannelRule = "5a. You must have at least five eligible votes from five different creators"
const noSimpingRule = "5b. You can include up to two videos from a creator if the videos are unique and you're including votes for at least five creators total. Don’t vote for multiple parts in a series or very similar videos from the same creator"

export default function Home() {
  const [initialFlags, setFlags] = useState(Array(10).fill([]))
  const [identifiers, setIdentifiers] = useState(Array(10).fill(null)) // to do: ctrl z doesn't recover identifiers i think  
  const [inputs, setInputs] = useState(Array(10).fill(""))
  const [warning, setWarning] = useState(false)
  const pasting = useRef(false)

  const updateArr = (val: unknown, setter: Dispatch<SetStateAction<unknown[]>>, index: number) => {
    setter(old => {
      const updated = [...old]
      updated[index] = val
      return updated
    })
  }

  const typed = (e: React.ChangeEvent<HTMLInputElement>, field_index: number) => {
    if (pasting.current)
      return pasting.current = false
    
    const input = e.currentTarget.value.trim()
    const isLink = testLink(input)

    updateArr(input, setInputs, field_index)
    updateArr(null, setIdentifiers, field_index)

    if (!input)
      updateArr([], setFlags, field_index)
    else if (!isLink)
      updateArr([{ type: "ineligible", note: "Not a valid link" }], setFlags, field_index)
    else if (isLink.length)
      updateArr(isLink, setFlags, field_index)
    else {
      updateArr(isLink, setFlags, field_index) // to do: validate after 3 seconds
      //update(identifiers, setIdentifiers, field_index)
    }
  }

  const pasted = async (e: React.ClipboardEvent<HTMLInputElement>, field_index: number) => {
    pasting.current = true

    const input = e.clipboardData.getData('text').trim();
    const isLink = testLink(input)

    updateArr(input, setInputs, field_index)
    updateArr(undefined, setIdentifiers, field_index)

    if (!input)
      updateArr([], setFlags, field_index)
    else if (!isLink)
      updateArr([{ type: "ineligible", note: "Not a valid link" }], setFlags, field_index)
    else if (isLink.length)
      updateArr(isLink, setFlags, field_index)
    else {
      updateArr(null, setIdentifiers, field_index)
      const { field_flags, vid_identifiers } = await validate(input)
      updateArr(field_flags, setFlags, field_index)
      updateArr(vid_identifiers, setIdentifiers, field_index)
    }
  }

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

  const flags: { type: string, note: string }[][] = initialFlags.map(item_flags => { return [...item_flags] })

  for (const i in identifiers) {
    const id_set: { creator: string, video: string } | null = identifiers[i]

    if (!id_set)
      continue

    if (videos.has(id_set.video))
      flags[i].push({ type: "ineligible", note: "Duplicate votes are not eligible" })
    else
      videos.add(id_set.video)

    const newCount = (creatorCounts.get(id_set.creator) || 0) + 1
    creatorCounts.set(id_set.creator, newCount)

    if (newCount > 2)
      flags[i].push({ type: "ineligible", note: noSimpingRule })
  }

  const unique_creators = creatorCounts.size
  const eligible = flags.filter((item_flags: { type: string, note: string }[], i) => inputs[i] && !item_flags.find(flag => flag.type === "ineligible"))  
  const eligible_gte5 = eligible.length >= 5

  const should_warn = unique_creators < 5 || !eligible_gte5 || eligible.length !== inputs.filter(input => input !== "").length
  return (
    <div className={styles.page}>
      <div className={styles.eligible_count}>
        <b>{eligible.length}/{eligible_gte5 ? 10 : 5}</b> {eligible_gte5 && <Image src={unique_creators >= 5 ? "checkmark.svg" : "x.svg"} alt="" width={20} height={20} />}
        <div className={`${styles.eligible_count_note} ${eligible_gte5 && (unique_creators >= 5 && styles.good) || styles.ineligible}`}>{eligible_gte5 ? (unique_creators >= 5 ? "Minimum 5 eligible vote requiremnt met!" : <div>{fiveChannelRule}<div><b>{unique_creators}/5</b> unique creators present</div></div> ) : "1a. Vote for a minimum of 5 eligible videos and maximum of 10" }</div>
      </div>
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
          <label>Test Smort Form #1</label>
          <div>Features:</div>
          <ul>
            <li>
              Vote validation upon link pasting
              <ul>
                <li>Rules Checked: 1a, 2a, 4a, 5a, 5b, 5d, no duplicates (3b?)</li>
                <li>Red for ineligible</li>
                <li>Yellow for potentially ineligible</li>
                <li>Manually typed links aren&apos;t validated with metadata yet</li>
              </ul>
            </li>
            <li>
              Export Votes button to transfer them to the real form
              <ul>
                <li>Votes can be in any spot, but will be exported to fill required fields first in the real form</li>
                <li>Will only warn if flagged votes are present, in case of false positives</li>
              </ul>
            </li>
            <li>Indicators for ineligible or potentially so votes that detail the reason(s) why it was flagged</li>
            <li>✨Google Forms Plagiarism✨</li>
          </ul>
        </div>
        {flags.map((item_flags: { type: string, note: string }[], i) => {
          const warn = item_flags.find(flag => flag.type === "warn"), ineligible = item_flags.find(flag => flag.type === "ineligible")
          return (
          <div key={i} className={`${styles.field} ${ineligible ? styles.ineligible : (warn ? styles.warn : "")}`}>
            <input
              type="text"
              name={"resp" + i}
              onChange={e => typed(e, i)}
              onPaste={(e) => pasted(e, i)}
              className={styles.input}
              placeholder="Your answer"
            />
            <div className={styles.info}>
              {inputs[i] && (
                identifiers[i] === null && <div className={styles.loading_icon}/> ||
                (warn || ineligible) && <>
                  <Image src={warn ? "oinfo.svg" : "rinfo.svg"} alt="" width={36} height={36} />
                  <div className={styles.note}>
                    <ul>
                      {item_flags.map((flag, i) => <li key={i}>{flag.note}</li>)}
                    </ul>
                  </div>
                </> || <Image src={"checkmark.svg"} alt="" width={20} height={20} />
            )}
            </div>
          </div>
        )})}
        <div className={styles.field}>
          <label>Contact Email, or Discord name, or Twitter, or Mastodon</label>
          <div>
            Feel free to leave this blank, however, <b>including consistent contact info every time you vote helps us to recognize regular voters!</b>&nbsp; It also makes it possible to contact voters if there&apos;s an issue or question. <i>More information and privacy policy can be found here: <a href="https://www.thetop10ponyvideos.com/links-info-credits/privacy-policy">https://www.thetop10ponyvideos.com/links-info-credits/privacy-policy</a></i>
          </div>
          <div className={styles.input} style={{ color: "grey", fontSize: 14, pointerEvents: "none" }}>For privacy reasons, only enter contact info on the official form :)</div>
        </div>
        <button type="submit" value={should_warn ? "warn" : "export" } className={styles.submitButton}>Export Votes</button>
      </form>
    </div>
  );
}

// function search() {

// }

async function validate(url: string): Promise<ValidationResponse> {
  const res = await fetch("/api/validate", {
    method: 'POST',
    body: url,
  })

  return await res.json()
}

/**
 * @returns false if input is not a link, or an array of flags for any applicable
 */
function testLink(input: string) {
  const valid = /(https?:\/\/)?(\w+\.)?(pony\.tube|youtube\.com|youtu\.be|bilibili\.com|vimeo\.com|thishorsie\.rocks|dailymotion\.com|dai\.ly|tiktok\.com|twitter\.com|x\.com|odysee\.com|newgrounds\.com|bsky\.app)\/?[^\s]{0,500}/
  const link = /https?:\/\//

  if (valid.test(input)) return []
  if (link.test(input)) return [{ type: "ineligible", note: "1c. Currently allowed platforms: Bilibili, Bluesky, Dailymotion, Newgrounds, Odysee, Pony.Tube, ThisHorsie.Rocks, Tiktok, Twitter/X, Vimeo, and YouTube. This list is likely to change over time" }]
  return false
}
