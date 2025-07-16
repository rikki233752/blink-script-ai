import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d"
    const campaign = searchParams.get("campaign") || "all"

    // Calculate date range
    const now = new Date()
    const daysBack = period === "1d" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Build query
    let query = supabase.from("ringba_call_events").select("*").gte("created_at", startDate.toISOString())

    if (campaign !== "all") {
      query = query.eq("campaign_id", campaign)
    }

    const { data: events, error } = await query

    if (error) {
      console.error("Error fetching call events:", error)
      return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
    }

    // Calculate metrics
    const totalCalls = events?.length || 0
    const answeredCalls = events?.filter((e) => e.event_type === "call_answered").length || 0
    const missedCalls = totalCalls - answeredCalls
    const totalDuration = events?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0
    const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
    const conversions = events?.filter((e) => e.event_type === "conversion").length || 0
    const conversionRate = answeredCalls > 0 ? (conversions / answeredCalls) * 100 : 0
    const revenue = events?.reduce((sum, e) => sum + (e.revenue || 0), 0) || 0

    const metrics = {
      totalCalls,
      answeredCalls,
      missedCalls,
      totalDuration,
      averageDuration,
      conversionRate,
      revenue,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error in metrics endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
