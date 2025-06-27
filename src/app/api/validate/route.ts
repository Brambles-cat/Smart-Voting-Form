import { fetch_metadata } from '@/lib/external'
import { createBallot, getUser, removeItem, setBallotItem } from '@/lib/internal'
import { APIValidateRequestBody as APIValidateRequestBody } from '@/lib/types'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body: APIValidateRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.link || typeof body.index !== "number" || body.index < 0 || body.index > 9)
    return new Response(null, { status: 400 })

  const metadata = await fetch_metadata(body.link)

  if ("type" in metadata) {
    if (!uid)
      return Response.json({ field_flags: [metadata] })
    
    const user = await getUser(uid)
    
    if (!user)
        return Response.json({ field_flags: [metadata] })

      removeItem(user?.ballot_id, body.index).catch(() => {})
    }
  }

  let ballot_id

  if (uid) {
    const user = (await getUser(uid, true))!

    if (!user.ballot_id)
      ballot_id = (await createBallot(user, body.index, metadata.id, metadata.platform))[0].ballot_id
    else {
      await setBallotItem(user.ballot_id, body.index, metadata.id, metadata.platform)
      ballot_id = user.ballot_id
    }
  }

  return Response.json({ field_flags: check(metadata), video_data: metadata, ballot_id: ballot_id })
}
