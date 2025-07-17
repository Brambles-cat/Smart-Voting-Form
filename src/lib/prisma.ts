// A file creating and ensuring only a single connection existing to the database between reloads made when ran using `next dev`

import { PrismaClient } from "@/generated/prisma";
import { labels, setLabels } from "./labels";
import { LabelConfig } from "./types";

/**
 * Create a new db connection while ensuring the label_config table is initialized with the default values defined in labels.ts.
 * If it has been, then initialize the runtime values with the contents of that table to use throughout the app
 */
async function initConnection() {
    const prisma = new PrismaClient()
    const present = await prisma.label_config.findMany() as LabelConfig[]

    if (!present.length) {
        await prisma.label_config.createMany({
            data: Object.values(labels)
        })
    }
    else
        setLabels(present)

    return prisma
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || await initConnection();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
