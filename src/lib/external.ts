// Methods for extracting video metadata from external sources

import { spawn } from "child_process"
import { YTDLPItems, Flag } from "./types"
import { getVideoMetadata, saveVideoMetadata } from "./database"
import { video_metadata } from "@/generated/prisma"
import { labels } from "./labels"

// Variants of youtube domains that might be used
const youtube_domains = ["m.youtube.com", "www.youtube.com", "youtube.com", "youtu.be"]

// Non youtube domains that are also supported
const accepted_domains = [
    "dailymotion.com",
    "dai.ly",
    "pony.tube",
    "vimeo.com",
    "bilibili.com",
    "thishorsie.rocks",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "odysee.com",
    "newgrounds.com",
    "bsky.app"
]

async function ytdlp_fetch(url: string): Promise<YTDLPItems | { entries: YTDLPItems[] }> {
    return new Promise((resolve, reject) => {
        const cmd = spawn("yt-dlp", [
            "-q",
            "--no-download",
            "--dump-json",
            "--no-warnings",
            "--sleep-interval", "2",
            "--use-extractors",
                "twitter,Newgrounds,lbry,TikTok,PeerTube,vimeo,BiliBili,dailymotion,Bluesky,generic",
            "--cookies", "cookies.txt",
            url
        ])

        let response = ""

        cmd.stdout.on('data', (data) => {
            response += data.toString()
        })

        cmd.stderr.on('data', (data) => {
            reject(data)
        })

        cmd.on('close', () => {
            try {
                resolve(JSON.parse(response))
            } catch {
                reject(`Failed to parse json: ${response}`)
            }
        })
    })
}

/**
 * Given a YouTube video URL, extracts the video id from it.
 * 
 * Returns null if no video id can be extracted.
 */
function extract_yt_id(url: URL): string | undefined {
    // Parse the URL to retrieve the video id, which is the only parameter we
    // care about for the purpose of normalization. We currently recognize the
    // following types of YouTube URL, some of which have the video id in a
    // different place:
    //
    // Regular YouTube URL:      https://www.youtube.com/watch?v={VIDEO ID}
    // No-subdomain YouTube URL: https://youtube.com/watch?v={VIDEO ID}
    // Mobile YouTube URL:       https://m.youtube.com/watch?v={VIDEO ID}
    // Livestream URL:           https://www.youtube.com/live/{VIDEO ID}
    // Shortened URL:            https://youtu.be/{VIDEO ID}
    // Shorts URL                https://www.youtube.com/shorts/{VIDEO ID}

    const path = url.pathname.split("/")[1]
    let match: RegExpExecArray | null = null

    if (["watch", "live", "shorts"].includes(path)) {
        const part = url.pathname + url.search

        const patterns = [
            /^\/watch\/?\?(?:.*&)?v=([a-zA-Z0-9_-]+)/, // Regular YouTube URL: eg. https://www.youtube.com/watch?v=9RT4lfvVFhA
            /^\/shorts\/([a-zA-Z0-9_-]+)/, // Shorts URL: eg. https://www.youtube.com/shorts/5uFeg2BOPNo
            /^\/live\/([a-zA-Z0-9_-]+)/, // Livestream URL: eg. https://www.youtube.com/live/Q8k4UTf8jiI
        ]
        patterns.find(pattern => match = pattern.exec(part))
    }
    else {
        // Shortened YouTube URL: eg. https://youtu.be/9RT4lfvVFhA
        match = /^([a-zA-Z0-9_-]+)/.exec(path)
    }

    // Youtube video ids are strictly 11 characters
    return match?.[1].slice(0, 11)
}

/**
 * Given an ISO 8601 duration string, return the length of that duration in seconds.
 */
function convert_iso8601_duration_to_seconds(iso8601_duration: string) {

    if (iso8601_duration.startsWith("PT"))
        iso8601_duration = iso8601_duration.slice(2)

    let total_seconds = 0, hours = 0, minutes = 0, seconds = 0

    if (iso8601_duration.includes("H")) {
        const [hours_part, remainder] = iso8601_duration.split("H")
        iso8601_duration = remainder
        hours = parseInt(hours_part)
    }

    if (iso8601_duration.includes("M")) {
        const [minutes_part, remainder] = iso8601_duration.split("M")
        iso8601_duration = remainder
        minutes = parseInt(minutes_part)
    }

    if (iso8601_duration.includes("S")) {
        const seconds_part = iso8601_duration.replace("S", "")
        seconds = parseInt(seconds_part)
    }

    total_seconds = hours * 3600 + minutes * 60 + seconds

    return total_seconds
}

