import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID
    const { campaignId } = params

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API credentials not configured",
        },
        { status: 400 },
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()
    const limit = searchParams.get("limit") || "200"

    console.log(`📞 Fetching OnScript-style call logs for campaign: ${campaignId}`)

    // Fetch call logs from Ringba
    const callLogsResponse = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs/detail`, {
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
        limit: Number.parseInt(limit),
      }),
    })

    if (!callLogsResponse.ok) {
      const errorText = await callLogsResponse.text()
      console.error("Ringba call logs API error:", callLogsResponse.status, errorText)
      throw new Error(`Ringba API error: ${callLogsResponse.status}`)
    }

    const callLogsData = await callLogsResponse.json()
    let callLogs = callLogsData.data || callLogsData.calls || callLogsData || []

    if (!Array.isArray(callLogs)) {
      callLogs = []
    }

    console.log(`📊 Found ${callLogs.length} call logs for campaign ${campaignId}`)

    // Get campaign name
    const campaignName = await getCampaignName(campaignId, apiKey, accountId)

    // Transform to OnScript AI call log format
    const onscriptCallLogs = callLogs.map((callLog: any, index: number) => {
      const callLogId = `${campaignId}_${callLog.id || callLog.call_id || index}`
      const callId = callLog.id || callLog.call_id || callLog.uuid || `call_${index}`

      // Check if we have transcription/analysis data
      const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
      const existingCall = existingCalls.find((c: any) => c.callId === callId || c.externalId === callId)

      return {
        id: callLogId,
        campaignId,
        campaignName,
        callId,
        agentName: callLog.agent || callLog.agent_name || callLog.user || callLog.representative || "Unknown Agent",
        customerPhone: callLog.caller_id || callLog.from_number || callLog.ani || "Unknown",
        direction: (callLog.direction || callLog.type || "inbound") as "inbound" | "outbound",
        duration: Number.parseInt(callLog.duration || callLog.call_duration || "0"),
        startTime: callLog.start_time || callLog.date_created || callLog.timestamp || new Date().toISOString(),
        endTime: callLog.end_time || callLog.date_ended || null,
        status: callLog.status || callLog.call_status || "completed",
        disposition: callLog.disposition || callLog.call_disposition || callLog.outcome || "unknown",
        hasRecording: !!(callLog.recording_url || callLog.recordingUrl || callLog.audio_url),
        recordingUrl: callLog.recording_url || callLog.recordingUrl || callLog.audio_url || null,
        hasTranscription: !!existingCall?.transcript,
        hasAnalysis: !!existingCall?.analysis,
        revenue: Number.parseFloat(callLog.revenue || callLog.payout || "0"),
        cost: Number.parseFloat(callLog.cost || callLog.price || "0"),
        trackingNumber: callLog.tracking_number || callLog.promo_number || null,
        metadata: callLog,
      }
    })

    console.log(`✅ Transformed ${onscriptCallLogs.length} call logs to OnScript format`)

    return NextResponse.json({
      success: true,
      data: onscriptCallLogs,
      total: onscriptCallLogs.length,
      campaignId,
      campaignName,
      dataSource: "RINGBA_TO_ONSCRIPT",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Error fetching OnScript call logs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch call logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to get campaign name
async function getCampaignName(campaignId: string, apiKey: string, accountId: string): Promise<string> {
  try {
    const campaignsResponse = await fetch(`https://api.ringba.com/v2/${accountId}/campaigns`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!campaignsResponse.ok) {
      return `Campaign ${campaignId}`
    }

    const campaignsData = await campaignsResponse.json()
    const campaigns = campaignsData.data || campaignsData.campaigns || campaignsData || []
    const campaign = campaigns.find((c: any) => (c.id || c.campaign_id) === campaignId)

    return campaign?.name || campaign?.campaign_name || `Campaign ${campaignId}`
  } catch (error) {
    return `Campaign ${campaignId}`
  }
}
