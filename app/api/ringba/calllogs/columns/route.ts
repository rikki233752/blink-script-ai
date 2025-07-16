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
          details: "Please set RINGBA_API_KEY and RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    console.log("🌐 Fetching call log columns from Ringba API")

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

    let lastError = null

    // Try each auth method
    for (const authMethod of authMethods) {
      try {
        console.log(`🔄 Trying ${authMethod.name} for columns API...`)

        const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs/columns`, {
          method: "GET",
          headers: authMethod.headers,
        })

        console.log(`📡 ${authMethod.name} response status:`, response.status)

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ ${authMethod.name} succeeded for columns API!`)

          return NextResponse.json({
            success: true,
            data,
            method: authMethod.name,
            dataSource: "REAL_RINGBA_API",
          })
        } else {
          const errorText = await response.text()
          console.log(`❌ ${authMethod.name} failed for columns API:`, response.status, errorText)
          lastError = { method: authMethod.name, status: response.status, error: errorText }
        }
      } catch (error) {
        console.error(`💥 ${authMethod.name} error for columns API:`, error)
        lastError = {
          method: authMethod.name,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // If all methods failed, return mock data
    console.log("⚠️ All API methods failed for columns, returning mock data")
    return generateMockColumns(lastError)
  } catch (error) {
    console.error("💥 Unexpected error in columns API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch call log columns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateMockColumns(lastError: any) {
  // Generate realistic mock column data
  const mockColumns = [
    { name: "id", displayName: "Call ID", type: "string", isFilterable: true },
    { name: "callerId", displayName: "Caller ID", type: "string", isFilterable: true },
    { name: "calledNumber", displayName: "Called Number", type: "string", isFilterable: true },
    { name: "startTime", displayName: "Start Time", type: "datetime", isFilterable: true },
    { name: "endTime", displayName: "End Time", type: "datetime", isFilterable: true },
    { name: "duration", displayName: "Duration", type: "number", isFilterable: true },
    { name: "status", displayName: "Status", type: "string", isFilterable: true },
    { name: "disposition", displayName: "Disposition", type: "string", isFilterable: true },
    { name: "direction", displayName: "Direction", type: "string", isFilterable: true },
    { name: "recordingUrl", displayName: "Recording URL", type: "string", isFilterable: false },
    { name: "agentName", displayName: "Agent Name", type: "string", isFilterable: true },
    { name: "revenue", displayName: "Revenue", type: "number", isFilterable: true },
    { name: "cost", displayName: "Cost", type: "number", isFilterable: true },
    { name: "quality", displayName: "Quality", type: "string", isFilterable: true },
    { name: "tags", displayName: "Tags", type: "array", isFilterable: true },
  ]

  return NextResponse.json({
    success: true,
    data: mockColumns,
    method: "Mock Data",
    dataSource: "MOCK_DATA",
    apiError: lastError,
    note: "Real API calls failed, showing mock data for development. Check API credentials and endpoint availability.",
  })
}
