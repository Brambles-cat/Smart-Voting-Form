import { fetch_metadata } from '@/lib/external'
//import { prisma } from '@/lib/prisma'
import check from '@/lib/vote_rules'
 
export async function POST(req: Request) {
  const link = await req.text()

  if (!link)
    return Response.json({ field_flags: [{ type: "ineligible", note: "No video link provided"}] }, { status: 400 })

  const metadata = await fetch_metadata(link)
  
  if ("type" in metadata)
    return Response.json({ field_flags: [metadata] }, { status: 400 })

  return Response.json({ field_flags: check(metadata), vid_identifiers: { creator: `${metadata.uploader}-${metadata.platform}`, video: `${metadata.video_id}-${metadata.platform}` } })
}
