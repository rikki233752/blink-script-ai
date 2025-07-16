import { NextResponse } from "next/server"

export async function POST() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json({
        success: false,
        error: "Missing API credentials",
        debug: {
          hasApiKey: !!apiKey,
          hasAccountId: !!accountId,
        },
      })
    }

    console.log("🔍 Testing different authentication methods...")
    console.log("API Key length:", apiKey.length)
    console.log("Account ID:", accountId)

    const testEndpoint = `https://api.ringba.com/v2/${accountId}/campaigns`
    const results = []

    // Test different authentication methods
    const authMethods = [
      {
        name: "Bearer Token",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "Token Prefix",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "API-Key Header",
        headers: {
          "API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "X-API-Key Header",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "Basic Auth",
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    ]

    for (const method of authMethods) {
      try {
        console.log(`🔄 Testing ${method.name}...`)

        const response = await fetch(testEndpoint, {
          method: "GET",
          headers: method.headers,
        })

        let responseData
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = await response.text()
        }

        const result = {
          method: method.name,
          status: response.status,
          success: response.ok,
          headers: method.headers,
          response: responseData,
        }

        results.push(result)

        console.log(`📡 ${method.name}: ${response.status} ${response.ok ? "✅" : "❌"}`)

        // If this method works, also test the call logs endpoint
        if (response.ok) {
          console.log(`🎉 ${method.name} works! Testing call logs endpoint...`)

          const callLogsEndpoint = `https://api.ringba.com/v2/${accountId}/calllogs`
          const callLogsBody = {
            reportStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            reportEnd: new Date().toISOString(),
            offset: 0,
            size: 5,
            valueColumns: [{ column: "callDt" }, { column: "campaignName" }, { column: "ani" }],
          }

          const callLogsResponse = await fetch(callLogsEndpoint, {
            method: "POST",
            headers: method.headers,
            body: JSON.stringify(callLogsBody),
          })

          let callLogsData
          try {
            callLogsData = await callLogsResponse.json()
          } catch (e) {
            callLogsData = await callLogsResponse.text()
          }

          result.callLogsTest = {
            status: callLogsResponse.status,
            success: callLogsResponse.ok,
            response: callLogsData,
          }

          console.log(`📞 Call logs test: ${callLogsResponse.status} ${callLogsResponse.ok ? "✅" : "❌"}`)
        }
      } catch (error) {
        results.push({
          method: method.name,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        })
        console.error(`💥 ${method.name} error:`, error)
      }
    }

    // Find working methods
    const workingMethods = results.filter((r) => r.success)

    return NextResponse.json({
      success: workingMethods.length > 0,
      workingMethods,
      allResults: results,
      recommendations:
        workingMethods.length > 0
          ? [`Use ${workingMethods[0].method} for authentication`]
          : [
              "Check if your API key is correct and active",
              "Verify the API key has proper permissions",
              "Check if there are IP restrictions on your API key",
              "Contact RingBA support to verify the correct authentication method",
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
