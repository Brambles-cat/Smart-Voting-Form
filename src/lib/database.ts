// Server side functions for making specific interactions with the database

import { prisma } from "./prisma";
import { video_metadata } from "@/generated/prisma";
import { Flag, VideoPoolItem } from "./types";

// Going to to see if this is worth keeping or if getUser first would be better
// in the long run
export async function withUser(
    uid: string,
    update: Parameters<typeof prisma.user.update>[0]["data"],
    create: Omit<Parameters<typeof prisma.user.create>[0]["data"], "id" | "last_active"> = {}
) {
    const now = new Date(Date.now())

    await prisma.user.upsert({
        where: { id: uid },
        update: { ...update, last_active: now },
        create: { ...create, id: uid, last_active: now }
    })
}

export async function getUser(uid: string, create = false) {
    const now = new Date(Date.now())

    if (create)
        return await prisma.user.upsert({
            where: { id: uid },
            update: { last_active: now },
            create: { id: uid, last_active: now }
        })
    
    try {
        return await prisma.user.update({
            where: { id: uid },
            data: { last_active: now },
        })
    } catch {}
}

export function getBallotItems(uid: string) {
    return prisma.ballot_item.findMany({
        where: {
            user_id: uid
        },
        include: { video_metadata: true }
    })
}

export function getPlaylists(uid: string) {
    return prisma.playlist.findMany({
        where: { owner_id: uid },
        orderBy: { last_accessed: "desc" }
    })
}

export function getPlaylist(playlist_id: string) {
    return prisma.playlist.findUnique({
        where: { id: playlist_id },
        include: {
            playlist_item: {
                include: { video_metadata: true },
                orderBy: { id: "asc" }
            },
        },
    })
}

export function getPlaylistItem(item_id: number) {
    return prisma.playlist_item.findUnique({
        where: { id: item_id }
    })
}

export function getVideoMetadata(id: string, platform: string) {
    return prisma.video_metadata.findUnique({
        where: {
            id_platform: {
                id: id,
                platform: platform
            }
        }
    })
}

export async function saveVideoMetadata(video_data: video_metadata) {
    return prisma.video_metadata.create({ data: video_data }).catch(console.log)
}

export async function removePlaylistItem(uid: string, playlist_id: string, item_id: number, next_thumbnail?: string) {
    await prisma.playlist.update({
        where: { owner_id: uid, id: playlist_id },
        data: {
            playlist_item: {
                delete: { id: item_id }
            },
            ...(next_thumbnail && { thumbnail: next_thumbnail })
        }
    })
}

export async function removeBallotItem(uid: string, index: number) {
    const now = new Date(Date.now())

    await withUser(uid, {
        ballot_item: {
            delete: {
                user_id_index: { user_id: uid, index }
            }
        },
        last_ballot_update: now
    })
}

export async function setBallotItem(uid: string, index: number, video_id: string, platform: string) {
    const now = new Date(Date.now())
    const item = { video_id: video_id, platform, index }

    await withUser(uid, {
        ballot_item: {
            upsert: {
                where: { user_id_index: { user_id: uid, index: index } },
                update: item,
                create: item
            }
        },
        last_ballot_update: now
    },
    {
        ballot_item: {
            create: item
        },
        last_ballot_update: now
    })
}

export function addPlaylistItem(uid: string, playlist_id: string, data: video_metadata) {
    return prisma.playlist.upsert({
        where: {
            id: playlist_id,
            owner_id: uid
        },
        update: {
            playlist_item: {
                create: {
                    video_id: data.id,
                    platform: data.platform
                }
            }
        },
        create: {
            id: playlist_id,
            owner_id: uid,
            thumbnail: data.thumbnail,
            playlist_item: {
                create: {
                    video_id: data.id,
                    platform: data.platform
                }
            }
        }
    })
}

export function editPlaylist(playlist_id: string, owner_id: string, name: string, description: string) {
    return prisma.playlist.update({
        where: { id: playlist_id, owner_id: owner_id },
        data: { name: name, description: description }
    })
}

export function getLabelConfigs() {
    return prisma.label_config.findMany() as Promise<Flag[]>
}

export function setLabelConfigs(new_configs: Flag[]) {
    return prisma.$transaction(
        new_configs.map(config =>
            prisma.label_config.update({
                where: { trigger: config.trigger },
                data: config
            })
        )
    )
}

export async function getAllData() {
    const [
        users,
        video_metadata,
        ballot_item,
        playlist,
        playlist_item,
        label_config,
        manual_label
    ] = await Promise.all([
        prisma.user.findMany(),
        prisma.video_metadata.findMany(),
        prisma.ballot_item.findMany(),
        prisma.playlist.findMany(),
        prisma.playlist_item.findMany(),
        prisma.label_config.findMany(),
        prisma.manual_label.findMany()
    ])

    return { users, video_metadata, ballot_item, label_config, manual_label, playlist, playlist_item }
}

export async function getPool(): Promise<VideoPoolItem[]> {
    const result = await prisma.$queryRaw`
    SELECT v.id, v.title, v.thumbnail, v.uploader, v.platform, COUNT(CASE WHEN b.user_id IS NOT NULL THEN 1 END) votes
    FROM video_metadata v
    LEFT JOIN ballot_item b
        ON b.video_id = v.id AND b.platform = v.platform
    GROUP BY v.id, v.platform
    ORDER BY votes DESC
    LIMIT 30;
    ` as VideoPoolItem[]

    return result.map(item => ({ ...item, votes: Number(item.votes) }))
}
