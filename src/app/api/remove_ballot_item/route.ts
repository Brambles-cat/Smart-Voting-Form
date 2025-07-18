import { APIRemoveBIRequestBody } from "@/lib/api";
import { getUser, removeBallotItem } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// Route for removing entries from ballots or playlists
export async function POST(request: NextRequest) {
    const uid = request.cookies.get("uid")?.value
    if (!uid) return new NextResponse()

    const user = await getUser(uid)
    if (!user) return new NextResponse(null, { status: 400 })

    const body: APIRemoveBIRequestBody = await request.json()

    if (typeof body.index !== "number")
        return new NextResponse(null, { status: 400 })

    await removeBallotItem(uid, body.index)

    return new Response
}
