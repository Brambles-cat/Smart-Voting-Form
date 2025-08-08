import { APIEditPlaylistRequestBody } from '@/lib/api'
import { editPlaylist } from '@/lib/database'
import { NextRequest } from 'next/server'

// Route for modifying playlists' names and descriptions
export async function POST(req: NextRequest) {
  const body: APIEditPlaylistRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.playlist_id || !body.playlist_id)
    return new Response(null, { status: 400 })

  if (!uid)
    return new Response(null, { status: 401 })

  await editPlaylist(body.playlist_id, uid, body.name, body.description).catch(console.log)

  return new Response()
}
