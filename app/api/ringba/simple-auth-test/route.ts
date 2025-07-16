import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        details: { hasApiKey: !!apiKey, hasAccountId: !!accountId },
      })
    }

    console.log("Testing Ringba API authentication...")
    console.log("API Key length:", apiKey.length)
    console.log("Account ID:", accountId)

    // Test the exact call logs endpoint with minimal payload
    const testPayload = {
      startDate: "2024-12-01T00:00:00Z",
      endDate: "2024-12-09T23:59:59Z",
      hasRecording: true,
      pageSize: 5,
    }

    console.log("Testing with payload:", testPayload)

    const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("Response body:", responseText)

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
      data: responseData,
      environment: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 20) + "...",
        accountId,
      },
      requestDetails: {
        url: `https://api.ringba.com/v2/${accountId}/calllogs`,
        method: "POST",
        payload: testPayload,
      },
    })
  } catch (error) {
    console.error("Auth test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
