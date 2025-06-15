import { cookies } from "next/headers";
import VoteForm from "./components/voting_form";
import { getBallotItems, getItemListData } from "@/lib/internal";
import styles from "./page.module.css"
import { getVideoLinks } from "@/lib/external";
import check from "@/lib/vote_rules";

export default async function Home() {
  const userCookies = await cookies()
  const userId = userCookies.get("uid")!.value

  const ballotItems = await getBallotItems(userId).catch(console.log) || []
  const dataItems = await getItemListData(ballotItems)

  const itemMap = new Map(dataItems.map(item => [item.video_id, item]))
  const dataList = Array(10).fill(null)

  ballotItems.forEach(item => dataList[item.playlist_index] = itemMap.get(item.video_id))

  const
    inputs = getVideoLinks(dataList),
    flags = dataList.map(i => i ? check(i) : [])

  return (
    <div className={styles.page}>
      <VoteForm i_inputs={inputs} i_flags={flags} i_video_data={dataList}/>
    </div>
  )
}