async function from_youtube(url: URL): Promise<video_metadata | Flag> {
    const video_id = extract_yt_id(url)

    if (!video_id)
        return labels.missing_id

    let video_data = await getVideoMetadata(video_id, "YouTube")

    if (video_data)
        return video_data

    const id_param = new URLSearchParams({ id: video_id })
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${id_param}&part=snippet,contentDetails&key=${process.env.API_KEY}`)
    const response_data = await response.json()
    const response_item = response_data["items"][0]

    if (!response_item)
        return labels.unavailable

    const snippet = response_item["snippet"]
    const iso8601_duration = response_item["contentDetails"]["duration"]

    video_data = {
        title: snippet["title"],
        id: video_id,
        thumbnail: snippet.thumbnails.medium.url,
        uploader: snippet["channelTitle"],
        uploader_id: snippet["channelId"],
        upload_date: new Date(snippet["publishedAt"]),
        duration: convert_iso8601_duration_to_seconds(iso8601_duration),
        platform: "YouTube",
    } as video_metadata

    await saveVideoMetadata(video_data)
    return video_data
}

/**
 * Query yt-dlp for the given URL.
 */
async function from_other(url: URL): Promise<video_metadata | Flag> {
    let netloc = url.hostname
    
    if (netloc.indexOf(".") != netloc.lastIndexOf("."))
        netloc = netloc.slice(netloc.indexOf(".") + 1)

    if (!(accepted_domains.includes(netloc)))
        return labels.unsupported_site

    /**
     * Non yotube videos seem to have their ids completely within the
     * url path, so it should be fine if that is used as the id in the db
     * until otherwise necessary. This resolves the issue of potential links
     * with multiple videos, such as https://x.com/_Maka_11/status/1790185560805683463/video/1
     * which contains a post id and an index
     */
    const video_db_id = url.pathname

    if (!video_db_id)
        return labels.missing_id

    let site: string = netloc.split(".")[0]
    site = site[0].toUpperCase() + site.slice(1)

    switch (site) {
        case "X":
            site = "Twitter"
            break
        case "Bsky":
            site = "Bluesky"
            break
        case "Pony":
            site = "PonyTube"
            break
        case "Thishorsie":
            site = "ThisHorsieRocks"
            break
        case "Dai":
            site = "Dailymotion"
            break
    }

    let video_data = await getVideoMetadata(video_db_id, site)

    if (video_data)
        return video_data

    const url_str = url.toString()
    let response = undefined
    try {
        response = await ytdlp_fetch(url_str)

        if ("entries" in response)
            response = response["entries"][0]
    } catch (error) {
        console.log(error)
        return labels.unavailable
    }

    /* Some urls might have specific issues that should
    be handled here before they can be properly processed
    If yt-dlp gets any updates that resolve any of these issues
    then the respective case should be updated accordingly */
    switch (site) {
        case "Twitter":
        case "X":
            response["title"] = `"${response["title"].slice(response["uploader"].length + 3)}"` // unsliced format is: uploader - title
            /* This type of url means that the post has more than one video
            and ytdlp will only successfully retrieve the duration if
            the video is at index one */
            if (
                url_str.slice(0, url_str.lastIndexOf("/")).endsWith("/video") && // TODO revisit logic
                parseInt(url_str.slice(url_str.lastIndexOf("/") + 1)) != 1
            )
                response["duration"] = undefined
            break
        case "Odysee":
            response["uploader"] = response["channel"]
            break
        case "Tiktok":
            response["uploader"] = response["channel"]
            response["uploader_id"] = `@${response["uploader"]}`
            break
        case "Newgrounds":
            response["uploader_id"] = response["uploader"]
            break
    }

    const date_str: string = response["upload_date"]

    video_data = {
        title: response["title"],
        id: video_db_id,
        thumbnail: response["thumbnail"] || "",
        uploader: response["uploader"],
        uploader_id: response["uploader_id"],
        upload_date: new Date(`${date_str.slice(0, 4)}-${date_str.slice(4, 6)}-${date_str.slice(6)}`),
        duration: response["duration"] || null,
        platform: site.charAt(0).toUpperCase() + site.slice(1),
    } as video_metadata

    await saveVideoMetadata(video_data)
    return video_data
}

/**
 * Given a video url, fetch metadata from its respective platform if supported
 * @param url_str a link to a video
 * @returns A video metadata object if the fetch was successful, or a Flag that details what went wrong
 */
export async function fetch_metadata(url_str: string) {
    if (!url_str.startsWith("https://"))
        url_str = "https://" + url_str

    const url = new URL(url_str)
    return youtube_domains.includes(url.hostname) ? from_youtube(url) : from_other(url)
}
