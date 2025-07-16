import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 })
    }

    // Get campaign and account details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
        *,
        ringba_accounts(*)
      `)
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const ringbaAccount = campaign.ringba_accounts

    // Prepare call logs request
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30) // Last 30 days

    const callLogsPayload = {
      campaignId: [Number.parseInt(campaign.campaign_id)],
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      columns: [
        "callId",
        "callerNumber",
        "agentName",
        "agentNumber",
        "callStartTime",
        "callEndTime",
        "callDuration",
        "disposition",
        "revenue",
        "recordingUrl",
        "recordingDuration",
      ],
    }

    // Fetch call logs from Ringba API
    const response = await fetch(`https://api.ringba.com/v2/${ringbaAccount.account_id}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ringbaAccount.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callLogsPayload),
    })

    if (!response.ok) {
      throw new Error(`Ringba API error: ${response.status}`)
    }

    const callLogsData = await response.json()
    const callLogs = []

    // Save call logs to database
    for (const callLog of callLogsData) {
      const { data: savedCallLog, error: callLogError } = await supabase
        .from("call_logs")
        .upsert(
          {
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            call_id: callLog.callId?.toString(),
            caller_number: callLog.callerNumber,
            agent_name: callLog.agentName,
            agent_number: callLog.agentNumber,
            call_start_time: callLog.callStartTime,
            call_end_time: callLog.callEndTime,
            call_duration: callLog.callDuration,
            disposition: callLog.disposition,
            revenue: callLog.revenue || 0,
            recording_url: callLog.recordingUrl,
            recording_duration: callLog.recordingDuration,
            call_status: "completed",
            metadata: callLog,
          },
          {
            onConflict: "user_id,call_id",
          },
        )
        .select()
        .single()

      if (!callLogError && savedCallLog) {
        callLogs.push(savedCallLog)
      }
    }

    // Update campaign stats
    await supabase
      .from("campaigns")
      .update({
        total_calls: callLogs.length,
        last_sync: new Date().toISOString(),
      })
      .eq("id", campaignId)

    return NextResponse.json({
      success: true,
      callCount: callLogs.length,
      callLogs,
    })
  } catch (error: any) {
    console.error("Call logs sync error:", error)
    return NextResponse.json({ error: error.message || "Call logs sync failed" }, { status: 500 })
  }
}
