// A file containing the mappings for each of the labels to apply to videos upon validation when 

import { Flag } from "./types"

/**
 * Mapping of label types to corresponding icon names
 */
export const iconMap = { ineligible: "x", warn: "warn", eligible: "checkmark" }

/**
 * Update the configuration for any number of labels
 * @param new_labels New label configurations to use throughout the app.
 * These must all have triggers that are predefined by the default label config
 */
export function updateLabels(new_labels: Flag[]) {
    new_labels.forEach(label => {
        Object.entries(labels).find(([, config]) => config.trigger === label.trigger)![1] = label
    })
}

type label_key =
	"invalid_link" |
	"duplicate_votes" |
	"missing_id" |
	"unavailable" |
	"wrong_period" |
	"too_short" |
	"maybe_too_short" |
	"no_simping" |
	"unsupported_site" |
	"littleshy_vid"

export const labels: Record<label_key, Flag> = {
    invalid_link:     { name: 'Invalid link',       type: 'ineligible', trigger: 'Non url entry',               details: 'Not a valid link' },
	duplicate_votes:  { name: 'Duplicate vote',     type: 'ineligible', trigger: 'Duplicate links in ballot',   details: 'Duplicate votes are not eligible' },
	missing_id:       { name: 'Missing id',         type: 'ineligible', trigger: 'No video id in link',         details: 'No video id present' },
	unavailable:      { name: 'Unavailable video',  type: 'ineligible', trigger: 'Empty metadata response',     details: 'Video is not public or is unavailable' },
	wrong_period:     { name: '2a',                 type: 'ineligible', trigger: 'Video too old or new',        details: 'Vote for last month\'s videos based on your own time zone' },
	too_short:        { name: '4a',                 type: 'ineligible', trigger: '<30 second video',            details: 'Short length: Videos must be 30 seconds or longer not including intros/outros/credits/etc' },
	maybe_too_short:  { name: '4a',                 type: 'warn',       trigger: '<=45 second video',           details: 'Short length: Videos must be 30 seconds or longer not including intros/outros/credits/etc' },
	no_simping:       { name: '5b',                 type: 'warn',       trigger: '>2 videos from same creator', details: 'You can include up to two videos from a creator if the videos are unique and you\'re including votes for at least five creators total. Don\'t vote for multiple parts in a series or very similar videos from the same creator' }, // TODO: forgot that second detail
	unsupported_site: { name: '1c',                 type: 'ineligible', trigger: 'Unsupported platform link',   details: 'Currently allowed platforms: Bilibili, Bluesky, Dailymotion, Newgrounds, Odysee, Pony.Tube, ThisHorsie.Rocks, Tiktok, Twitter/X, Vimeo, and YouTube. This list is likely to change over time' },
	littleshy_vid:    { name: '5d',                 type: 'ineligible', trigger: 'Littleshy video',             details: 'Don\'t vote for videos from the current host\'s channel, LittleshyFiM' }
}
