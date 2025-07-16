import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API credentials not configured",
        },
        { status: 400 },
      )
    }

    console.log("🎯 Fetching OnScript-style campaigns from Ringba...")

    // Fetch campaigns from Ringba
    const campaignsResponse = await fetch(`https://api.ringba.com/v2/${accountId}/campaigns`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text()
      console.error("Ringba campaigns API error:", campaignsResponse.status, errorText)
      throw new Error(`Ringba API error: ${campaignsResponse.status}`)
    }

    const campaignsData = await campaignsResponse.json()
    let campaigns = campaignsData.data || campaignsData.campaigns || campaignsData || []

    if (!Array.isArray(campaigns)) {
      campaigns = []
    }

    console.log(`📊 Found ${campaigns.length} campaigns from Ringba`)

    // Transform to OnScript AI format
    const onscriptCampaigns = await Promise.all(
      campaigns.map(async (campaign: any) => {
        // Get call statistics for each campaign
        const callStats = await getCampaignCallStats(campaign.id || campaign.campaign_id, apiKey, accountId)

        return {
          id: campaign.id || campaign.campaign_id || campaign.uuid,
          name: campaign.name || campaign.campaign_name || campaign.title || `Campaign ${campaign.id}`,
          status: campaign.status === "active" ? "active" : "inactive",
          description: campaign.description || campaign.notes || "",
          createdDate: campaign.created_at || campaign.date_created || new Date().toISOString(),
          totalCalls: callStats.totalCalls,
          totalCallLogs: callStats.totalCalls, // In OnScript, call logs = calls
          callsWithRecordings: callStats.callsWithRecordings,
          averageDuration: callStats.averageDuration,
          conversionRate: callStats.conversionRate,
          revenue: callStats.revenue,
          lastActivity:
            callStats.lastActivity || campaign.updated_at || campaign.date_modified || new Date().toISOString(),
        }
      }),
    )

    console.log(`✅ Transformed ${onscriptCampaigns.length} campaigns to OnScript format`)

    return NextResponse.json({
      success: true,
      data: onscriptCampaigns,
      total: onscriptCampaigns.length,
      dataSource: "RINGBA_TO_ONSCRIPT",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Error fetching OnScript campaigns:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to get campaign call statistics
async function getCampaignCallStats(campaignId: string, apiKey: string, accountId: string) {
  try {
    // Get calls from last 30 days
    const endDate = new Date().toISOString()
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const callsResponse = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs/detail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        start_date: startDate,
        end_date: endDate,
        limit: 1000,
      }),
    })

    if (!callsResponse.ok) {
      return {
        totalCalls: 0,
        callsWithRecordings: 0,
        averageDuration: 0,
        conversionRate: 0,
        revenue: 0,
        lastActivity: null,
      }
    }

    const callsData = await callsResponse.json()
    let calls = callsData.data || callsData.calls || callsData || []

    if (!Array.isArray(calls)) {
      calls = []
    }

    const totalCalls = calls.length
    const callsWithRecordings = calls.filter((call: any) => call.recording_url || call.recordingUrl).length
    const totalDuration = calls.reduce((sum: number, call: any) => sum + (Number.parseInt(call.duration) || 0), 0)
    const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
    const totalRevenue = calls.reduce((sum: number, call: any) => sum + (Number.parseFloat(call.revenue) || 0), 0)
    const conversions = calls.filter((call: any) => call.disposition === "sale" || call.outcome === "sale").length
    const conversionRate = totalCalls > 0 ? Math.round((conversions / totalCalls) * 100) : 0

    const lastActivity = calls.length > 0 ? calls[0].start_time || calls[0].date_created : null

    return {
      totalCalls,
      callsWithRecordings,
      averageDuration,
      conversionRate,
      revenue: totalRevenue,
      lastActivity,
    }
  } catch (error) {
    console.error(`Error getting stats for campaign ${campaignId}:`, error)
    return {
      totalCalls: 0,
      callsWithRecordings: 0,
      averageDuration: 0,
      conversionRate: 0,
      revenue: 0,
      lastActivity: null,
    }
  }
}
