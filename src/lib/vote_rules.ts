import { video_metadata } from "@/generated/prisma";
import { BallotEntryField, Flag } from "./types";
import { client_labels, labels } from "./labels";

/**
 * Server side checks of video metadata to determine eligibility
 * @returns A list of flags for any that may apply to the video
 */
export function video_check(video_metadata: video_metadata): Flag[] {
    const flags: Flag[] = []

    const now = new Date(Date.now())
    const period_offset = now.getDate() > 8 ? 0 : -1 // todo: adjustable in case of extending voting period
    const current_period = (now.getMonth() + period_offset + 12) % 12
    const period_year = now.getFullYear() - +(current_period === 11 && period_offset === -1)

    const upload_date = video_metadata.upload_date
    const u_month = upload_date.getMonth(), u_date = upload_date.getDate(), u_year = upload_date.getFullYear()
    const from_last_day = new Date(u_year, u_month + 1, 0).getDate() === u_date

    const acceptable_month_range =
        u_month === current_period ||
        ((u_month + 1) % 12 === current_period && from_last_day) ||
        (u_month === current_period && u_date === 1)

    const acceptable_year_range =
        u_year === period_year ||
        (u_month === 0 && u_date === 1 && u_year - period_year === 1)

    if(!(acceptable_month_range && acceptable_year_range))
        flags.push(labels.wrong_period)
    // My gosh im gonna kms if i need to work with date times again

    if (!video_metadata.duration)
        video_metadata.duration = 32
    
    if (video_metadata.duration < 30)
        flags.push(labels.too_short)
    else if (video_metadata.duration <= 45)
        flags.push(labels.maybe_too_short)

    if (video_metadata.uploader === "LittleshyFiM")
        flags.push(labels.littleshy_vid)

    return flags
}

/**
 * Client side checks for ballot eligibility rules
 * @param entries ballot entries
 * @param cli_labels labels passed from server side rendering
 * @returns The number of unique creators found, eligible entries, and all entries with ballot flags included
 */
export function ballot_check(entries: BallotEntryField[], cli_labels: client_labels) {
  const uniqueVids = new Set<string>()
  const creatorCounts = new Map<string, number>()
  const entryCopies = entries.map(e => ({ ...e, flags: [...e.flags] })) // Shallow-ish copy to avoid accumulating the same flags in entries

  for (const entry of entryCopies) {
    if (!entry.videoData)
      continue

    const vid_id = `${entry.videoData.id}-${entry.videoData.platform}`
    const creator_id = `${entry.videoData.uploader}-${entry.videoData.platform}`

    if (uniqueVids.has(vid_id))
      entry.flags.push(cli_labels.duplicate_votes)
    else
      uniqueVids.add(vid_id)

    // Don't count creators from ineligible votes since some otherwise eligible votes may be flagged
    if (entry.flags.some(f => f.type === "ineligible"))
      continue

    const newCount = (creatorCounts.get(entry.videoData.uploader) || 0) + 1
    creatorCounts.set(creator_id, newCount)
  }

  for (const entry of entryCopies) {
    if (!entry.videoData)
      continue

    const creator_id = `${entry.videoData.uploader}-${entry.videoData.platform}`
    const instances = creatorCounts.get(creator_id)!

    if (instances > 2 || instances === 2 && creatorCounts.size < 5)
      entry.flags.push(cli_labels.no_simping)
  }

  return {
    uniqueCreators: creatorCounts.size,
    eligible: entryCopies.filter(entry => entry.input && !entry.flags.some(f => f.type === "ineligible")),
    checkedEntries: entryCopies
  }
}
