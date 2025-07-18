import { APIRemovePIRequestBody } from "@/lib/api";
import { getPlaylist, getUser, removePlaylistItem } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// Route for removing entries from ballots or playlists
export async function POST(request: NextRequest) {
    const uid = request.cookies.get("uid")?.value
    if (!uid) return new NextResponse()

    const user = await getUser(uid)
    if (!user) return new NextResponse(null, { status: 400 })

    const body: APIRemovePIRequestBody = await request.json()

    if (typeof body.item_id !== "number")
        return new NextResponse(null, { status: 400 })

    const items = (await getPlaylist(body.playlist_id))?.playlist_item

    if (!items)
        return new Response(null, { status: 404 })

    const next_thumbnail = items[0]?.id === body.item_id ? items[1]?.video_metadata.thumbnail || undefined : undefined

    await removePlaylistItem(uid, body.playlist_id, body.item_id, next_thumbnail)

    return new Response()
}
