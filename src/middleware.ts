import { NextRequest, NextResponse } from "next/server"

export default function middleware(request: NextRequest) {
  const uid = request.cookies.get("uid")?.value
  const resp = NextResponse.next()

  if (!uid)
    resp.cookies.set("uid", crypto.randomUUID())

  return resp
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.well-known).*)"],
};