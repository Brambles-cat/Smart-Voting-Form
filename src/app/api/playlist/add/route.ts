import { fetch_metadata } from '@/lib/external'
import { addPlaylistItem, getUser } from '@/lib/database'
import { toClientVideoMetadata } from '@/lib/util'
import { NextRequest } from 'next/server'
import { APIAddRequestBody } from '@/lib/api'

// Route for adding items to regular playlists
export async function POST(req: NextRequest) {
  const body: APIAddRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.link || !body.playlist_id)
    return new Response(null, { status: 400 })

  const metadata = await fetch_metadata(body.link)

  if ("type" in metadata)
    return Response.json({ error: metadata.details })

  if (!uid)
    return new Response()

  await getUser(uid, true)
  await addPlaylistItem(uid, body.playlist_id, metadata)

  return Response.json({metadata: toClientVideoMetadata(metadata) })
}
