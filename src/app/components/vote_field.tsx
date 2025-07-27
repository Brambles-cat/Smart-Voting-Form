import { BallotEntryField } from "@/lib/types";
import styles from "../page.module.css";
import Image from "next/image";

interface Props {
  index: number
  voteData: BallotEntryField
  onChanged: (e: React.ChangeEvent<HTMLInputElement>, field_index: number) => void
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>, field_index: number) => void
}

export default function VoteField({ index, voteData, onChanged, onPaste }: Props) {
  const warnLevel = voteData.flags.find(flag => flag.type === "ineligible") && 2 || voteData.flags.find(flag => flag.type === "warn") && 1 || 0

  return (
    <div className={`${styles.field} ${warnLevel == 2 && styles.ineligible || warnLevel && styles.warn}`}>
      {voteData.videoData &&
        <div className={styles.video_display} style={{position: "relative"}}>
          <img className={styles.thumbnail} src={voteData.videoData.thumbnail || ""} width={160} height={90} alt="" fetchPriority="low" loading="lazy" decoding="async"/>
          {voteData.videoData.title || ""}
          <div className={styles.video_origin}>By <b>{voteData.videoData.uploader}</b> on <b>{voteData.videoData.platform}</b></div>
        </div>
      }
      <input
        type="text"
        name={"resp" + index}
        onChange={e => onChanged(e, index)}
        onPaste={(e) => onPaste(e, index)}
        value={voteData.input}
        className={styles.input}
        placeholder="Your answer"
      />
      <div className={styles.info}>
        {voteData.input && (
          voteData.videoData === undefined && <div className={styles.loading_icon}/> ||

          warnLevel && <>
            <Image src={warnLevel === 1 && "warn.svg" || "x.svg"} alt="" width={25} height={25} />
            <div className={styles.note}>
              <ul>
                {voteData.flags.map((flag, i) => <li key={i}>{flag.details}</li>)}
              </ul>
            </div>
          </> ||
          <Image src={"checkmark.svg"} alt="" width={25} height={25} />
        )}
      </div>
    </div>
  )
}