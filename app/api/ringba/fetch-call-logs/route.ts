import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { campaignId, startDate, endDate } = body

    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("Environment variables check:", {
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

    // Use the correct Ringba API payload structure
    const requestPayload: any = {
      startDate: startDate || "2025-01-01",
      endDate: endDate || "2025-06-09",
      pageSize: 100,
    }

    // Add campaign filter if specified
    if (campaignId && campaignId !== "all") {
      requestPayload.filters = [
        {
          column: "campaignId", // This might need to be adjusted based on Ringba's column names
          operator: "Equals",
          value: campaignId,
        },
      ]
    }

    console.log("Request URL:", `https://api.ringba.com/v2/${accountId}/calllogs`)
    console.log("Request payload:", JSON.stringify(requestPayload, null, 2))
    console.log("API Key (first 10 chars):", apiKey.substring(0, 10) + "...")

    // Make the API call with the correct format
    const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error Response:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: `Ringba API error: ${response.status} ${response.statusText}`,
          status: response.status,
          details: errorText,
          debugInfo: {
            url: `https://api.ringba.com/v2/${accountId}/calllogs`,
            payload: requestPayload,
            hasApiKey: !!apiKey,
            hasAccountId: !!accountId,
          },
        },
        { status: response.status },
      )
    }

    const result = await response.json()
    console.log("API Response:", result)

    // Check if result is an array or has data property
    let callLogs = []
    if (Array.isArray(result)) {
      callLogs = result
    } else if (result.data && Array.isArray(result.data)) {
      callLogs = result.data
    } else if (result.callLogs && Array.isArray(result.callLogs)) {
      callLogs = result.callLogs
    } else if (result.rows && Array.isArray(result.rows)) {
      callLogs = result.rows
    }

    console.log(`Found ${callLogs.length} call logs`)

    // Transform the call logs to our format
    const transformedCallLogs = callLogs.map((call: any, index: number) => {
      // Log first few calls for debugging
      if (index < 2) {
        console.log(`Call ${index} structure:`, Object.keys(call))
        console.log(`Call ${index} data:`, call)
      }

      return {
        id: call.id || call.callId || call.call_id || `CL${Date.now()}_${index}`,
        callerId: call.callerId || call.callerNumber || call.caller_id || call.ani || "Unknown",
        calledNumber: call.calledNumber || call.destinationNumber || call.called_number || call.dnis || "Unknown",
        startTime:
          call.startTime || call.callStartTime || call.call_start_time || call.date || new Date().toISOString(),
        endTime: call.endTime || call.callEndTime || call.call_end_time || null,
        duration: call.duration || call.callDuration || call.call_duration || 0,
        status: call.status || call.callStatus || call.call_status || "completed",
        disposition: call.disposition || call.callDisposition || call.call_disposition || "unknown",
        direction: call.direction || call.callDirection || call.call_direction || "inbound",
        recordingUrl: call.recordingUrl || call.recording || call.recording_url || call.recordingPath || null,
        hasRecording: !!(call.recordingUrl || call.recording || call.recording_url || call.recordingPath),
        agentName: call.agentName || call.agent || call.agent_name || call.agentId || "Unknown Agent",
        campaignId: call.campaignId || call.campaign_id || campaignId || "unknown",
        campaignName: call.campaignName || call.campaign_name || "Unknown Campaign",
        transcriptionStatus: "pending" as const,
        revenue: call.revenue || call.payout || 0,
        cost: call.cost || 0,
        tags: call.tags || [],
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedCallLogs,
      dataSource: "RINGBA_API",
      totalCalls: transformedCallLogs.length,
      callsWithRecordings: transformedCallLogs.filter((call) => call.hasRecording).length,
      campaignId: campaignId,
      dateRange: { startDate, endDate },
      rawResponse: result,
    })
  } catch (error) {
    console.error("Error in fetch-call-logs:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while fetching call logs",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
