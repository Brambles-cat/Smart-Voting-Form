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

export type Flag = {
    type: "ineligible" | "warn" | "eligible"
    note: string
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

export type APIValidateRequestBody = {
    link: string
    index: number
}

export type APIValidateResponseBody = {
    field_flags: Flag[]
    video_data?: video_metadata
    ballot_id?: string
}

export type APIAddRequestBody = {
    link: string
    playlist_id: string
    index: number
    name: string
    description: string
}

export type APIAddResponseBody = {
    metadata: VideoDataClient
    playlist_id: string
} | {
    field_flags: Flag[]
}

export type APIRemoveRequestBody = {
    index: number
    playlist_id: string | "ballot"
    playlist_name: string
    playlist_desc: string
}

export type APIEditPlaylistRequestBody = {
    name: string
    description: string
    playlist_id: string
}
