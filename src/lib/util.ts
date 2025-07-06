// A random assortent of helper functions that are needed in multiple areas of the project

import { video_metadata } from "@/generated/prisma";
import { Flag, VideoDataClient, VideoPlatform } from "./types";

const platform_bases = {
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
 */
export function getVideoLink(data: { platform: string, id: string, uploader_id: string }) {
    return `https://${platform_bases[data.platform as VideoPlatform].replace("_id_", data.id).replace("_uid_", data.uploader_id)}`
}

/**
 * Truncates and transforms video metadata to only what the client needs
 */
export function toClientVideoMetadata(video_metadata: video_metadata): VideoDataClient {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { whitelisted, duration, upload_date, ...clientReceivable } = video_metadata
    const withLink = {...clientReceivable, link: getVideoLink(clientReceivable) }
    return withLink
}

/**
 * Tests an input string to determine if it is a valid link
 * @returns false if input is not a link, or an array of 0 or 1 flag if the link is or isn't from a supported platform respectively
 */
export function testLink(input: string): false | Flag[] {
  const valid = /(https?:\/\/)?(\w+\.)?(pony\.tube|youtube\.com|youtu\.be|bilibili\.com|vimeo\.com|thishorsie\.rocks|dailymotion\.com|dai\.ly|tiktok\.com|twitter\.com|x\.com|odysee\.com|newgrounds\.com|bsky\.app)\/?[^\s]{0,500}/;
  const link = /https?:\/\//;

  if (valid.test(input)) return [];
  if (link.test(input)) return [{ type: "ineligible", note: "1c. Currently allowed platforms: Bilibili, Bluesky, Dailymotion, Newgrounds, Odysee, Pony.Tube, ThisHorsie.Rocks, Tiktok, Twitter/X, Vimeo, and YouTube. This list is likely to change over time" }];
  return false;
}
