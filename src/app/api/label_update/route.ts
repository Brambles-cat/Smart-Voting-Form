import { APILabelUpdateRequestBody } from "@/lib/api";
import { setLabelConfigs } from "@/lib/database";
import { updateLabels } from "@/lib/labels";
import { NextRequest } from "next/server";

// Update label configs in the running server instance and in the db
export async function POST(req: NextRequest) {
    const uid = req.cookies.get("uid")?.value

    if (!uid || uid !== process.env.OPERATOR)
        return new Response(null, { status: 403 })

    const body: APILabelUpdateRequestBody = await req.json()

    await setLabelConfigs(body.label_updates)
    updateLabels(body.label_updates)

    return new Response()
}