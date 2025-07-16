import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("Environment check:", {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      hasAccountId: !!accountId,
      accountId: accountId,
    })

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing RINGBA_API_KEY or RINGBA_ACCOUNT_ID environment variables",
          details: {
            hasApiKey: !!apiKey,
            hasAccountId: !!accountId,
          },
        },
        { status: 400 },
      )
    }

    // Use the same method as the working /ringba-campaigns page
    console.log("Fetching real campaigns from Ringba API...")

    const response = await fetch(`https://api.ringba.com/v2/${accountId}/campaigns`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Campaigns API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Campaigns API error:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch campaigns: ${response.status} ${response.statusText}`,
          status: response.status,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const campaignsData = await response.json()
    console.log("Raw campaigns response:", campaignsData)

    // Transform campaigns data using the same logic as the working campaigns page
    let campaigns = []
    if (Array.isArray(campaignsData)) {
      campaigns = campaignsData
    } else if (campaignsData.data && Array.isArray(campaignsData.data)) {
      campaigns = campaignsData.data
    } else if (campaignsData.campaigns && Array.isArray(campaignsData.campaigns)) {
      campaigns = campaignsData.campaigns
    }

    const transformedCampaigns = campaigns.map((campaign: any) => ({
      id: campaign.campaignId || campaign.id || campaign.campaign_id,
      name: campaign.campaignName || campaign.name || campaign.campaign_name || `Campaign ${campaign.id}`,
      status: campaign.status || campaign.state || campaign.campaign_status || "Active",
      callCount: campaign.callCount || campaign.call_count || 0,
      revenue: campaign.revenue || campaign.total_revenue || 0,
      conversionRate: campaign.conversionRate || campaign.conversion_rate || 0,
      lastCallDate: campaign.lastCallDate || campaign.last_call_date || null,
      trackingNumbers: campaign.trackingNumbers || campaign.tracking_numbers || 0,
      created: campaign.created,
      modified: campaign.modified,
      tags: campaign.tags || [],
    }))

    return NextResponse.json({
      success: true,
      data: transformedCampaigns,
      dataSource: "RINGBA_API",
      totalCampaigns: transformedCampaigns.length,
      accountId: accountId,
      method: "Bearer Token",
    })
  } catch (error) {
    console.error("Error in fetch-campaigns:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while fetching campaigns",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
