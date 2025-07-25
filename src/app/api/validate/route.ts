import { fetch_metadata } from '@/lib/external'
import { getUser, removeBallotItem, setBallotItem } from '@/lib/database'
import check from '@/lib/vote_rules'
import { NextRequest } from 'next/server'
import { APIValidateRequestBody } from '@/lib/api'
import { toClientVideoMetadata } from '@/lib/util'

// Route for checking an entry in the ballot against the rules, and saving its position
export async function POST(req: NextRequest) {
  const body: APIValidateRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.link || body.index && (body.index > 9 || body.index < 0))
    return new Response(null, { status: 400 })

  const fetch_result = await fetch_metadata(body.link)
  const ballot_target = body.index !== undefined && uid && (await getUser(uid, true))!.id

  const [flags, metadata] = "type" in fetch_result ? [[fetch_result], undefined] : [check(fetch_result), fetch_result]

  if (ballot_target) {
    if (!metadata)
      removeBallotItem(uid, body.index!).catch(() => {}) // ballot_target ⊢ body.index != undefined
    else
      await setBallotItem(uid, body.index!, metadata.id, metadata.platform)
  }

  return Response.json({ field_flags: flags, video_data: metadata && toClientVideoMetadata(metadata) })
}
