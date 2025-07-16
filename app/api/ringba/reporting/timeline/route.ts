import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaign = searchParams.get("campaign") || "ADSPARKX"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Timeline data matching the screenshot
    const timelineData = [
      { month: "Jan, 2025", calls: 15000, revenue: 15000 },
      { month: "Feb, 2025", calls: 25000, revenue: 25000 },
      { month: "Mar, 2025", calls: 30000, revenue: 30000 },
      { month: "Apr, 2025", calls: 45000, revenue: 45000 },
      { month: "May, 2025", calls: 75000, revenue: 75000 },
      { month: "Jun, 2025", calls: 150000, revenue: 150000 },
      { month: "Jul, 2025", calls: 20000, revenue: 20000 },
    ]

    return NextResponse.json(timelineData)
  } catch (error) {
    console.error("Error in timeline endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
