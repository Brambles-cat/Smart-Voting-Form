import { getPlaylist, getPlaylistItem, getUser, removeItem } from "@/lib/internal";
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

    if (body.playlist_id === "ballot") {
        const playlist_id = user.ballot_id!
        const to_remove = await getPlaylistItem(playlist_id, body.index)

        if (!to_remove)
            return NextResponse.json("Couldn't find ballot item", { status: 400 })        

        await removeItem(to_remove)
    }
    else {
        const playlist_id = body.playlist_id
        let items = (await getPlaylist(playlist_id))?.playlist_item

        if (!items?.[body.index])
            return NextResponse.json("Couldn't find playlist item", { status: 400 })

        await removeItem(items[body.index], body.index === 0 ? items[1].video_metadata.thumbnail! : undefined)
    }

    return new Response
}
