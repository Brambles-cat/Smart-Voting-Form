import { APILabelUpdateRequestBody } from "@/lib/api";
import { setLabelConfigs } from "@/lib/database";
import { updateLabels } from "@/lib/labels";
import { NextRequest } from "next/server";
import { requireAuth } from "../authorization";

// Update label configs in the running server instance and in the db
async function handler(req: NextRequest) {
    const body: APILabelUpdateRequestBody = await req.json()

    await setLabelConfigs(body.label_updates)
    updateLabels(body.label_updates)

    return new Response()
}

export const POST = requireAuth(handler)
