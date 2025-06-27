import { prisma } from "./prisma";
import { playlist, playlist_item, user, video_metadata } from "@/generated/prisma";
import { randomUUID } from "crypto";

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

export async function getBallotItems(user: user | null) {
    if (!user?.ballot_id)
        return []

    const data = await prisma.playlist.findUnique({
        where: {
            id: user.ballot_id
        },
        include: { playlist_item: { include: { video_metadata: true } } }
    })

    return data?.playlist_item || []
}

export async function getPlaylists(uid: string) {
    return prisma.playlist.findMany({
        where: { owner_id: uid }
    })
}

export function getPlaylist(playlist_id: string) {
    return prisma.playlist.findUnique({
        where: { id: playlist_id },
        include: { playlist_item: { include: { video_metadata: true } } }
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

export async function removeItem(playlist_item_data: playlist_item, next_thumbnail: undefined | string) {
    await prisma.playlist_item.delete({
        where: {
            playlist_id_playlist_index: {
                playlist_id: playlist_item_data.playlist_id,
                playlist_index: playlist_item_data.playlist_index
            }
        }
    })

    if (!playlist_item_data.playlist_id.startsWith("ballot ")) {
        await prisma.playlist_item.updateMany({
            where: {
                playlist_id: playlist_item_data.playlist_id,
                playlist_index: { gt: playlist_item_data.playlist_index }
            },
            data: {
                playlist_index: { decrement: 1 }
            }
        })
        console.log(next_thumbnail)

        await prisma.playlist.update({
            where: { id: playlist_item_data.playlist_id },
            data: {
                ...(next_thumbnail && { thumbnail: next_thumbnail }),
                playlist_item: {
                    updateMany: {
                        where: {
                            playlist_id: playlist_item_data.playlist_id,
                            playlist_index: { gt: playlist_item_data.playlist_index }
                        },
                        data: {
                            playlist_index: { decrement: 1 }
                        }
                    }
                }
            }
        })
    }
}

export async function setBallotItem(ballot_id: string, index: number, video_id: string, platform: string) {
    await prisma.playlist_item.upsert({
        where: { playlist_id_playlist_index: { playlist_id: ballot_id, playlist_index: index } },
        update: { video_id: video_id, platform: platform },
        create: { video_id: video_id, platform: platform, playlist_id: ballot_id, playlist_index: index }
    })
}

export function createBallot(user: user, index: number, video_id: string, platform: string) {
    const ballot_id = `ballot ${randomUUID()}`

    return prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: { ballot_id: ballot_id }
        }),
        prisma.playlist.create({ data: {
            id: ballot_id,
            owner_id: user.id,
            playlist_item: {
                create: {
                    video_id: video_id,
                    platform: platform,
                    playlist_index: index,
                }
            }
        }})
    ])
}

export function addPlaylistItem(uid: string, playlist_id: string, index: number, data: video_metadata, playlist_name: string, playlist_desc: string) {
    if (!playlist_id) {
        return prisma.playlist.create({
            data: {
                id: randomUUID(),
                owner_id: uid,
                name: playlist_name,
                last_accessed: new Date(Date.now()),
                thumbnail: data.thumbnail,
                description: playlist_desc,
                playlist_item: {
                    create: {
                        video_id: data.id,
                        playlist_index: 0,
                        platform: data.platform
                    }
                }
            }
        })
    }
    
    return prisma.playlist.upsert({
        where: {
            id: playlist_id,
            owner_id: uid
        },
        update: {
            playlist_item: {
                create: {
                    playlist_index: index,
                    video_id: data.id,
                    platform: data.platform
                }
            }
        },
        create: {
            id: playlist_id,
            owner_id: uid,
            name: playlist_name,
            description: playlist_desc,
            thumbnail: data.thumbnail,
            playlist_item: {
                create: {
                    playlist_index: 0,
                    video_id: data.id,
                    platform: data.platform
                }
            }
        }
    })
}

export function edit_playlist(playlist: playlist, name: string, description: string) {
    return prisma.playlist.update({
        where: { id: playlist.id },
        data: { name: name, description: description }
    })
}
