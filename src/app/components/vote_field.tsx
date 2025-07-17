import { Flag, VideoDataClient } from "@/lib/types";
import styles from "../page.module.css";
import Image from "next/image";

interface Props {
  index: number
  fieldInput: string
  fieldFlags: Flag[]
  displayData: VideoDataClient | null | undefined
  onChanged: (e: React.ChangeEvent<HTMLInputElement>, field_index: number) => void
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>, field_index: number) => void
}

export default function VoteField({ index, fieldInput, fieldFlags, displayData, onChanged, onPaste }: Props) {
  const warnLevel = fieldFlags.find(flag => flag.type === "ineligible") && 2 || fieldFlags.find(flag => flag.type === "warn") && 1 || 0

  return (
    <div className={`${styles.field} ${warnLevel == 2 && styles.ineligible || warnLevel && styles.warn}`}>
      {displayData &&
        <div className={styles.video_display} style={{position: "relative"}}>
          <img className={styles.thumbnail} src={displayData.thumbnail || ""} width={160} height={90} alt="" fetchPriority="low" loading="lazy" decoding="async"/>
          {displayData.title || ""}
          <div className={styles.video_origin}>By <b>{displayData.uploader}</b> on <b>{displayData.platform}</b></div>
        </div>
      }
      <input
        type="text"
        name={"resp" + index}
        onChange={e => onChanged(e, index)}
        onPaste={(e) => onPaste(e, index)}
        value={fieldInput}
        className={styles.input}
        placeholder="Your answer"
      />
      <div className={styles.info}>
        {fieldInput && (
          displayData === undefined && <div className={styles.loading_icon}/> ||

          warnLevel && <>
            <Image src={warnLevel === 1 && "warn.svg" || "x.svg"} alt="" width={25} height={25} />
            <div className={styles.note}>
              <ul>
                {fieldFlags.map((flag, i) => <li key={i}>{flag.note}</li>)}
              </ul>
            </div>
          </> ||
          <Image src={"checkmark.svg"} alt="" width={25} height={25} />
        )}
      </div>
    </div>
  )
}