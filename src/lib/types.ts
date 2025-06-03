export type VideoData = {
    title: string,
    video_id: string,
    uploader: string,
    upload_date: number,
    duration: number | undefined,
    platform: string
}

export type Flag = {
    type: string,
    note: string
}
