import { getPlaylist, getUser, removeItem } from "@/lib/internal";
import { APIRemoveRequestBody } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Route for removing entries from ballots or playlists
export async function POST(request: NextRequest) {
    const uid = request.cookies.get("uid")?.value
    if (!uid) return new NextResponse()

    const user = await getUser(uid)
    if (!user) return new NextResponse(null, { status: 400 })

    const body: APIRemoveRequestBody = await request.json()

    if (typeof body.index !== "number")
        return new NextResponse(null, { status: 400 })

    const playlist_id = body.playlist_id === "ballot" ? user.ballot_id! : body.playlist_id

    let items = playlist_id && (await getPlaylist(playlist_id))?.playlist_item

    if (!items)
        return NextResponse.json("Invalid playlist id", { status: 400 })

    items = items.sort((a, b) => a.playlist_index - b.playlist_index)

    if (!items[body.index])
        return Response.json("Invalid index", { status: 400 })

    let error = null
    await removeItem(items[body.index], body.index === 0 ? items[1].video_metadata.thumbnail! : undefined).catch(() => error = "Couldn't remove item")

    if (error)
        return Response.json(error, { status: 500 })
    else
        return new Response
}
