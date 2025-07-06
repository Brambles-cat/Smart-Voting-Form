import { video_metadata } from "@/generated/prisma";
import { Flag } from "./types";

/**
 * Checks video metadata against some of the video eligibility rules
 * @returns A list of flags for any that may apply
 */
export default function check(video_metadata: video_metadata): Flag[] {
    const flags: Flag[] = []

    if (video_metadata.upload_date) {
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
            flags.push({ type: "ineligible", note: "2a. Vote for last month's videos based on your own time zone" })
        // My gosh im gonna kms if i need to work with date times again
    }
    else flags.push({ type: "warn", note: "2a. Vote for last month's videos based on your own time zone" })

    if (!video_metadata.duration)
        video_metadata.duration = 32
    
    if (video_metadata.duration < 30)
        flags.push({ type: "ineligible", note: "4a. Short length: Videos must be 30 seconds or longer not including intros/outros/credits/etc" })
    else if (video_metadata.duration <= 45)
        flags.push({ type: "warn", note: "4a. Short length: Videos must be 30 seconds or longer not including intros/outros/credits/etc" })

    if (video_metadata.uploader === "LittleshyFiM")
        flags.push({ type: "ineligible", note: "5d. Don't vote for videos from the current host's channel, LittleshyFiM" })

    return flags
}