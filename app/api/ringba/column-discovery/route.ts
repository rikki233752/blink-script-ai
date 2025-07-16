import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API credentials not configured",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Attempting to discover available RingBA columns")

    // Try to get columns from the API
    const endpoint = `https://api.ringba.com/v2/${accountId}/calllogs/columns`

    // Try with Bearer token first
    let response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log(`📡 Response status: ${response.status}`)

    // If Bearer token fails, try with Token prefix
    if (!response.ok) {
      console.log("🔄 Trying with Token prefix...")
      response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      console.log(`📡 Token prefix response status: ${response.status}`)
    }

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Successfully fetched column data`)

      return NextResponse.json({
        success: true,
        columns: data,
        endpoint,
      })
    } else {
      // Log the error for debugging
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status} - ${errorText}`)

      // Try a simple call logs request to see what columns are available
      const testEndpoint = `https://api.ringba.com/v2/${accountId}/calllogs`
      const testBody = {
        reportStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        reportEnd: new Date().toISOString(),
        offset: 0,
        size: 1,
        valueColumns: [{ column: "callDt" }],
      }

      console.log("🔄 Trying a simple call logs request to discover columns")

      const testResponse = await fetch(testEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testBody),
      })

      if (testResponse.ok) {
        const testData = await testResponse.json()
        console.log("✅ Test request succeeded, analyzing response")

        // Extract column names from the response
        const discoveredColumns = []
        if (testData.data && testData.data.length > 0) {
          const sampleRow = testData.data[0]
          discoveredColumns.push(...Object.keys(sampleRow))
        }

        return NextResponse.json({
          success: true,
          message: "Discovered columns from sample data",
          columns: discoveredColumns,
          sampleData: testData.data && testData.data.length > 0 ? testData.data[0] : null,
        })
      }

      return NextResponse.json({
        success: false,
        error: "Failed to discover columns",
        apiError: {
          endpoint,
          status: response.status,
          error: errorText,
        },
      })
    }
  } catch (error) {
    console.error("💥 Unexpected error in column discovery:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to discover columns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
