"use client"

import styles from "../page.module.css";
import { playlist } from "@/generated/prisma";
import { redirect, RedirectType } from "next/navigation";

interface Props {
  playlists: playlist[]
}

export default function Playlists({ playlists }: Props) {

  return (
    <div className={styles.page_container}>
      <div className={styles.content_wrapper}>
        <header className={styles.page_header}>
          <h1 className={styles.page_title}>Your Playlists</h1>
        </header>

        <section className={styles.playlist_grid}>
        <div
          className={`${styles.card} ${styles.playlist_card} ${styles.new_playlist_card}`}
          onClick={() => redirect("/playlist", RedirectType.push)}
        >
          <div className={styles.card_content}>
            <div className={styles.playlist_header}>
              <h3 className={styles.playlist_title}>+ New Playlist</h3>
            </div>
            <p className={styles.playlist_description}>Create a new playlist</p>
          </div>
        </div>

        {playlists.map((playlist, i) => (
          <div key={i} className={`${styles.card} ${styles.playlist_card}`} onClick={() => redirect(`/playlist?list=${playlist.id}`, RedirectType.push)}>
            <div className={styles.card_content}>
              <div className={styles.playlist_header}> 
                <h3 className={styles.playlist_title}>{playlist.name}</h3> 
                <img className={styles.thumbnail} src={playlist.thumbnail!} width={160} height={90} alt="" fetchPriority="low" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>
              </div>
              <p className={styles.playlist_description}>{playlist.description}</p>
            </div>
          </div>
        ))}
        </section>
      </div>
    </div>
  )
}
