import { fetch_metadata } from '@/lib/external'
import { getUser, removeBallotItem, setBallotItem } from '@/lib/database'
import check from '@/lib/vote_rules'
import { NextRequest } from 'next/server'
import { APIValidateRequestBody } from '@/lib/api'

// Route for checking an entry in the ballot against the rules, and saving its position
export async function POST(req: NextRequest) {
  const body: APIValidateRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.link || typeof body.index !== "number" || body.index > 9 || body.index < 0)
    return new Response(null, { status: 400 })

  const metadata = await fetch_metadata(body.link)
  const user = uid && await getUser(uid, true)

  if ("type" in metadata) {
    if (!user)
      return Response.json({ field_flags: [metadata] })

    removeBallotItem(uid, body.index).catch(() => {})
    return Response.json({ field_flags: [metadata] })
  }

  if (user)
    await setBallotItem(uid, body.index, metadata.id, metadata.platform)

  return Response.json({ field_flags: check(metadata), video_data: metadata })
}
