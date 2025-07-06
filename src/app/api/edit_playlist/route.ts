import { edit_playlist, getPlaylist } from '@/lib/internal'
import { APIEditPlaylistRequestBody } from '@/lib/types'
import { NextRequest } from 'next/server'

// Route for modifying playlists' names and descriptions
export async function POST(req: NextRequest) {
  const body: APIEditPlaylistRequestBody = await req.json()
  const uid = req.cookies.get("uid")?.value

  if (!body.playlist_id || body.playlist_id.startsWith("ballot "))
    return new Response(null, { status: 400 })

  if (!uid)
    return new Response(null, { status: 401 })

  const target = await getPlaylist(body.playlist_id)

  if (!target)
    return new Response(null, { status: 404})
  if (target.owner_id !== uid)
    return new Response(null, { status: 403 })

  await edit_playlist(target, body.name, body.description).catch(console.log)

  return Response.json(null)
}
