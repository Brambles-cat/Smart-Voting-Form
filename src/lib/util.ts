// A random assortent of helper functions that are needed in multiple areas of the project

import { video_metadata } from "@/generated/prisma";
import { Flag, VideoDataClient, VideoPlatform } from "./types";
import { labels } from "./labels";

/*const platform_bases = {
    "YouTube": "www.youtube.com/watch?v=_id_",
    "Dailymotion": "www.dailymotion.com/video/_id_",
    "Vimeo": "vimeo.com/_id_",
    "ThisHorsieRocks": "pt.thishorsie.rocks/w/_id_",
    "PonyTube": "pony.tube/w/_id_",
    "Bilibili": "www.bilibili.com/video/_id_",
    "Twitter": "x.com/_uid_/status/_id_",
    "Bluesky": "bsky.app/profile/_uid_/post/_id_",
    "Tiktok": "www.tiktok.com/_uid_/video/_id_",
    "Odysee": "odysee.com/_uid_/_id_",
    "Newgrounds": "www.newgrounds.com/portal/view/_id_"
}

/**
 * Reconstructs a video link from a videos metadata
 * @param data An object containing the platform, id, and uploader id of a video,
 * which are the maximum needed to reconstruct any link from the supported platforms
 * @returns The reconstructed link
 * /
export function getVideoLink(data: { platform: string, id: string, uploader_id: string }) {
    return `https://${platform_bases[data.platform as VideoPlatform].replace("_id_", data.id).replace("_uid_", data.uploader_id)}`
}
*/

const platform_bases_temp = {
    "YouTube": "www.youtube.com/watch?v=",
    "Dailymotion": "www.dailymotion.com",
    "Vimeo": "vimeo.com",
    "ThisHorsieRocks": "pt.thishorsie.rocks",
    "PonyTube": "pony.tube",
    "Bilibili": "www.bilibili.com",
    "Twitter": "x.com",
    "Bluesky": "bsky.app/profile",
    "Tiktok": "www.tiktok.com",
    "Odysee": "odysee.com",
    "Newgrounds": "www.newgrounds.com"
}

export function getVideoLinkTemp(data: { platform: string, id: string, uploader_id: string }) {
    return `https://${platform_bases_temp[data.platform as VideoPlatform]}${data.id}`
}

/**
 * Truncates and transforms video metadata to only what the client needs
 */
export function toClientVideoMetadata(video_metadata: video_metadata): VideoDataClient {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { whitelisted, duration, upload_date, ...clientReceivable } = video_metadata
    const withLink = {...clientReceivable, link: getVideoLinkTemp(clientReceivable) }
    return withLink
}

/**
 * Tests an input string to determine if it is a valid link
 * @returns false if input doesn't resemble a link, or an array of 0 or 1 flag if the link is or isn't from a supported platform respectively
 */
export function testLink(input: string): false | Flag[] {
    input = input.trim()
    if (!/^[^\s]+$/.test(input)) return false
    
    const valid = /(https?:\/\/)?(\w+\.)?(pony\.tube|youtube\.com|youtu\.be|bilibili\.com|vimeo\.com|thishorsie\.rocks|dailymotion\.com|dai\.ly|tiktok\.com|twitter\.com|x\.com|odysee\.com|newgrounds\.com|bsky\.app)\/?[^\s]{0,500}/
    const link = /(https?:\/\/)?[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+/

    if (valid.test(input)) return []
    if (link.test(input)) return [labels.unsupported_site]
    return false
}
