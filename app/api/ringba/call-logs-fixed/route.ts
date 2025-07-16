import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("🔑 Using account ID:", accountId)
    console.log("🔑 API Key present:", !!apiKey)

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "RingBA API credentials not configured",
          troubleshooting: {
            checkEnvVars: "Ensure RINGBA_API_KEY and RINGBA_ACCOUNT_ID are set in environment variables",
          },
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { campaignId, reportStart, reportEnd, offset, size } = body

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign ID is required",
        },
        { status: 400 },
      )
    }

    // Build the EXACT request body structure from the curl example
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
        { column: "connectedCallLengthInSeconds" },
        { column: "hasConnected" },
        { column: "hasConverted" },
        { column: "recordingUrl" },
        { column: "hasRecording" },
        { column: "targetName" },
        { column: "publisherName" },
        { column: "conversionAmount" },
        { column: "payoutAmount" },
        { column: "totalCost" },
        { column: "timeToConnectInSeconds" },
        { column: "endCallSource" },
      ],
    }

    const endpoint = `https://api.ringba.com/v2/${accountId}/calllogs`

    console.log("🌐 Making POST request to:", endpoint)
    console.log("📊 EXACT Request body (matching curl example):", JSON.stringify(requestBody, null, 2))

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("❌ API Error:", response.status, "-", errorText)

      return NextResponse.json({
        success: false,
        error: `Failed to fetch call logs from RingBA API (${response.status})`,
        details: errorText,
        endpoint,
        campaignId,
        requestBody,
        troubleshooting: {
          status400: "Check request body format - ensure it matches the curl example exactly",
          status401: "Verify RINGBA_API_KEY is correct and using 'Token' prefix (not Bearer)",
          status403: "Ensure API key has call logs permissions",
          status404: "Check the URL format and account ID",
          status422: "Check column names in valueColumns array",
          checkCampaignId: `Verify campaign ID '${campaignId}' exists in your RingBA account`,
          checkRequestFormat: "Ensure using reportStart/reportEnd and filters array format",
        },
      })
    }

    const data = await response.json()
    console.log("✅ Raw API response:", {
      isSuccessful: data.isSuccessful,
      transactionId: data.transactionId,
      hasReport: !!data.report,
      recordCount: data.report?.records?.length || 0,
      totalCount: data.report?.totalCount || 0,
    })

    // Transform the response to match our app format
    let transformedCallLogs = []

    if (data.isSuccessful && data.report && Array.isArray(data.report.records)) {
      transformedCallLogs = data.report.records.map((record: any) => ({
        id: record.inboundCallId,
        campaignId: record.campaignId,
        campaignName: record.campaignName,
        callerId: record.inboundPhoneNumber,
        startTime: new Date(record.callDt).toISOString(),
        duration: Number.parseInt(record.callLengthInSeconds?.toString() || "0"),
        connectedDuration: Number.parseInt(record.connectedCallLengthInSeconds?.toString() || "0"),
        hasRecording: record.hasRecording,
        recordingUrl: record.recordingUrl,
        agentName: record.targetName || record.publisherName,
        status: record.hasConnected ? "connected" : "not-connected",
        disposition: record.hasConverted ? "converted" : "not-converted",
        revenue: Number.parseFloat(record.conversionAmount?.toString() || "0"),
        cost: Number.parseFloat(record.totalCost?.toString() || "0"),
        payout: Number.parseFloat(record.payoutAmount?.toString() || "0"),
        timeToConnect: Number.parseInt(record.timeToConnectInSeconds?.toString() || "0"),
        endCallSource: record.endCallSource,
        publisherName: record.publisherName,
      }))
    }

    return NextResponse.json({
      success: true,
      callLogs: transformedCallLogs,
      totalRecords: data.report?.totalCount || transformedCallLogs.length,
      isPartialResult: data.report?.partialResult || false,
      transactionId: data.transactionId,
      campaignId,
      requestFormat: "EXACT_CURL_FORMAT",
      timestamp: new Date().toISOString(),
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
