import { cookies } from "next/headers";
import VoteForm from "./components/voting_form";
import { getBallotItems } from "@/lib/database";
import styles from "./page.module.css"
import { toClientVideoMetadata } from "@/lib/util";
import check from "@/lib/vote_rules";
import { IndexedVideoMetadata } from "@/lib/types";

export default async function Home() {
  const userCookies = await cookies()
  const uid = userCookies.get("uid")!.value
  const ballotItems = await getBallotItems(uid)

  const dataItems = ballotItems.map(i => ({
    ...i.video_metadata,
    playlist_index: i.index
  }))

  const dataList: (IndexedVideoMetadata | null)[] = Array(10).fill(null)
  dataItems.forEach(i => dataList[i.playlist_index] = i)

  const clientDataList = dataList.map(data_item => {
    if (!data_item) return null
    return toClientVideoMetadata(data_item)
  })

  const
    inputs = clientDataList.map(i => i ? i.link : ""),
    flags = dataList.map(i => i ? check(i) : [])

  return (
    <div className={styles.page}>
      <VoteForm i_inputs={inputs} i_flags={flags} i_video_data={clientDataList}/>
    </div>
  )
}
