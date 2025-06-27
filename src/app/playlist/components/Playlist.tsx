"use client"

import styles from "../page.module.css";
import { VideoDataClient } from "@/lib/types";
import PlaylistItem from "./PlaylistItem";

type Props = {
  videos: VideoDataClient[]
  onRemove?: (index: number) => void
};

export default function Playlist({ videos, onRemove }: Props) {
  return (
    <div className={styles.playlistArea}>
      {videos.map((video, i) => (
        <PlaylistItem key={i} data={video} onRemove={onRemove} index={i}/>
      ))}
    </div>
  );
}
