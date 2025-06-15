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

export type VideoDataClient = Omit<video_metadata, "upload_date" | "duration" | "whitelisted">

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
    uploader_id: string | undefined,
    duration: number | undefined
}

export type APIValidateRequestBody = {
    link: string,
    index: number
}

export type APIValidateResponseBody = {
    field_flags: Flag[],
    video_data: video_metadata | undefined
}

export type APIRemoveRequestBody = {
    index: number
}
