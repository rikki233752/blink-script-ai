import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    // Get request body
    const body = await request.json()
    const { campaignId, startDate, endDate } = body

    // Environment check
    const envCheck = {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      hasAccountId: !!accountId,
      accountIdLength: accountId?.length || 0,
      campaignId,
      startDate,
      endDate,
    }

    console.log("🔍 Debug Call Logs - Environment Check:", envCheck)

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing API credentials",
          envCheck,
        },
        { status: 400 },
      )
    }

    // Test different API endpoints with detailed logging
    const endpoints = [
      {
        name: "Call Logs API v2 (Correct Format)",
        url: `https://api.ringba.com/v2/${accountId}/calllogs`,
        method: "POST",
        body: {
          startDate: startDate || "2025-01-01",
          endDate: endDate || "2025-06-09",
          pageSize: 100,
          filters: campaignId
            ? [
                {
                  column: "campaignId",
                  operator: "Equals",
                  value: campaignId,
                },
              ]
            : undefined,
        },
      },
      {
        name: "Call Logs API v2 (Alternative Filter)",
        url: `https://api.ringba.com/v2/${accountId}/calllogs`,
        method: "POST",
        body: {
          startDate: startDate || "2025-01-01",
          endDate: endDate || "2025-06-09",
          pageSize: 100,
          filters: campaignId
            ? [
                {
                  column: "campaign_id",
                  operator: "Equals",
                  value: campaignId,
                },
              ]
            : undefined,
        },
      },
      {
        name: "Call Logs API v2 (No Filters)",
        url: `https://api.ringba.com/v2/${accountId}/calllogs`,
        method: "POST",
        body: {
          startDate: startDate || "2025-01-01",
          endDate: endDate || "2025-06-09",
          pageSize: 50,
        },
      },
    ]

    // Authentication methods to try
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
        name: "X-API-Key",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "API-Key Header",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    ]

    // Results for each attempt
    const results = []

    // Try each endpoint with each auth method
    for (const endpoint of endpoints) {
      for (const authMethod of authMethods) {
        try {
          console.log(`🔄 Testing ${endpoint.name} with ${authMethod.name}...`)

          const requestOptions: RequestInit = {
            method: endpoint.method,
            headers: authMethod.headers,
            body: JSON.stringify(endpoint.body),
          }

          // Log the exact request being made
          console.log(`📤 Request URL: ${endpoint.url}`)
          console.log(`📤 Request Headers:`, authMethod.headers)
          console.log(`📤 Request Body:`, endpoint.body)

          const startTime = Date.now()
          const response = await fetch(endpoint.url, requestOptions)
          const endTime = Date.now()

          const responseStatus = response.status
          const responseStatusText = response.statusText
          const responseHeaders = Object.fromEntries(response.headers.entries())

          console.log(`📥 Response Status: ${responseStatus} ${responseStatusText}`)
          console.log(`📥 Response Headers:`, responseHeaders)

          let responseBody
          let success = false
          let errorDetails = null

          try {
            responseBody = await response.json()
            success = response.ok
          } catch (parseError) {
            const text = await response.text()
            responseBody = { text: text.substring(0, 500) + (text.length > 500 ? "..." : "") }
            errorDetails = `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
          }

          results.push({
            endpoint: endpoint.name,
            auth: authMethod.name,
            url: endpoint.url,
            requestBody: endpoint.body,
            requestHeaders: {
              ...authMethod.headers,
              Authorization: authMethod.headers.Authorization ? "Bearer [REDACTED]" : undefined,
            },
            responseStatus,
            responseStatusText,
            responseHeaders,
            responseTime: endTime - startTime,
            success,
            errorDetails,
            responseBody: responseBody ? (success ? { sample: "Response too large, see logs" } : responseBody) : null,
          })

          if (success) {
            console.log(`✅ ${endpoint.name} with ${authMethod.name} succeeded!`)

            // Return early with the first successful result
            return NextResponse.json({
              success: true,
              message: `Successfully fetched call logs using ${endpoint.name} with ${authMethod.name}`,
              workingEndpoint: {
                name: endpoint.name,
                url: endpoint.url,
                method: endpoint.method,
                auth: authMethod.name,
              },
              results,
              envCheck,
            })
          } else {
            console.log(`❌ ${endpoint.name} with ${authMethod.name} failed: ${responseStatus} ${responseStatusText}`)
          }
        } catch (error) {
          console.error(`💥 Error testing ${endpoint.name} with ${authMethod.name}:`, error)

          results.push({
            endpoint: endpoint.name,
            auth: authMethod.name,
            url: endpoint.url,
            requestBody: endpoint.body,
            requestHeaders: {
              ...authMethod.headers,
              Authorization: authMethod.headers.Authorization ? "Bearer [REDACTED]" : undefined,
            },
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          })
        }
      }
    }

    // If we get here, all methods failed
    return NextResponse.json({
      success: false,
      message: "All API methods failed",
      results,
      envCheck,
    })
  } catch (error) {
    console.error("💥 Unexpected error in debug call logs API:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Debug process failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
