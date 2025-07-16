import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, campaignName } = await request.json()

    const accountId = process.env.RINGBA_ACCOUNT_ID
    const apiKey = process.env.RINGBA_API_KEY

    if (!accountId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: "Missing RingBA credentials",
        debug: {
          hasAccountId: !!accountId,
          hasApiKey: !!apiKey,
          accountId: accountId ? `${accountId.substring(0, 10)}...` : "Not set",
        },
      })
    }

    // Prepare the request
    const url = `https://api.ringba.com/v2/${accountId}/calllogs`
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }

    const requestBody = {
      reportStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      reportEnd: new Date().toISOString(),
      offset: 0,
      size: 10,
      filters: campaignName
        ? [
            {
              anyConditionToMatch: [
                {
                  column: "campaignName",
                  value: campaignName,
                  isNegativeMatch: false,
                  comparisonType: "EQUALS",
                },
              ],
            },
          ]
        : [],
      valueColumns: [
        { column: "callDt" },
        { column: "campaignName" },
        { column: "campaignId" },
        { column: "ani" },
        { column: "dnis" },
        { column: "duration" },
        { column: "callStatus" },
        { column: "recordingUrl" },
      ],
    }

    console.log("🔍 [DEBUG] Making RingBA API request:")
    console.log("URL:", url)
    console.log("Headers:", { ...headers, Authorization: "Bearer [REDACTED]" })
    console.log("Body:", JSON.stringify(requestBody, null, 2))

    // Make the actual API call
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    console.log("📡 [DEBUG] RingBA API response:")
    console.log("Status:", response.status)
    console.log("Response:", responseData)

    return NextResponse.json({
      success: response.ok,
      debug: {
        request: {
          url,
          method: "POST",
          headers: { ...headers, Authorization: "Bearer [REDACTED]" },
          body: requestBody,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG] Error in debug request:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      debug: {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      },
    })
  }
}
