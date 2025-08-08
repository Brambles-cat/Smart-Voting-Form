import { NextRequest } from "next/server";
import { requireAuth } from "./authorization";

async function handler(req: NextRequest) {
    return new Response()
}

export const GET = requireAuth(handler)
