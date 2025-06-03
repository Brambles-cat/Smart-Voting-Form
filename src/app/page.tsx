"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import Head from "next/head";

const fiveChannelRule = "5a. You must have at least five eligible votes from five different creators"
const noSimpingRule = "5b. You can include up to two videos from a creator if the videos are unique and you're including votes for at least five creators total. Don’t vote for multiple parts in a series or very similar videos from the same creator"

export default function Home() {
  const [initialFlags, setFlags] = useState(Array(10).fill([]))
  const [identifiers, setIdentifiers] = useState(Array(10)) // to do: ctrl z doesn't recover identifiers i think  
  const [inputs, setInputs] = useState(Array(10).fill(""))
  const [warning, setWarning] = useState(false)
  const pasting = useRef(false)

  const update = (val: any, setter: Dispatch<SetStateAction<any[]>>, index: number) => {
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

    update(input, setInputs, field_index)
    update(undefined, setIdentifiers, field_index)

    if (!input)
      update([], setFlags, field_index)
    else if (!isLink)
      update([{ type: "ineligible", note: "Not a valid link" }], setFlags, field_index)
    else if (isLink.length)
      update(isLink, setFlags, field_index)
    else {
      update(isLink, setFlags, field_index) // to do: validate after 3 seconds
      //update(identifiers, setIdentifiers, field_index)
    }
  }

  const pasted = async (e: React.ClipboardEvent<HTMLInputElement>, field_index: number) => {
    pasting.current = true

    let input = e.clipboardData.getData('text').trim();
    const isLink = testLink(input)

    update(input, setInputs, field_index)
    update(undefined, setIdentifiers, field_index)

    if (!input)
      update([], setFlags, field_index)
    else if (!isLink)
      update([{ type: "ineligible", note: "Not a valid link" }], setFlags, field_index)
    else if (isLink.length)
      update(isLink, setFlags, field_index)
    else {
      const { field_flags, vid_identifiers } = await validate(input)
      update(field_flags, setFlags, field_index)
      update(vid_identifiers, setIdentifiers, field_index)
    }
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement
    
    if (submitter.value === "warn")
      return setWarning(true)

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const values: any[] = Object.values(data)

    let votes = values.slice(0, 10)
    votes = votes.filter(val => val != "")
    
    const responses = [...votes, ...Array(10 - votes.length).fill(""), values[10]]
    
    let base = "https://docs.google.com/forms/d/e/1FAIpQLSerNfFe6sezwzd6Ban3srbq3-vP5je41gPtQLcJwYdW6HBnjg/viewform?usp=pp_url&"
    let params = [
      "entry.1827483589=",
      "entry.1498172998=",
      "entry.836977515=",
      "entry.143400031=",
      "entry.655665973=",
      "entry.1686356961=",
      "entry.999933956=",
      "entry.435149079=",
      "entry.2021319189=",
      "entry.783085083=",
      "entry.1156360311="
    ]

    base = "https://docs.google.com/forms/d/e/1FAIpQLSdVi1gUmI8c2nBnYde7ysN8ZJ79EwI5WSBTbHKqIgC7js0PYg/viewform?usp=pp_url&"
    params = [
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
      "entry.1253504862="
    ]
    
    redirect(`${base}${params.map((key, i) => `${key}${responses[i]}`).join("&")}`)
  }

  const videos = new Set()
  const creatorCounts = new Map()

  const flags: { type: string, note: string }[][] = initialFlags.map(item_flags => [...item_flags])

  for (let i in identifiers) {
    const id_set: { creator: string, video: string } | undefined = identifiers[i]

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
  const eligible = flags.filter((item_flags: any[], i) => inputs[i] && !item_flags.find(flag => flag.type === "ineligible"))  
  const eligible_gte5 = eligible.length >= 5

  const should_warn = unique_creators < 5 || !eligible_gte5 || eligible.length !== inputs.filter(input => input !== "").length
  console.log(should_warn)
  return (
    <>
    <Head>
        <title>Smort Form</title>
        <meta property="og:title" content="Test Smort Form #1" />
        <meta property="og:description" content="Paste your video links to check vote eligibility. Instant feedback. Export to Google Forms easily." />
        <meta property="og:image" content="https://i.imgur.com/dJpfSuK.jpeg" />
        <meta property="og:url" content="https://example.com/" />
        <meta property="og:type" content="website" />
    </Head>
    <div className={styles.page}>
      <div className={styles.eligible_count}>
        <b>{eligible.length}/{eligible_gte5 ? 10 : 5}</b> {eligible_gte5 && <img src={unique_creators >= 5 ? "checkmark.svg" : "x.svg"}/>}
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
                <button className={styles.go_back} onClick={(e) => {setWarning(false)}}>Go Back</button>
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
                <li>Manually typed links aren't validate with metadata yet</li>
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
        {flags.map((item_flags: any[], i) => {
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
            {(warn || ineligible) && (
              <div className={styles.info}>
                <img src={warn ? "oinfo.svg" : "rinfo.svg"}/>
                <div className={styles.note}>
                  <ul>
                    {item_flags.map((flag, i) => <li key={i}>{flag.note}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )})}
        <div className={styles.field}>
            <label>Contact Email, or Discord name, or Twitter, or Mastodon</label>
            <div>
              Feel free to leave this blank, however, <b>including consistent contact info every time you vote helps us to recognize regular voters!</b>&nbsp; It also makes it possible to contact voters if there's an issue or question. <i>More information and privacy policy can be found here: <a href="https://www.thetop10ponyvideos.com/links-info-credits/privacy-policy">https://www.thetop10ponyvideos.com/links-info-credits/privacy-policy</a></i>
            </div>
            <input
              type="text"
              name="resp10"
              className={styles.input}
              placeholder="Your answer"
            />
          </div>
        <button type="submit" value={should_warn ? "warn" : "export" } className={styles.submitButton}>Export Votes</button>
      </form>
    </div>
    </>
  );
}

function search() {

}

async function validate(url: string) {
  let res = await fetch("/api/validate", {
    method: 'POST',
    body: url,
  })

  return await res.json()
}

/**
 * @returns false if input is not a link, or an array of flags for any applicable
 */
function testLink(input: string) {
  let valid = /(https?:\/\/)?(\w+\.)?(pony\.tube|youtube\.com|youtu\.be|bilibili\.com|vimeo\.com|thishorsie\.rocks|dailymotion\.com|dai\.ly|tiktok\.com|twitter\.com|x\.com|odysee\.com|newgrounds\.com|bsky\.app)\/?[^\s]{0,500}/
  let link = /https?:\/\//

  if (valid.test(input)) return []
  if (link.test(input)) return [{ type: "ineligible", note: "1c. Currently allowed platforms: Bilibili, Bluesky, Dailymotion, Newgrounds, Odysee, Pony.Tube, ThisHorsie.Rocks, Tiktok, Twitter/X, Vimeo, and YouTube. This list is likely to change over time" }]
  return false
}
