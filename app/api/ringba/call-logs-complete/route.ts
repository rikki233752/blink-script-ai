import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("🔑 Environment check:")
    console.log("- API Key exists:", !!apiKey)
    console.log("- Account ID:", accountId)

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "RingBA API credentials not configured",
          details: "Missing RINGBA_API_KEY or RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { campaignId, reportStart, reportEnd, offset, size, getAllPages } = body

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign ID is required",
        },
        { status: 400 },
      )
    }

    // Build the EXACT request body structure from RingBA API docs
    const requestBody = {
      reportStart: reportStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      reportEnd: reportEnd || new Date().toISOString(),
      offset: offset || 0,
      size: size || 100,
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
      valueColumns: [
        { column: "inboundCallId" },
        { column: "callDt" },
        { column: "campaignId" },
        { column: "campaignName" },
        { column: "inboundPhoneNumber" },
        { column: "callLengthInSeconds" },
        { column: "hasConnected" },
        { column: "hasConverted" },
        { column: "recordingUrl" },
        { column: "hasRecording" },
        { column: "buyer" },
        { column: "targetName" },
        { column: "publisherName" },
        { column: "targetNumber" },
        { column: "payoutAmount" },
        { column: "conversionAmount" },
      ],
    }

    const endpoint = `https://api.ringba.com/v2/${accountId}/calllogs`

    console.log("🔑 Using account ID:", accountId)
    console.log("🌐 Making POST request to:", endpoint)
    console.log("📊 Request body:", JSON.stringify(requestBody, null, 2))

    // Use the correct authorization header format
    const headers = {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    console.log("🔐 Authorization header:", `Token ${apiKey.substring(0, 10)}...`)

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("❌ API Error:", response.status, "-", errorText)

      let troubleshooting = {}
      switch (response.status) {
        case 400:
          troubleshooting = {
            issue: "Bad Request - Invalid request format",
            solutions: [
              "Check if the request body structure matches RingBA API docs",
              "Verify column names are correct",
              "Ensure filter format is correct",
            ],
          }
          break
        case 401:
          troubleshooting = {
            issue: "Authorization Denied - Invalid API credentials",
            solutions: [
              "Verify RINGBA_API_KEY is correct and active",
              "Check if API key has expired",
              "Ensure you're using 'Token' prefix, not 'Bearer'",
              "Verify account ID matches the API key",
            ],
          }
          break
        case 403:
          troubleshooting = {
            issue: "Forbidden - Insufficient permissions",
            solutions: [
              "Ensure API key has call logs access permissions",
              "Check if your account has access to this campaign",
              "Verify user role permissions",
            ],
          }
          break
        case 422:
          troubleshooting = {
            issue: "Unprocessable Entity - Invalid data format",
            solutions: [
              "Check column names against available columns",
              "Verify filter values and types",
              "Ensure date formats are correct",
            ],
          }
          break
        default:
          troubleshooting = {
            issue: `HTTP ${response.status} error`,
            solutions: ["Check RingBA API status", "Verify network connectivity"],
          }
      }

      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch call logs from RingBA API (${response.status})`,
          details: errorText,
          endpoint,
          campaignId,
          requestBody,
          troubleshooting,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ API Success - Response received")
    console.log("📊 Response structure:", {
      isSuccessful: data.isSuccessful,
      hasReport: !!data.report,
      hasRecords: !!data.report?.records,
      recordCount: data.report?.records?.length || 0,
    })

    // Handle the RingBA API response structure
    let callLogs = []
    let totalRecords = 0

    if (data.isSuccessful && data.report) {
      if (Array.isArray(data.report.records)) {
        callLogs = data.report.records
        totalRecords = data.report.totalRecords || callLogs.length
      } else if (Array.isArray(data.report)) {
        callLogs = data.report
        totalRecords = callLogs.length
      }
    } else if (Array.isArray(data.records)) {
      callLogs = data.records
      totalRecords = data.totalRecords || callLogs.length
    } else if (Array.isArray(data)) {
      callLogs = data
      totalRecords = data.length
    }

    // Transform call logs to our format
    const transformedCallLogs = callLogs.map((call: any) => ({
      inboundCallId: call.inboundCallId || call.callId || "",
      callDt: call.callDt || call.callStartTime || new Date().toISOString(),
      campaignId: call.campaignId || "",
      campaignName: call.campaignName || "Unknown Campaign",
      inboundPhoneNumber: call.inboundPhoneNumber || call.callerId || "",
      callLengthInSeconds: Number.parseInt(call.callLengthInSeconds || call.duration || "0"),
      hasConnected: Boolean(call.hasConnected),
      hasConverted: Boolean(call.hasConverted),
      recordingUrl: call.recordingUrl || null,
      hasRecording: Boolean(call.hasRecording),
      buyer: call.buyer || "Unknown",
      targetName: call.targetName || "Unknown",
      publisherName: call.publisherName || "Unknown",
      payoutAmount: Number.parseFloat(call.payoutAmount || "0"),
      metadata: call,
    }))

    console.log(`✅ Transformed ${transformedCallLogs.length} call logs`)

    return NextResponse.json({
      success: true,
      callLogs: transformedCallLogs,
      totalRecords,
      campaignId,
      timestamp: new Date().toISOString(),
      apiResponse: {
        isSuccessful: data.isSuccessful,
        transactionId: data.transactionId,
        recordCount: transformedCallLogs.length,
      },
    })
  } catch (error) {
    console.log("💥 Unexpected error:", error)
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
