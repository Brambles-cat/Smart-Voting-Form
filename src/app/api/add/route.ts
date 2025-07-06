import { fetch_metadata } from '@/lib/external'
import { addPlaylistItem, getUser } from '@/lib/internal'
import { APIAddRequestBody } from '@/lib/types'
import { toClientVideoMetadata } from '@/lib/util'
import { NextRequest } from 'next/server'

// Route for adding items to regular playlists
export async function POST(req: NextRequest) {
  const body: APIAddRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.link || typeof body.index !== "number" || body.index < 0 || body.playlist_id?.startsWith("ballot ") && body.index > 9)
    return new Response(null, { status: 400 })

  const metadata = await fetch_metadata(body.link)

  if ("type" in metadata)
    return Response.json({ field_flags: [metadata] })

  if (!uid)
    return new Response()

  getUser(uid, true)
  const playlist = await addPlaylistItem(uid, body.playlist_id, body.index, metadata, body.name, body.description)

  return Response.json({metadata: toClientVideoMetadata(metadata), playlist_id: playlist.id })
}
