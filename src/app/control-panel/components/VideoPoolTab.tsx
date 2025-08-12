"use client";

import ConstructionZone from "@/app/placeholder";
import { VideoPoolItem } from "@/lib/types";
import { useEffect, useState } from "react";
import styles from "../page.module.css"

function VideoTile({ i, item }: { i: number, item: VideoPoolItem }) {
  const s = item.votes !== 1
  return (
  <div className={styles.video_tile}>
    <img src={item.thumbnail}
      style={{width: "inherit", maxWidth: "inherit", display: "block"}}
      alt="" fetchPriority="low" loading="lazy" decoding="async" referrerPolicy="no-referrer"
    />
    <p className={styles.tile_details} style={{zIndex: 50 - i}}>
      <b>{item.votes} vote{s && "s"}</b><br/>
      {item.title}<br/><br/>
      <b>Uploader:</b><br/>
      {item.uploader}<br/><br/>
      <b>Platform:</b><br/>
      {item.platform}
    </p>
  </div>
  )
}

export default function VideoPoolTab() {
  const [pool, setPool] = useState<VideoPoolItem[]>([])

  useEffect(() => {
    fetch("/api/pool")
      .then(res => res.json())
      .then(p => { console.log(p); setPool(p) })
  }, [])

  return (
    process.env.NODE_ENV === "production" && <ConstructionZone/> ||

    <div className={styles.pool}>
    {pool.map((item, i) => (
      <VideoTile key={i} item={item} i={i}/>
    ))}
    </div>
  )
}
