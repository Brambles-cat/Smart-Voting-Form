import { spawn } from "child_process"
import { YTDLPItems, Flag, VideoPlatform } from "./types"
import { getVideoMetadata, saveVideoMetadata } from "./internal"
import { video_metadata } from "@/generated/prisma"

// Variants of youtube domains that might be used
const youtube_domains = ["m.youtube.com", "www.youtube.com", "youtube.com", "youtu.be"]

// Non youtube domains that are also supported
const accepted_domains = [
    "dailymotion.com",
    "pony.tube",
    "vimeo.com",
    "bilibili.com",
    "thishorsie.rocks",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "odysee.com",
    "newgrounds.com"
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
        });

        cmd.stderr.on('data', (data) => {
            reject(data)
        });

        cmd.on('close', () => {
            try {
                resolve(JSON.parse(response))
            } catch {
                reject(`Failed to parse json: ${response}`)
            }
        });
    })
}

/**
 * Given a YouTube video URL, extracts the video id from it.
 * 
 * Returns None if no video id can be extracted.
 */
function extract_video_id(url: URL) {
    let video_id: string | null = null

    const path = url.pathname
    const query_params = url.searchParams

    // Regular YouTube URL: eg. https://www.youtube.com/watch?v=9RT4lfvVFhA
    if (path === "/watch")
        video_id = query_params.get("v")
    else {
        const livestream_match = /^\/live\/([a-zA-Z0-9_-]+)/.exec(path)
        const shortened_match = /^\/([a-zA-Z0-9_-]+)/.exec(path)

        if (livestream_match)
            // Livestream URL: eg. https://www.youtube.com/live/Q8k4UTf8jiI
            video_id = livestream_match[1]
        else if (shortened_match)
            // Shortened YouTube URL: eg. https://youtu.be/9RT4lfvVFhA
            video_id = shortened_match[1]
    }

    return video_id
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
    const video_id = extract_video_id(url)

    if (!video_id)
        return { type: "ineligible", note: "No video id present" }

    let video_data = await getVideoMetadata(video_id, "YouTube")

    if (video_data)
        return video_data

    const id_param = new URLSearchParams({ id: video_id })
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${id_param}&part=snippet,contentDetails&key=${process.env.API_KEY}`)
    const response_data = await response.json()
    const response_item = response_data["items"][0]

    if (!response_item)
        return { type: "ineligible", note: "Video is not public or unavailable" }

    const snippet = response_item["snippet"]
    const iso8601_duration = response_item["contentDetails"]["duration"]

    video_data = {
        title: snippet["title"],
        video_id: video_id,
        thumbnail: snippet.thumbnails.medium.url,
        uploader: snippet["channelTitle"],
        uploader_id: snippet["channelId"],
        upload_date: new Date(snippet["publishedAt"]),
        duration: convert_iso8601_duration_to_seconds(iso8601_duration),
        platform: "YouTube",
    } as video_metadata

    saveVideoMetadata(video_data)
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
        return { type: "ineligible", note: "1c. Currently allowed platforms: Bilibili, Bluesky, Dailymotion, Newgrounds, Odysee, Pony.Tube, ThisHorsie.Rocks, Tiktok, Twitter/X, Vimeo, and YouTube. This list is likely to change over time" }

    const path_bits = url.pathname.split("/")
    const video_id = (path_bits.at(-1) === "" ? path_bits.at(-2) : path_bits.at(-1))?.toLowerCase()

    if (!video_id)
        return { type: "ineligible", note: "No video id present" }

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
    }

    let video_data = await getVideoMetadata(video_id, site)

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
        return { type: "ineligible", note: "Could not find a video associated with this link" }
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
        video_id: video_id,
        thumbnail: response["thumbnail"] || null,
        uploader: response["uploader"],
        uploader_id: response["uploader_id"],
        upload_date: new Date(`${date_str.slice(0, 4)}-${date_str.slice(4, 6)}-${date_str.slice(6)}`),
        duration: response["duration"] || null,
        platform: site.charAt(0).toUpperCase() + site.slice(1),
    } as video_metadata

    saveVideoMetadata(video_data)
    return video_data
}

export async function fetch_metadata(url_str: string) {
    const url = new URL(url_str)
    return youtube_domains.includes(url.hostname) ? from_youtube(url) : from_other(url)
}

const platform_bases = {
    "YouTube": "www.youtube.com/watch?v=_id_",
    "Dailymotion" : "www.dailymotion.com/video/_id_",
    "Vimeo" : "vimeo.com/_id_",
    "ThisHorsieRocks" : "pt.thishorsie.rocks/w/_id_",
    "PonyTube" : "pony.tube/w/_id_",
    "Bilibili" : "www.bilibili.com/video/_id_",
    "Twitter" : "x.com/_uid_/status/_id_",
    "Bluesky" : "bsky.app/profile/_uid_/post/_id_",
    "Tiktok" : "www.tiktok.com/_uid_/video/_id_",
    "Odysee" : "odysee.com/_uid_/_id_",
    "Newgrounds" : "www.newgrounds.com/portal/view/_id_"
}

export function getVideoLinks(dataList: video_metadata[]) {
  return dataList.map(videoData => videoData ? `https://${platform_bases[videoData.platform as VideoPlatform].replace("_id_", videoData.video_id).replace("_uid_", videoData.uploader)}` : "")
}
