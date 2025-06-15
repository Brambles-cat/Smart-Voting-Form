import { getBallotItems, removeItem } from "@/lib/internal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const uid = request.cookies.get("uid")?.value

    if (!uid)
        return NextResponse.json(null)

    const index = (await request.json()).index

    if (!index || typeof index !== "number")
        return NextResponse.json(null, { status: 400 })

    const items = await getBallotItems(uid)
    const toRemove = items.find(item => item.playlist_index === index)

    if (!toRemove)
        return NextResponse.json("Invalid index", { status: 400 })

    let error = null
    await removeItem(toRemove.playlist_id, toRemove.playlist_index).catch(() => error = "Couldn't remove item")

    return NextResponse.json(error, { status: error ? 500 : 200 })
}