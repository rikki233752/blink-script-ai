import { type NextRequest, NextResponse } from "next/server"
import { sessionTrackingService } from "@/lib/session-tracking/session-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const loginHistory = await sessionTrackingService.getUserLoginHistory(userId, limit)
    const activeSessions = await sessionTrackingService.getUserActiveSessions(userId)
    const securityEvents = await sessionTrackingService.getUserSecurityEvents(userId, 20)

    return NextResponse.json({
      loginHistory,
      activeSessions,
      securityEvents,
      stats: {
        totalLogins: loginHistory.length,
        activeSessions: activeSessions.length,
        recentSecurityEvents: securityEvents.length,
      },
    })
  } catch (error) {
    console.error("Error getting session activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    await sessionTrackingService.updateLastActivity(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
