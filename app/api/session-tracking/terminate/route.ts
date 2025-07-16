import { type NextRequest, NextResponse } from "next/server"
import { sessionTrackingService } from "@/lib/session-tracking/session-service"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const success = await sessionTrackingService.terminateSession(sessionId)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to terminate session" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error terminating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
