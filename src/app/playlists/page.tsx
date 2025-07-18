import { cookies } from "next/headers";
import Playlists from "./components/Playlists";
import { getPlaylists } from "@/lib/database";

export default async function PlaylistPage() {
  const userCookies = await cookies()
  const uid = userCookies.get("uid")!.value

  const playlists = await getPlaylists(uid)

  return (
    <Playlists playlists={playlists}/>
  );
}
