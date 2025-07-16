import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("🔍 Testing RingBA Credentials:")
    console.log("- API Key exists:", !!apiKey)
    console.log("- API Key length:", apiKey?.length || 0)
    console.log("- API Key format:", apiKey?.startsWith("sk_") ? "Correct format" : "Unknown format")
    console.log("- Account ID:", accountId)

    if (!apiKey || !accountId) {
      return NextResponse.json({
        success: false,
        error: "Missing credentials",
        details: {
          hasApiKey: !!apiKey,
          hasAccountId: !!accountId,
          message: "Please check your environment variables",
        },
      })
    }

    // Test basic API connectivity
    const testEndpoints = [
      `https://api.ringba.com/v2/${accountId}/account`,
      `https://api.ringba.com/v2/${accountId}/campaigns`,
      `https://api.ringba.com/v2/${accountId}/calllogs/columns`,
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔄 Testing endpoint: ${endpoint}`)

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "CallCenter-Transcription/1.0",
          },
        })

        const responseText = await response.text()
        let responseData = null

        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = responseText.substring(0, 200) + "..."
        }

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
        })

        console.log(`📡 ${endpoint}: ${response.status} ${response.statusText}`)
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        })
        console.error(`❌ ${endpoint}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      credentials: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10) + "...",
        accountId,
      },
      testResults: results,
      recommendations: [
        "Verify your API key is active and has the correct permissions",
        "Check that your account ID is correct",
        "Ensure your IP address is whitelisted in RingBA",
        "Verify the API key has 'Call Logs' and 'Campaigns' permissions",
      ],
    })
  } catch (error) {
    console.error("💥 Credential test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
