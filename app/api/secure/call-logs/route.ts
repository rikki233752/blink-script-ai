import { type NextRequest, NextResponse } from "next/server"
import { secureUserService } from "@/lib/secure-user-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const callLogs = await secureUserService.getUserCallLogs(limit, offset)
    return NextResponse.json({ callLogs })
  } catch (error) {
    console.error("Error fetching call logs:", error)
    return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 })
  }
}
