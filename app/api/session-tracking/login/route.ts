import { type NextRequest, NextResponse } from "next/server"
import { sessionTrackingService } from "@/lib/session-tracking/session-service"
import { getServiceSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { userId, authId, email, password, loginMethod = "email" } = await request.json()

    // Get client IP and user agent
    const ipAddress =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || request.ip || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Validate credentials (simplified - you should use proper auth)
    const serviceSupabase = getServiceSupabase()
    const { data: user, error: userError } = await serviceSupabase.from("users").select("*").eq("email", email).single()

    if (userError || !user) {
      // Record failed login
      await sessionTrackingService.recordFailedLogin({
        email,
        ipAddress,
        userAgent,
        failureReason: "Invalid credentials",
        loginMethod,
      })

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Record successful login
    const sessionId = crypto.randomUUID()
    const loginActivity = await sessionTrackingService.recordLogin({
      userId: user.id,
      authId: authId || user.auth_id,
      sessionId,
      ipAddress,
      userAgent,
      loginMethod,
    })

    return NextResponse.json({
      success: true,
      sessionId,
      loginActivity,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
