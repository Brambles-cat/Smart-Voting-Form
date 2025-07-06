import { NextRequest, NextResponse } from "next/server"

// Ensures that a user cookie is either set or attempted to be set
// The cookie value is present in the page raouters regardless of whether it was accepted or not
// so accessing the cookie there should never return undefined
export default function middleware(request: NextRequest) {
  const uid = request.cookies.get("uid")?.value
  const resp = NextResponse.next()

  if (!uid)
    resp.cookies.set("uid", crypto.randomUUID())

  return resp
}

// Only running middleware for regular pages
export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.well-known).*)"],
};