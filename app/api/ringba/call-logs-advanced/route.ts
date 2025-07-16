import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "RingBA API credentials not configured",
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { campaignId, reportStart, reportEnd, filters = [], valueColumns = [] } = body

    // Build the exact request structure from the curl example
    const requestBody: any = {
      reportStart: reportStart || "2024-01-01T00:00:00Z",
      reportEnd: reportEnd || "2025-06-11T23:59:59Z",
      filters: [],
      valueColumns:
        valueColumns.length > 0
          ? valueColumns
          : [
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
            ],
    }

    // Add campaign filter if provided
    if (campaignId) {
      requestBody.filters.push({
        anyConditionToMatch: [
          {
            column: "campaignId",
            value: campaignId,
            isNegativeMatch: false,
            comparisonType: "EQUALS",
          },
        ],
      })
    }

    // Add any additional filters
    if (filters.length > 0) {
      requestBody.filters = [...requestBody.filters, ...filters]
    }

    console.log("🔑 Using account ID:", accountId)
    console.log("🌐 Making POST request to:", `https://api.ringba.com/v2/${accountId}/calllogs`)
    console.log("📊 Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Response status:", response.status)

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("📊 Response data structure:", {
        isSuccessful: data.isSuccessful,
        hasReport: !!data.report,
        hasRecords: !!data.report?.records,
        recordCount: data.report?.records?.length || 0,
      })
    } catch (e) {
      console.log("❌ Failed to parse response as JSON:", responseText)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to parse response: ${responseText}`,
          requestBody,
        },
        { status: 500 },
      )
    }

    if (!response.ok) {
      console.log("❌ API Error:", `${response.status} - ${responseText}`)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch call logs from RingBA API (${response.status})`,
          details: responseText,
          endpoint: `https://api.ringba.com/v2/${accountId}/calllogs`,
          campaignId,
          requestBody,
          troubleshooting: {
            status400: "Check if filter format is correct - should match the curl example",
            status401: "Verify RINGBA_API_KEY is correct and using Token format (not Bearer)",
            status403: "Ensure API key has call logs permissions",
            status404: "Check the URL format - no spaces between accountId and /calllogs",
            status422: "Check column names and request format",
            checkCampaignId: campaignId
              ? `Verify campaign ID '${campaignId}' exists in your RingBA account`
              : "No campaign ID provided",
            checkDateFormat: "Ensure dates are in ISO format",
          },
        },
        { status: response.status },
      )
    }

    // Extract and transform call logs
    let rawCallLogs = []
    let totalRecords = 0

    if (data.isSuccessful && data.report) {
      if (Array.isArray(data.report.records)) {
        rawCallLogs = data.report.records
        totalRecords = data.report.totalRecords || rawCallLogs.length
      } else if (Array.isArray(data.report)) {
        rawCallLogs = data.report
        totalRecords = rawCallLogs.length
      }
    } else if (Array.isArray(data.records)) {
      rawCallLogs = data.records
      totalRecords = data.totalRecords || rawCallLogs.length
    } else if (Array.isArray(data)) {
      rawCallLogs = data
      totalRecords = data.length
    }

    // Transform to app format
    const transformedCallLogs = rawCallLogs.map((record: any) => ({
      id: record.inboundCallId,
      campaignId: record.campaignId,
      callerId: record.inboundPhoneNumber,
      startTime: new Date(record.callDt).toISOString(),
      duration: Number.parseInt(record.callLengthInSeconds?.toString() || "0"),
      hasRecording: record.hasRecording,
      recordingUrl: record.recordingUrl,
      agentName: record.buyer || record.targetName,
      status: record.hasConnected ? "connected" : "not-connected",
      disposition: record.hasConverted ? "converted" : "not-converted",
    }))

    return NextResponse.json({
      success: true,
      callLogs: transformedCallLogs,
      totalRecords,
      rawResponse: data,
      requestBody,
    })
  } catch (error) {
    console.error("💥 Unexpected error:", error)
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
