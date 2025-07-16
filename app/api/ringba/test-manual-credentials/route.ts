import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, accountId } = await request.json()

    if (!apiKey || !accountId) {
      return NextResponse.json({
        success: false,
        error: "API key and Account ID are required",
      })
    }

    console.log("🔍 Testing manual credentials:")
    console.log("- API Key length:", apiKey.length)
    console.log("- Account ID:", accountId)

    // Test different RingBA API endpoint formats and authentication methods
    const testCombinations = [
      // Different endpoint formats
      {
        name: "v2/accounts/{accountId}",
        url: `https://api.ringba.com/v2/accounts/${accountId}`,
        auth: "Bearer",
      },
      {
        name: "v2/{accountId}",
        url: `https://api.ringba.com/v2/${accountId}`,
        auth: "Bearer",
      },
      {
        name: "v1/accounts/{accountId}",
        url: `https://api.ringba.com/v1/accounts/${accountId}`,
        auth: "Bearer",
      },
      {
        name: "accounts/{accountId}",
        url: `https://api.ringba.com/accounts/${accountId}`,
        auth: "Bearer",
      },
      // Different auth methods with v2/accounts
      {
        name: "v2/accounts/{accountId} - API-Key",
        url: `https://api.ringba.com/v2/accounts/${accountId}`,
        auth: "API-Key",
      },
      {
        name: "v2/accounts/{accountId} - X-API-Key",
        url: `https://api.ringba.com/v2/accounts/${accountId}`,
        auth: "X-API-Key",
      },
    ]

    const results = []

    for (const combo of testCombinations) {
      try {
        console.log(`🔄 Testing: ${combo.name} with ${combo.auth}`)

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "CallCenter-Transcription/1.0",
        }

        // Set authentication header based on method
        switch (combo.auth) {
          case "Bearer":
            headers.Authorization = `Bearer ${apiKey}`
            break
          case "API-Key":
            headers["API-Key"] = apiKey
            break
          case "X-API-Key":
            headers["X-API-Key"] = apiKey
            break
        }

        const response = await fetch(combo.url, {
          method: "GET",
          headers,
        })

        const status = response.status
        let responseData = null

        try {
          if (response.headers.get("content-type")?.includes("application/json")) {
            responseData = await response.json()
          } else {
            const text = await response.text()
            responseData = { text: text.substring(0, 200) + "..." }
          }
        } catch (e) {
          responseData = { error: "Could not parse response" }
        }

        const result = {
          combination: combo.name,
          auth: combo.auth,
          url: combo.url,
          status,
          success: response.ok,
          data: responseData,
        }

        results.push(result)

        console.log(`📡 ${combo.name}: ${status} ${response.ok ? "✅" : "❌"}`)

        // If we found a working combination, return success immediately
        if (response.ok) {
          return NextResponse.json({
            success: true,
            workingCombination: result,
            message: `Successfully authenticated with ${combo.name} using ${combo.auth}`,
            allResults: results,
          })
        }
      } catch (error) {
        const errorResult = {
          combination: combo.name,
          auth: combo.auth,
          url: combo.url,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        }
        results.push(errorResult)
        console.error(`💥 ${combo.name} error:`, error)
      }
    }

    // If we get here, no combination worked
    return NextResponse.json({
      success: false,
      error: "No working authentication method found",
      results,
      recommendations: [
        "Verify your API key is correct and active in RingBA dashboard",
        "Check if your Account ID is correct (it should start with 'RA' followed by alphanumeric characters)",
        "Ensure your API key has proper permissions for account access",
        "Check if there are IP restrictions on your API key",
        "Contact RingBA support to verify the correct API endpoint format",
      ],
    })
  } catch (error) {
    console.error("💥 Manual credentials test error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to test credentials",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
