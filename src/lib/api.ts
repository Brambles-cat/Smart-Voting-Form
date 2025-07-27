// API request/response types and client side functions to make api calls to the server

import { Flag, VideoDataClient } from "./types"

export type APIValidateRequestBody = {
    link: string
    index?: number
}

export type APIValidateResponseBody = {
    field_flags: Flag[]
    video_data?: VideoDataClient
}

/**
 * Check the eligibility of a video given its url and keep track of its entry position
 * @param link video url
 * @param index ballot index to save the link at. can be omitted for the server not to save the ballot entry
 * @returns An array of eligibility flags, and, if present, video metadata associated with the link
 */
export async function validate(link: string, index?: number): Promise<APIValidateResponseBody> {
    const body: APIValidateRequestBody = { link, index }

    const res = await fetch("/api/validate", {
        method: "POST",
        body: JSON.stringify(body),
        credentials: index === undefined ? "omit" : "same-origin"
    })

    return await res.json()
}



export type APIAddRequestBody = {
    link: string
    playlist_id: "ballot" | string
}

export type APIAddResponseBody = { metadata: VideoDataClient } | { error: string }

/**
 * Attempt to add a video to a playlist
 * @param link video url
 * @param playlist_id id of the playlist to which the video should be added to
 * @returns video metadata associated with the url, or an error message if no data could be fetched for it
 */
export async function addPlaylistItem(link: string, playlist_id: string): Promise<APIAddResponseBody> {
    const body: APIAddRequestBody = { link, playlist_id }

    const res = await fetch("/api/add", {
        method: "POST",
        body: JSON.stringify(body)
    })

    return await res.json()
}



export type APIEditPlaylistRequestBody = {
    name: string
    description: string
    playlist_id: string
}

/**
 * Edit playlist metadata
 * @param name new name for the playlist
 * @param description new description for the playlist
 * @param playlist_id id of the playlist to edit
 */
export async function editPlaylistMeta(name: string, description: string, playlist_id: string) {
    const body: APIEditPlaylistRequestBody = { name, description, playlist_id }
    const res = await fetch("/api/edit_playlist", {
      method: "POST",
      body: JSON.stringify(body)
    })

    return res.status === 200
}



export type APIRemoveBIRequestBody = { index: number }

/**
 * Remove an entry from a ballot
 * @param index the index of the ballot entry to remove
 */
export async function removeBallotItem(index: number) {
    const uid = /uid=([^;]+)/.exec(document.cookie)?.[1]
    if (!uid)
        return
    
    const body: APIRemoveBIRequestBody = { index }

    const res = await fetch("/api/remove_ballot_item", {
        method: "POST",
        body: JSON.stringify(body)
    })

    return res.status !== 200 && await res.json() as string
}

export type APIRemovePIRequestBody = {
    playlist_id: string
    item_id: number
}

/**
 * Verbatim
 * @param playlist_id the id of the playlist to remove from
 * @param item_id the id of the item to remove
 */
export async function removePlaylistItem(playlist_id: string, item_id: number) {
    const uid = /uid=([^;]+)/.exec(document.cookie)?.[1]
    if (!uid)
        return
    
    const body: APIRemovePIRequestBody = { playlist_id, item_id }

    const res = await fetch("/api/remove", {
        method: "POST",
        body: JSON.stringify(body)
    })

    return res.status !== 200 && await res.json() as string
}



export type APILabelUpdateRequestBody = {
    label_updates: Flag[]
}

/**
 * Update the label details shown in ballot entries when videos have these labels
 * @param label_updates New label data to replace corresponding existing ones
 */
export async function updateLabels(label_updates: Flag[]) {
    const body: APILabelUpdateRequestBody = { label_updates }

    const res = await fetch("/api/label_update", {
        method: "POST",
        body: JSON.stringify(body)
    })

    return res.status === 200
}

// function search() {}
