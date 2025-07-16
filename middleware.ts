import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not authenticated, redirect to login
  if (!user && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // If user is authenticated and accessing dashboard
  if (user && req.nextUrl.pathname.startsWith("/dashboard")) {
    // Check if user has completed Ringba setup
    const { data: ringbaAccounts } = await supabase
      .from("ringba_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)

    // If no active Ringba accounts and not already on setup page
    if ((!ringbaAccounts || ringbaAccounts.length === 0) && !req.nextUrl.pathname.includes("/ringba-setup")) {
      return NextResponse.redirect(new URL("/dashboard/ringba-setup", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
