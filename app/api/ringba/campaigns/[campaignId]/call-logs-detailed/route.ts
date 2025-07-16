import { NextRequest, NextResponse } from "next/server"

interface CallLogsRequest {
  reportStart: string
  reportEnd: string
  offset?: number
  size?: number
  filters?: Array<{
    anyConditionToMatch: Array<{
      column: string
      value: string
      isNegativeMatch: boolean
      comparisonType: string
    }>
  }>
}

export async function POST(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const { campaignId } = params
    const body = await request.json()

    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString(),
      offset = 0,
      size = 100,
    } = body

    console.log(`📞 Fetching call logs for campaign: ${campaignId}`)

    // Get environment variables
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "RingBA API credentials not configured",
          details: "Missing RINGBA_API_KEY or RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 500 },
      )
    }

    // Build the exact request body structure matching the curl example
    const requestBody: CallLogsRequest = {
      reportStart: startDate,
      reportEnd: endDate,
      offset,
      size,
      filters: [
        {
          anyConditionToMatch: [
            {
              column: "campaignId",
              value: campaignId,
              isNegativeMatch: false,
              comparisonType: "EQUALS",
            },
          ],
        },
      ],
    }

    console.log("📋 RingBA Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ RingBA API Error: ${response.status} - ${errorText}`)

      return NextResponse.json(
        {
          success: false,
          error: `RingBA API Error: ${response.status}`,
          details: errorText,
          endpoint: `https://api.ringba.com/v2/${accountId}/calllogs`,
          requestBody,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("📡 RingBA Call Logs Response:", data)

    // Handle the RingBA API response structure
    let callLogsData = []
    let totalRecords = 0

    if (data.isSuccessful !== false) {
      if (data.report && Array.isArray(data.report.records)) {
        callLogsData = data.report.records
        totalRecords = data.report.totalRecords || callLogsData.length
      } else if (data.report && Array.isArray(data.report)) {
        callLogsData = data.report
        totalRecords = callLogsData.length
      } else if (Array.isArray(data.records)) {
        callLogsData = data.records
        totalRecords = data.totalRecords || callLogsData.length
      } else if (Array.isArray(data)) {
        callLogsData = data
        totalRecords = data.length
      }
    }

    // Transform call logs to our format using available RingBA fields
    const transformedCallLogs = callLogsData.map((call: any, index: number) => ({
      callId: call.inboundCallId || call.callId || call.id || `call_${index}`,
      agent: call.targetName || call.buyer || call.agent || "Unknown Agent",
      duration: Number.parseInt(call.callLengthInSeconds || call.duration || "0"),
      recordingUrl: call.recordingUrl || null,
      id: call.inboundCallId || call.callId || call.id || `call_${index}`,
      campaignId: call.campaignId || campaignId,
      direction: call.direction || "inbound",
      callerId: call.inboundPhoneNumber || call.callerNumber || call.fromNumber || "",
      calledNumber: call.targetNumber || call.toNumber || call.dialedNumber || "",
      startTime: call.callDt || call.callStartTime || call.startTime || new Date().toISOString(),
      endTime: call.callEndTime || call.endTime || null,
      status: call.status || (call.hasConnected ? "connected" : "not connected"),
      disposition: call.disposition || (call.hasConverted ? "converted" : "not converted"),
      hasRecording: Boolean(call.hasRecording || call.recordingUrl),
      publisherId: call.publisherName || call.publisherId || "",
      targetId: call.targetName || call.targetId || "",
      trackingNumber: call.inboundPhoneNumber || call.trackingNumber || "",
      revenue: Number.parseFloat(call.conversionAmount || call.payoutAmount || call.revenue || "0"),
      cost: Number.parseFloat(call.cost || "0"),
      metadata: call,
    }))

    console.log(`✅ Successfully fetched ${transformedCallLogs.length} call logs for campaign ${campaignId}`)

    return NextResponse.json({
      success: true,
      data: transformedCallLogs,
      totalRecords,
      endpoint: `https://api.ringba.com/v2/${accountId}/calllogs`,
      campaignId,
      dateRange: {
        startDate,
        endDate,
      },
      rawResponse: data, // Include raw response for debugging
    })
  } catch (error) {
    console.error("❌ Error fetching campaign call logs:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to fetch call logs from RingBA API",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  // Handle GET requests by converting to POST format
  const { searchParams } = new URL(request.url)

  const postBody = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    offset: Number.parseInt(searchParams.get("offset") || "0"),
    size: Number.parseInt(searchParams.get("size") || "100"),
  }

  // Create a new request object for POST
  const postRequest = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(postBody),
  })

  return POST(postRequest, { params })
}
