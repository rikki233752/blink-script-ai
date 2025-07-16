import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { campaignId, startDate, endDate } = body

    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing RINGBA_API_KEY or RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    // Test with minimal payload first
    const testPayload = {
      startDate: startDate || "2024-05-01T00:00:00Z",
      endDate: endDate || "2024-05-31T23:59:59Z",
      filters: {
        campaignIds: campaignId ? [campaignId] : undefined,
        hasRecording: true,
      },
      columns: ["CallDate", "CampaignName", "CallerId", "Duration", "Disposition", "RecordingUrl"],
      sort: {
        column: "CallDate",
        direction: "desc",
      },
    }

    console.log("Test payload:", JSON.stringify(testPayload, null, 2))

    const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    const responseText = await response.text()
    console.log("Raw response:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = responseText
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      rawResponse: responseText,
      parsedResponse: responseData,
      requestPayload: testPayload,
    })
  } catch (error) {
    console.error("Error in test-call-logs:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
