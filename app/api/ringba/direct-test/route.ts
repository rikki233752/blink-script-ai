import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY || ""

    // Log key details for debugging (safely)
    console.log("API Key length:", apiKey.length)
    console.log("API Key first 4 chars:", apiKey.substring(0, 4))

    // Try the base API endpoints without account ID
    const baseEndpoints = [
      "https://api.ringba.com/v2",
      "https://api.ringba.com/v1",
      "https://api.ringba.com",
      "https://api.ringba.com/v2/ping",
      "https://api.ringba.com/v2/health",
    ]

    const authMethods = [
      {
        name: "Bearer",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
      {
        name: "API-Key",
        headers: {
          "API-Key": apiKey,
          "Content-Type": "application/json",
        },
      },
    ]

    const results = []

    // Test base endpoints first
    for (const endpoint of baseEndpoints) {
      for (const auth of authMethods) {
        try {
          console.log(`Testing base endpoint: ${endpoint} with ${auth.name}`)
          const response = await fetch(endpoint, {
            method: "GET",
            headers: auth.headers,
          })

          let responseData
          try {
            responseData = await response.json()
          } catch (e) {
            responseData = await response.text()
          }

          results.push({
            endpoint,
            auth: auth.name,
            status: response.status,
            success: response.ok,
            data: responseData,
          })

          if (response.ok) {
            console.log(`✅ Found working base endpoint: ${endpoint} with ${auth.name}`)
          }
        } catch (error) {
          results.push({
            endpoint,
            auth: auth.name,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }
    }

    // Try to list accounts (if API supports it)
    try {
      console.log("Attempting to list accounts...")
      const response = await fetch("https://api.ringba.com/v2/accounts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      let accountsData
      try {
        accountsData = await response.json()
      } catch (e) {
        accountsData = await response.text()
      }

      results.push({
        endpoint: "https://api.ringba.com/v2/accounts",
        auth: "Bearer",
        status: response.status,
        success: response.ok,
        data: accountsData,
      })

      if (response.ok) {
        console.log("✅ Successfully listed accounts!")
      }
    } catch (error) {
      results.push({
        endpoint: "https://api.ringba.com/v2/accounts",
        auth: "Bearer",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Try RingBA's documentation endpoint
    try {
      console.log("Checking API documentation...")
      const response = await fetch("https://api.ringba.com/swagger/docs/v2", {
        method: "GET",
      })

      const status = response.status
      results.push({
        endpoint: "https://api.ringba.com/swagger/docs/v2",
        status,
        success: response.ok,
      })

      if (response.ok) {
        console.log("✅ API documentation is available")
      }
    } catch (error) {
      results.push({
        endpoint: "https://api.ringba.com/swagger/docs/v2",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    return NextResponse.json({
      success: results.some((r) => r.success),
      results,
      recommendations: [
        "Check RingBA dashboard for the exact account ID format",
        "Verify your API key has the necessary permissions",
        "Contact RingBA support for the correct API structure",
        "Try using RingBA's official SDK if available",
      ],
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to test RingBA API",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
