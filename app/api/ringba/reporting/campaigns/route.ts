import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d"

    // Calculate date range
    const now = new Date()
    const daysBack = period === "1d" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch call events grouped by campaign
    const { data: events, error } = await supabase
      .from("ringba_call_events")
      .select("*")
      .gte("created_at", startDate.toISOString())

    if (error) {
      console.error("Error fetching call events:", error)
      return NextResponse.json({ error: "Failed to fetch campaign reports" }, { status: 500 })
    }

    // Group events by campaign
    const campaignMap = new Map()

    events?.forEach((event) => {
      const campaignId = event.campaign_id || "unknown"
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          id: campaignId,
          name: event.campaign_name || `Campaign ${campaignId}`,
          calls: 0,
          conversions: 0,
          revenue: 0,
          status: "active",
        })
      }

      const campaign = campaignMap.get(campaignId)
      campaign.calls++
      if (event.event_type === "conversion") {
        campaign.conversions++
      }
      campaign.revenue += event.revenue || 0
    })

    // Convert to array and calculate conversion rates
    const campaigns = Array.from(campaignMap.values()).map((campaign) => ({
      ...campaign,
      conversionRate: campaign.calls > 0 ? (campaign.conversions / campaign.calls) * 100 : 0,
    }))

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error in campaigns endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
