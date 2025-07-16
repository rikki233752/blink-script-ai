import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID || "RA8e9b7b0388ea4968868bf2351b647158" // Use provided account ID as fallback

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API key not configured",
          details: "Please set RINGBA_API_KEY environment variable",
        },
        { status: 400 },
      )
    }

    // Get request body
    const requestBody = await request.json()

    // Extract parameters from request body
    const { campaignId, startDate, endDate, pageSize = 100, pageNumber = 1 } = requestBody

    console.log("🔍 Testing calllogs/detail endpoint with parameters:", {
      accountId,
      campaignId,
      startDate,
      endDate,
      pageSize,
      pageNumber,
    })

    // Construct the request payload based on the provided format
    const payload = {
      filters: [
        {
          column: "campaignId",
          operator: "Equals",
          value: campaignId,
        },
      ],
      startDate,
      endDate,
      pageSize,
      pageNumber,
    }

    // Make the request to Ringba API
    const ringbaUrl = `https://api.ringba.com/v2/${accountId}/calllogs/detail`

    console.log(`📡 Making request to: ${ringbaUrl}`)
    console.log(`📦 Request payload:`, JSON.stringify(payload, null, 2))

    const response = await fetch(ringbaUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Get response as text first to log it
    const responseText = await response.text()
    console.log(`📊 Response status:`, response.status)
    console.log(`📄 Response body:`, responseText)

    // Try to parse the response as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to parse Ringba API response as JSON",
        details: responseText,
        status: response.status,
        statusText: response.statusText,
        requestPayload: payload,
      })
    }

    // Check if the response was successful
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Ringba API returned ${response.status} ${response.statusText}`,
          details: responseData,
          requestPayload: payload,
        },
        { status: response.status },
      )
    }

    // Return the successful response
    return NextResponse.json({
      success: true,
      data: responseData,
      endpoint: "calllogs/detail",
      requestPayload: payload,
    })
  } catch (error) {
    console.error("💥 Error in calllogs/detail test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test calllogs/detail endpoint",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
