import { getPlaylist } from "@/lib/internal";
import { cookies } from "next/headers";
import { VideoDataClient } from "@/lib/types";
import { toClientVideoMetadata } from "@/lib/util";
import EditablePlaylist from "./components/Editor";
import Playlist from "./components/Playlist";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function PlaylistPage({ searchParams }: any) {
  const list_id: string | undefined = (await searchParams).list

  if (list_id?.startsWith("ballot "))
    return <div>breh</div>

  const playlist = list_id && await getPlaylist(list_id)
  let playlist_items: VideoDataClient[] = []
  let editable = true

  let id, name = "New Playlist", description = ""

  if (playlist) {
    name = playlist.name!
    description = playlist.description!
    id = playlist.id

    const uid = (await cookies()).get("uid")!.value
    editable = (playlist.owner_id === uid)

    playlist_items = playlist.playlist_item.map(
      i => ({
        ...toClientVideoMetadata(i.video_metadata),
        playlist_index: i.playlist_index})
    ).sort((a, b) => a.playlist_index - b.playlist_index)
  }
  console.log(description)

  return (
    editable && <EditablePlaylist videos={playlist_items} playlistId={id} playlistName={name} playlistDescription={description}/>
    ||
    <div style={{
      display: "flex",
      justifyContent: "center",
    }}>
      <Playlist videos={playlist_items}/>
    </div>
  )
}
