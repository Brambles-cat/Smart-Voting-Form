export type VideoData = {
    title: string | null,
    video_id: string,
    uploader: string | null,
    upload_date: Date | null,
    duration: number | null,
    platform: string
}

export type Flag = {
    type: string,
    note: string
}

export type ValidationResponse = {
    field_flags: Flag[],
    vid_identifiers: { creator: string, video: string }
}

export type YTDLPItems = {
    channel: string,
    upload_date: string,
    title: string,
    id: string,
    uploader: string,
    duration: number | undefined
}
