// Verbatim

import { video_metadata } from "@/generated/prisma"

export type VideoPlatform =
    "YouTube" |
    "Dailymotion" |
    "Vimeo" |
    "ThisHorsieRocks" |
    "PonyTube" |
    "Bilibili" |
    "Twitter" |
    "Bluesky" |
    "Tiktok" |
    "Odysee" |
    "Newgrounds"

export type IndexedVideoMetadata = video_metadata & { playlist_index: number }

export type VideoDataClient = Omit<IndexedVideoMetadata, "upload_date" | "duration" | "whitelisted" | "playlist_index"> & { link: string }

/**
 * Used to signify a videos eligibility status
 * 
 * The context these flags are used in determine what their values can be assumed to be
 */
export type Flag = {
    type: "ineligible" | "warn" | "eligible"
    note: string
}

export type LabelConfig = {
    name: string,
    type: "ineligible" | "warn" | "eligible",
    trigger: string
    details: string,
}

export type YTDLPItems = {
    channel: string
    thumbnail: string
    upload_date: string
    title: string
    id: string
    uploader: string
    uploader_id: string | undefined
    duration: number | undefined
}
