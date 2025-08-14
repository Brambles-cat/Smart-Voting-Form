"use client";

import { VideoPoolItem } from "@/lib/types";
import { ChangeEventHandler, Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "../page.module.css"
import { getVideoLinkTemp } from "@/lib/util";
import { stampMap } from "@/lib/labels";
import Image from "next/image";

function Overlay({ videoItem, setOverlay }: { videoItem: VideoPoolItem, setOverlay: Dispatch<SetStateAction<VideoPoolItem | null>> }) {
  const manual = videoItem.flags.find(f => f.trigger === "manual")
  const [eligibility, setEligibility] = useState(manual && manual.type !== "disabled" ? manual.type.replace(/./, c => c.toUpperCase()) : "Default")

  const radioBtnChange: ChangeEventHandler<HTMLInputElement> = e => setEligibility(e.target.value)

  return (
    <div className={styles.overlay} onClick={e => {if (e.currentTarget === e.target) setOverlay(null)}}>
      <div className={styles.ItemSettingsContainer}>
        <div className={styles.thumbnailTitle}>
          <img src={videoItem.thumbnail}
            alt="" fetchPriority="low" loading="lazy" decoding="async" referrerPolicy="no-referrer"
          />
          <a href={getVideoLinkTemp(videoItem)} target="_blank" rel="noopener noreferrer">{videoItem.title}</a>
        </div>
        <p>
        </p>

        <div className={styles.overlayOptions}>
          <div>
            <input id="rbtn1" name="eligibility" value="Eligible" checked={eligibility === "Eligible"} type="radio" onChange={radioBtnChange}/>
            <label htmlFor="rbtn1">Eligible</label>
            <input id="rbtn2" name="eligibility" value="Default" checked={eligibility === "Default"} type="radio" onChange={radioBtnChange}/>
            <label htmlFor="rbtn2">Default</label>
            <input id="rbtn3" name="eligibility" value="Ineligible" checked={eligibility === "Ineligible"} type="radio" onChange={radioBtnChange}/>
            <label htmlFor="rbtn3">Ineligible</label>
          </div>
          
          <textarea placeholder="Why is this video eligible or ineligible?" value={manual?.details}/>
          <div style={{display: "flex",gap: "20px"}}>
            <button>Save</button>
            <button>Back</button>
          </div>
        </div>
      </div>
    </div>)
}

function VideoTile({ i, item, onClick }: { i: number, item: VideoPoolItem, onClick: (item: VideoPoolItem) => void }) {
  const manual = item.flags.find(f => f.trigger === "manual" && f.type !== "disabled")
  const highest_flag = item.flags.find(f => f.type === "ineligible") || item.flags.find(f => f.type === "warn") || false
  const flag = manual || highest_flag

  const s = item.votes !== 1

  return (
  <div className={styles.video_tile} onClick={() => onClick(item)}>
    <img src={item.thumbnail}
      style={{width: "inherit", maxWidth: "inherit", display: "block"}}
      alt="" fetchPriority="low" loading="lazy" decoding="async" referrerPolicy="no-referrer"
    />
    <p className={styles.tile_details} style={{zIndex: 50 - i}}>
      <span style={{display: "flex", justifyContent: "space-between"}}>
        <b>{item.votes} vote{s && "s"}</b>
        {item.whitelisted && <span className={styles.indicator}>☑️</span>}
        {flag && <Image src={stampMap[flag.type].icon} alt="" width={18} height={18}/>}
      </span>
      {item.title}<br/><br/>

      <b>Uploader:</b><br/>
      {item.uploader}<br/><br/>

      <b>Upload Date:</b><br/>
      {item.upload_date}<br/><br/>

      <b>Platform:</b><br/>
      {item.platform}
    </p>
  </div>
  )
}

export default function VideoPoolTab() {
  const [pool, setPool] = useState<VideoPoolItem[]>([])
  const [selected, setSelected] = useState<VideoPoolItem | null>(null)

  useEffect(() => {
    fetch("/api/pool")
      .then(res => res.json())
      .then(p => { setPool(p) })
  }, [])

  const settings = (item: VideoPoolItem) => setSelected(item)

  return (
    <>
    <div className={styles.pool}>
    {pool.map((item, i) => (
      <VideoTile key={i} item={item} i={i} onClick={settings}/>
    ))}
    </div>
    {selected !== null && <Overlay videoItem={selected} setOverlay={setSelected}/>}
    </>
  )
}
