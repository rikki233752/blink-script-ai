import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY || ""

    console.log("🔍 Discovering RingBA account structure...")

    // Since we know Bearer auth works, let's use that
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    const results = []

    // Try different ways to get account information
    const accountEndpoints = [
      "https://api.ringba.com/v2/accounts",
      "https://api.ringba.com/v2/account",
      "https://api.ringba.com/v2/user/accounts",
      "https://api.ringba.com/v2/me",
      "https://api.ringba.com/v2/profile",
      "https://api.ringba.com/v2/user",
      "https://api.ringba.com/v2/organizations",
      "https://api.ringba.com/v2/companies",
    ]

    for (const endpoint of accountEndpoints) {
      try {
        console.log(`Testing: ${endpoint}`)
        const response = await fetch(endpoint, {
          method: "GET",
          headers,
        })

        let responseData
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = await response.text()
        }

        const result = {
          endpoint,
          status: response.status,
          success: response.ok,
          data: responseData,
        }

        results.push(result)

        if (response.ok) {
          console.log(`✅ Success: ${endpoint}`)
          console.log("Response data:", JSON.stringify(responseData, null, 2))
        } else {
          console.log(`❌ Failed: ${endpoint} - ${response.status}`)
        }
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Try to discover available endpoints by testing common ones
    const commonEndpoints = [
      "https://api.ringba.com/v2/campaigns",
      "https://api.ringba.com/v2/calls",
      "https://api.ringba.com/v2/calllogs",
      "https://api.ringba.com/v2/numbers",
      "https://api.ringba.com/v2/targets",
      "https://api.ringba.com/v2/buyers",
      "https://api.ringba.com/v2/publishers",
      "https://api.ringba.com/v2/reports",
    ]

    console.log("🔍 Testing common endpoints...")
    for (const endpoint of commonEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers,
        })

        let responseData
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = await response.text()
        }

        results.push({
          endpoint,
          status: response.status,
          success: response.ok,
          data: responseData,
          type: "common_endpoint",
        })

        if (response.ok) {
          console.log(`✅ Available endpoint: ${endpoint}`)
        }
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
          type: "common_endpoint",
        })
      }
    }

    // Extract account information from successful responses
    const accountInfo = {
      accountIds: [] as string[],
      userInfo: null as any,
      availableEndpoints: [] as string[],
    }

    results.forEach((result) => {
      if (result.success && result.data) {
        // Look for account IDs in the response
        const dataStr = JSON.stringify(result.data)
        const accountIdMatches = dataStr.match(/[A-Z]{2}[a-f0-9]{32}/g) // Pattern like RA8e9b7b0388ea4968868bf2351b647158
        if (accountIdMatches) {
          accountInfo.accountIds.push(...accountIdMatches)
        }

        // Store user/account info
        if (result.endpoint.includes("me") || result.endpoint.includes("user") || result.endpoint.includes("profile")) {
          accountInfo.userInfo = result.data
        }

        // Track available endpoints
        if (result.success) {
          accountInfo.availableEndpoints.push(result.endpoint)
        }
      }
    })

    // Remove duplicates
    accountInfo.accountIds = [...new Set(accountInfo.accountIds)]

    return NextResponse.json({
      success: true,
      results,
      accountInfo,
      recommendations: [
        "Check the successful endpoints for your account information",
        "Look for account IDs in the response data",
        "Use the available endpoints to access your data",
        "Contact RingBA support if no account information is found",
      ],
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to discover account structure",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
