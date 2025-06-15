import { prisma } from "./prisma";
import { playlist_item, PrismaPromise, video_metadata } from "@/generated/prisma";

export async function getBallotItems(uid: string) {
    const now = new Date(Date.now())
    const ballot_id = `ballot-${uid}`

    await prisma.playlist.upsert({
        where: {
            playlist_id: ballot_id
        },
        update: { last_accessed: now },
        create: { playlist_id: ballot_id, last_accessed: now, owner_id: uid }
    })

    const data = await prisma.user.upsert({
        where: { id: uid },
        include: { playlist_user_ballot_idToplaylist: { include: { playlist_item: true } } },
        update: { last_active: now },
        create: {
            id: uid,
            ballot_id: ballot_id,
            last_active: now,
        }
    })

    return data.playlist_user_ballot_idToplaylist.playlist_item
}

export function getItemListData(items: playlist_item[]): PrismaPromise<video_metadata[]> {
    return prisma.video_metadata.findMany({
        where: {
            OR: items.map(item => ({
                video_id: item.video_id,
                platform: item.platform
            }))
        }
    })
}

export function getVideoMetadata(id: string, platform: string) {
    return prisma.video_metadata.findUnique({
        where: {
            video_id_platform: {
                video_id: id,
                platform: platform
            }
        }
    })
}

export function saveVideoMetadata(video_data: video_metadata) {
    prisma.video_metadata.create({ data: video_data }).catch(console.log)
}

export async function removeItem(playlist_id: string, playlist_index: number) {
    return await prisma.playlist_item.delete({
        where: {
            playlist_id_playlist_index: {
                playlist_id: playlist_id,
                playlist_index: playlist_index
            }
        }
    })
}

export async function setBallotItem(uid: string, index: number, video_id: string, platform: string) {
    const ballot_id = (await prisma.user.findUnique({
        where: { id: uid },
    }))?.ballot_id

    if (!ballot_id)
        return

    await prisma.playlist_item.upsert({
        where: { playlist_id_playlist_index: { playlist_id: ballot_id, playlist_index: index } },
        update: { video_id: video_id, platform: platform },
        create: { video_id: video_id, platform: platform, playlist_id: ballot_id, playlist_index: index }
    })
}
