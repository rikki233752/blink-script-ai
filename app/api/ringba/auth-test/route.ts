import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing API credentials",
          details: "RINGBA_API_KEY or RINGBA_ACCOUNT_ID environment variables are not set",
        },
        { status: 400 },
      )
    }

    // Test different API endpoints and auth methods
    const testResults = []
    const endpoints = [
      `https://api.ringba.com/v2/${accountId}/campaigns`,
      `https://api.ringba.com/v2/accounts/${accountId}/campaigns`,
      `https://api.ringba.com/v2/${accountId}/ping`,
      `https://api.ringba.com/v2/ping`,
    ]

    const authMethods = [
      { name: "Bearer Token", headers: { Authorization: `Bearer ${apiKey}` } },
      { name: "Token", headers: { Authorization: `Token ${apiKey}` } },
      { name: "API Key Header", headers: { "X-API-Key": apiKey } },
      { name: "API Key Auth", headers: { "api-key": apiKey } },
      { name: "Basic Auth", headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` } },
    ]

    for (const endpoint of endpoints) {
      for (const auth of authMethods) {
        try {
          console.log(`Testing ${auth.name} with endpoint ${endpoint}`)

          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              ...auth.headers,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })

          const responseText = await response.text()
          let responseData
          try {
            responseData = JSON.parse(responseText)
          } catch (e) {
            responseData = { rawText: responseText }
          }

          testResults.push({
            endpoint,
            authMethod: auth.name,
            status: response.status,
            statusText: response.statusText,
            success: response.ok,
            data: responseData,
          })

          if (response.ok) {
            console.log(`✅ Success with ${auth.name} on ${endpoint}`)
          } else {
            console.log(`❌ Failed with ${auth.name} on ${endpoint}: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error(`Error testing ${auth.name} with ${endpoint}:`, error)
          testResults.push({
            endpoint,
            authMethod: auth.name,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            success: false,
          })
        }
      }
    }

    // Find any successful methods
    const successfulMethods = testResults.filter((result) => result.success)

    return NextResponse.json({
      success: successfulMethods.length > 0,
      message:
        successfulMethods.length > 0
          ? `Found ${successfulMethods.length} working authentication methods`
          : "No working authentication methods found",
      apiKeyLength: apiKey.length,
      accountIdLength: accountId.length,
      apiKeyPrefix: apiKey.substring(0, 5) + "...",
      accountIdPrefix: accountId.substring(0, 5) + "...",
      testResults,
      recommendedMethod: successfulMethods.length > 0 ? successfulMethods[0] : null,
    })
  } catch (error) {
    console.error("Error in auth test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test authentication",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
