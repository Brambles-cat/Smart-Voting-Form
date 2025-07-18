"use client"

import styles from "../page.module.css";
import Playlist from "./Playlist";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { testLink } from "@/lib/util";
import { VideoDataClient } from "@/lib/types";
import { addPlaylistItem, editPlaylistMeta, removePlaylistItem } from "@/lib/api";
import { randomUUID } from "crypto";

type Props = {
  videos: VideoDataClient[]
  playlistName: string
  playlistId: string | undefined
  playlistDescription: string
};

export default function EditablePlaylist({ videos, playlistName, playlistDescription, playlistId }: Props) {
  const [entries, setEntries] = useState(videos)
  const [linkInput, setLinkInput] = useState("");
  const [nameInput, setNameInput] = useState(playlistName);
  const [descInput, setDescInput] = useState(playlistDescription);
  const playlist_id = useRef(playlistId)
  const [savedName, setSavedName] = useState(playlistName)
  const [savedDesc, setSavedDesc] = useState(playlistDescription)
  const searchParams = useSearchParams()
  const input_link_valid = useMemo(() => {
    const result = testLink(linkInput)
    return result && result.length === 0
  }, [linkInput])

  const unsaved_metadata = descInput !== savedDesc || nameInput !== savedName

  const addVideo = async () => {
    const pid = playlist_id.current || randomUUID()
    const body = await addPlaylistItem(linkInput, pid)

    setLinkInput("")

    if ("error" in body)
      return alert(body.error)

    if (!entries.length) {
      setSavedDesc(descInput)
      setSavedName(nameInput)
    }

    playlist_id.current = pid

    const params = new URLSearchParams(searchParams.toString());
    params.set("list", playlist_id.current);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);

    setEntries([...entries, body.metadata])
  };

  const removeVideo = async (index: number) => {
    let body = await removePlaylistItem(playlist_id.current!, index)

    if (body)
      return alert(body)

    const spliced = [...entries]
    spliced.splice(index, 1)
    setEntries(spliced)
  }

  const editPlaylist = async () => {
    const success = await editPlaylistMeta(nameInput, descInput, playlist_id.current!)

    if (success) {
      setSavedName(nameInput)
      setSavedDesc(descInput)
    }
  }

  return (
    <div className={styles.playlistEditor}>
      <div>
        {entries[0]?.thumbnail && (
          <img
            src={entries[0].thumbnail}
            className={styles.playlistThumbnail}
            alt=""
          />
        )}
        <div className={styles.settings}>
          <input value={nameInput} type="text" className={styles.playlistName} onChange={e => setNameInput(e.currentTarget.value)}/>
          <textarea value={descInput} className={styles.description} placeholder="Add a description..." onChange={e => setDescInput(e.currentTarget.value) /* todo: character limit */}/>
          <button disabled={!unsaved_metadata} className={`${styles.saveButton} ${!unsaved_metadata && styles.disabledButton}`} onClick={editPlaylist}>Save</button>
        </div>
      </div>

      <div className={styles.playlistArea}>
        <div className={styles.addVideoRow}>
          <input
            placeholder="Enter video link"
            value={linkInput}
            className={styles.videoLinkInput}
            onChange={e => setLinkInput(e.currentTarget.value.trim())}
          />
          <button
            disabled={!input_link_valid}
            className={`${styles.addVideoButton} ${!input_link_valid && styles.disabledButton}`}
            onClick={addVideo}
          >
            Add Video
          </button>
        </div>
        <Playlist videos={entries} onRemove={removeVideo}/>
      </div>
    </div>
  );
}
