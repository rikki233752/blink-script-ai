import { type NextRequest, NextResponse } from "next/server"
import { secureUserService } from "@/lib/secure-user-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    const dateRange = start && end ? { start, end } : undefined
    const analytics = await secureUserService.getUserAnalytics(dateRange)

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
