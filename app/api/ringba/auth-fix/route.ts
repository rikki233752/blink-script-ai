import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json({
        success: false,
        error: "Missing credentials",
        details: "API key or Account ID is missing from environment variables",
      })
    }

    console.log("🔍 Testing RingBA API with environment credentials")
    console.log("- API Key length:", apiKey.length)
    console.log("- Account ID:", accountId)

    // Test different authentication methods and endpoints
    const testCombinations = [
      {
        name: "Bearer Token - v2/accounts",
        url: `https://api.ringba.com/v2/accounts/${accountId}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "Bearer Token - v2 direct",
        url: `https://api.ringba.com/v2/${accountId}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "API-Key Header - v2/accounts",
        url: `https://api.ringba.com/v2/accounts/${accountId}`,
        headers: {
          "API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "X-API-Key Header - v2/accounts",
        url: `https://api.ringba.com/v2/accounts/${accountId}`,
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    ]

    const results = []

    // Test each combination
    for (const combo of testCombinations) {
      try {
        console.log(`🔄 Testing ${combo.name}...`)

        const response = await fetch(combo.url, {
          method: "GET",
          headers: combo.headers,
        })

        const status = response.status
        let responseData = null

        try {
          responseData = await response.json()
        } catch (e) {
          const text = await response.text()
          responseData = { text: text.substring(0, 100) + "..." }
        }

        const result = {
          name: combo.name,
          url: combo.url,
          status,
          success: response.ok,
          data: responseData,
          headers: combo.headers,
        }

        results.push(result)

        // If we found a working combination, return it immediately
        if (response.ok) {
          console.log(`✅ Found working combination: ${combo.name}`)
          return NextResponse.json({
            success: true,
            workingCombination: result,
            allResults: results,
          })
        }
      } catch (error) {
        results.push({
          name: combo.name,
          url: combo.url,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // If we get here, no combination worked
    return NextResponse.json({
      success: false,
      error: "No working API combination found",
      results,
      recommendations: [
        "Verify your API key is active in the RingBA dashboard",
        "Check if your account ID is correct",
        "Ensure your API key has the necessary permissions",
        "Contact RingBA support to confirm the correct API format",
      ],
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to test authentication methods",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
