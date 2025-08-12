import { NextRequest } from "next/server";
import { requireAuth } from "../authorization";
import { getPool } from "@/lib/database";

async function handler() {
    const pool = await getPool()
    return Response.json(pool)
}

export const GET = requireAuth(handler)
