import { fetch_metadata } from '@/lib/external'
import { removeItem, setBallotItem } from '@/lib/internal'
import { APIValidateRequestBody as APIValidateRequestBody } from '@/lib/types'
import check from '@/lib/vote_rules'
import { NextRequest } from 'next/server'
 
export async function POST(req: NextRequest) {
  const body: APIValidateRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.link || typeof body.index !== "number" || body.index < 0 || body.index > 9)
    return Response.json({ field_flags: [{ type: "ineligible", note: "" }] }, { status: 400 })

  const metadata = await fetch_metadata(body.link)

  if ("type" in metadata) {
    if (uid)
      removeItem(`ballot-${uid}`, body.index).catch(() => {})
    return Response.json({ field_flags: [metadata] })
  }

  if (uid)
    setBallotItem(uid, body.index, metadata.video_id, metadata.platform)

  return Response.json({ field_flags: check(metadata), video_data: metadata })
}
