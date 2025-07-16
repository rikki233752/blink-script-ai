import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== TESTING RETREAVER V2 API CONNECTION ===")

    const apiKey = process.env.RETREAVER_API_KEY
    const companyId = process.env.RETREAVER_ACCOUNT_ID || "170308"

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: "Retreaver API key is not configured. Please set RETREAVER_API_KEY environment variable.",
      })
    }

    // Test the exact V2 API format you specified
    const testUrl = `https://api.retreaver.com/api/v2/calls.json?api_key=${apiKey}`

    console.log("Testing V2 API connection with URL:", testUrl)
    console.log("Curl equivalent:", `curl "${testUrl}"`)

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "OnScript-Retreaver-V2-Test/1.0",
      },
    })

    console.log(`V2 API Test Response Status: ${response.status} ${response.statusText}`)
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("V2 API Test Error:", errorText)

      let errorMessage = `V2 API connection failed: ${response.status} - ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.message || errorJson.error) {
          errorMessage = errorJson.message || errorJson.error
        }
      } catch (e) {
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json({
        success: false,
        message: errorMessage,
        debug: {
          status: response.status,
          statusText: response.statusText,
          url: testUrl,
          headers: Object.fromEntries(response.headers.entries()),
          errorBody: errorText,
        },
      })
    }

    const data = await response.json()
    console.log("V2 API Test Response Type:", typeof data)
    console.log("V2 API Test Response Keys:", data && typeof data === "object" ? Object.keys(data) : "Not an object")

    // Check if we got valid data structure
    let callsFound = 0
    if (Array.isArray(data)) {
      callsFound = data.length
    } else if (data && typeof data === "object") {
      if (data.calls && Array.isArray(data.calls)) {
        callsFound = data.calls.length
      } else if (data.data && Array.isArray(data.data)) {
        callsFound = data.data.length
      }
    }

    console.log(`V2 API Test: Found ${callsFound} calls in response`)

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Retreaver V2 API. Found ${callsFound} calls.`,
      debug: {
        url: testUrl,
        curl_equivalent: `curl "${testUrl}"`,
        response_type: typeof data,
        response_keys: data && typeof data === "object" ? Object.keys(data) : [],
        calls_found: callsFound,
        company_id: companyId,
      },
    })
  } catch (error) {
    console.error("=== V2 API CONNECTION TEST FAILED ===")
    console.error("Error details:", error)

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
      error: {
        name: error instanceof Error ? error.name : "Unknown Error",
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
}
