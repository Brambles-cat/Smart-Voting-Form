// Server side functions for making specific interactions with the database

import { prisma } from "./prisma";
import { video_metadata } from "@/generated/prisma";
import { LabelConfig } from "./types";

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

    await prisma.user.update({
        where: { id: uid },
        data: {
            ballot_item: {
                delete: {
                    user_id_index: { user_id: uid, index }
                }
            },
            last_ballot_update: now,
            last_active: now
        }
    })
}

export async function setBallotItem(uid: string, index: number, video_id: string, platform: string) {
    await prisma.ballot_item.upsert({
        where: { user_id_index: { user_id: uid, index: index } },
        update: { video_id: video_id, platform: platform },
        create: { video_id: video_id, platform: platform, user_id: uid, index: index }
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

export function getLabelConfigs(): Promise<LabelConfig[]> {
    return prisma.label_config.findMany() as Promise<LabelConfig[]>
}

export function setLabelConfigs(new_configs: LabelConfig[]) {
    return prisma.$transaction(
        new_configs.map(config =>
            prisma.label_config.update({
                where: { trigger: config.trigger },
                data: config
            })
        )
    )
}
