import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Run the auth session middleware only on routes that either require auth or
// benefit from cookie refresh. Keeps static assets and marketing pages fast.
export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/messages/:path*",
    "/matching/:path*",
    "/auth/:path*",
    "/login",
    "/signup",
  ],
}
