import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("Testing Ringba Authentication...")
    console.log("API Key present:", !!apiKey)
    console.log("Account ID present:", !!accountId)
    console.log("API Key length:", apiKey?.length || 0)
    console.log("Account ID:", accountId)

    if (!apiKey || !accountId) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        details: {
          hasApiKey: !!apiKey,
          hasAccountId: !!accountId,
        },
      })
    }

    // Test multiple endpoints to find what works
    const testEndpoints = [
      `https://api.ringba.com/v2/${accountId}/campaigns`,
      `https://api.ringba.com/v2/${accountId}/account`,
      `https://api.ringba.com/v1/${accountId}/campaigns`,
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`)

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        })

        const result = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        }

        if (response.ok) {
          try {
            const data = await response.json()
            result.dataType = Array.isArray(data) ? "array" : typeof data
            result.dataLength = Array.isArray(data) ? data.length : Object.keys(data || {}).length
            result.sampleData = Array.isArray(data) ? data.slice(0, 1) : data
          } catch (e) {
            result.parseError = "Could not parse JSON response"
          }
        } else {
          try {
            result.errorBody = await response.text()
          } catch (e) {
            result.errorBody = "Could not read error response"
          }
        }

        results.push(result)

        // If we found a working endpoint, break
        if (response.ok) {
          break
        }
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : String(error),
          success: false,
        })
      }
    }

    return NextResponse.json({
      success: results.some((r) => r.success),
      results,
      environment: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        accountId,
      },
    })
  } catch (error) {
    console.error("Auth test error:", error)
    return NextResponse.json({ success: false, error: "Test failed", details: String(error) }, { status: 500 })
  }
}
