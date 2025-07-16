import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API credentials not configured",
          details: "Please set RINGBA_API_KEY and RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    const { campaignId } = params
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()
    const limit = searchParams.get("limit") || "200"
    const offset = searchParams.get("offset") || "0"

    // Use the Ringba call logs API endpoint
    const endpoint = `https://api.ringba.com/v2/${accountId}/calllogs`

    console.log("🎵 Fetching RECORDED calls from:", endpoint)
    console.log("📋 Campaign ID:", campaignId)

    // Build query parameters - focus on calls with recordings
    const queryParams = new URLSearchParams({
      limit,
      offset,
      startDate,
      endDate,
      // Add filters for recorded calls only
      hasRecording: "true",
      recordingAvailable: "true",
    })

    // Add campaign filter if provided
    if (campaignId && campaignId !== "all") {
      queryParams.append("campaignId", campaignId)
    }

    const fullEndpoint = `${endpoint}?${queryParams}`
    console.log("🔗 Full endpoint:", fullEndpoint)

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; CallCenter-Transcription/1.0)",
      "Cache-Control": "no-cache",
    }

    const response = await fetch(fullEndpoint, {
      method: "GET",
      headers,
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Ringba recorded calls API error:", response.status, errorText)

      // Try alternative authentication methods
      const altMethods = [
        {
          name: "X-API-Key",
          headers: { "X-API-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        },
        {
          name: "api-key",
          headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        },
      ]

      for (const method of altMethods) {
        try {
          console.log(`🔄 Trying ${method.name} authentication for recorded calls...`)

          const altResponse = await fetch(fullEndpoint, {
            method: "GET",
            headers: method.headers,
          })

          if (altResponse.ok) {
            console.log(`✅ ${method.name} authentication succeeded for recorded calls!`)
            const data = await altResponse.json()
            return processRecordedCallsResponse(data, campaignId, method.name)
          }
        } catch (altError) {
          console.error(`❌ ${method.name} auth failed for recorded calls:`, altError)
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch recorded calls for campaign ${campaignId}`,
          details: errorText,
          endpoint: fullEndpoint,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ Recorded calls fetched successfully!")
    console.log("📊 Response data keys:", Object.keys(data))

    return processRecordedCallsResponse(data, campaignId, "Bearer Token")
  } catch (error) {
    console.error("💥 Unexpected error in recorded calls API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recorded calls",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function processRecordedCallsResponse(data: any, campaignId: string, authMethod: string) {
  // Handle different response structures from Ringba
  let callLogs = []

  if (Array.isArray(data)) {
    callLogs = data
  } else if (data.callLogs) {
    callLogs = data.callLogs
  } else if (data.calls) {
    callLogs = data.calls
  } else if (data.data) {
    callLogs = Array.isArray(data.data) ? data.data : [data.data]
  } else if (data.results) {
    callLogs = data.results
  } else {
    callLogs = [data]
  }

  // Filter to only include calls with recordings
  const recordedCalls = callLogs.filter((call: any) => {
    const hasRecording = !!(
      call.recording_url ||
      call.recordingUrl ||
      call.recording ||
      call.audio_url ||
      call.audioUrl ||
      call.media_url ||
      call.mediaUrl
    )
    return hasRecording
  })

  console.log(
    `🎵 Found ${recordedCalls.length} recorded calls out of ${callLogs.length} total calls for campaign ${campaignId}`,
  )

  // Transform recorded calls to our format
  const transformedRecordedCalls = recordedCalls.map((call: any, index: number) => {
    const recordingUrl =
      call.recording_url ||
      call.recordingUrl ||
      call.recording ||
      call.audio_url ||
      call.audioUrl ||
      call.media_url ||
      call.mediaUrl

    return {
      id: call.id || call.call_id || call.callId || `recorded_call_${index}`,
      campaignId: call.campaign_id || call.campaignId || campaignId,
      campaignName: call.campaign_name || call.campaignName || "Unknown Campaign",
      callerId: call.caller_id || call.callerId || call.from || "Unknown",
      calledNumber: call.called_number || call.calledNumber || call.to || "Unknown",
      startTime: call.start_time || call.startTime || call.timestamp || new Date().toISOString(),
      endTime: call.end_time || call.endTime || null,
      duration: Number.parseInt(call.duration || call.call_duration || "0"),
      status: call.status || call.call_status || "completed",
      disposition: call.disposition || call.call_disposition || "answered",
      direction: call.direction || call.call_direction || "inbound",
      recordingUrl: recordingUrl,
      hasRecording: true, // All calls in this response have recordings
      agentName: call.agent_name || call.agentName || call.agent || "Unknown Agent",
      revenue: Number.parseFloat(call.revenue || call.payout || "0"),
      cost: Number.parseFloat(call.cost || "0"),
      quality: call.quality || call.call_quality || null,
      tags: call.tags || call.labels || [],
      metadata: call,
      // Transcription fields
      isTranscribed: false,
      transcriptionStatus: "pending",
      transcript: null,
      analysis: null,
      aiInsights: null,
      // Recording quality info
      recordingDuration: Number.parseInt(call.recording_duration || call.recordingDuration || call.duration || "0"),
      recordingFormat: call.recording_format || call.recordingFormat || "wav",
      recordingSize: call.recording_size || call.recordingSize || null,
    }
  })

  return NextResponse.json({
    success: true,
    data: transformedRecordedCalls,
    total: transformedRecordedCalls.length,
    totalWithRecordings: transformedRecordedCalls.length,
    campaignId,
    authMethod,
    dataSource: "REAL_RINGBA_API",
    endpoint: `https://api.ringba.com/v2/RA8e9b7b0388ea4968868bf2351b647158/calllogs`,
    message: `Found ${transformedRecordedCalls.length} recorded calls ready for transcription`,
  })
}
