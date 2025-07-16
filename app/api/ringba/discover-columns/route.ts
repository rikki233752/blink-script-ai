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

    console.log(`🔍 Discovering available columns for account: ${accountId}`)

    // Try to get columns metadata endpoint
    const columnsEndpoint = `https://api.ringba.com/v2/${accountId}/calllogs/columns`

    console.log(`🌐 Trying columns endpoint: ${columnsEndpoint}`)

    const response = await fetch(columnsEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log(`📡 Columns endpoint response status: ${response.status}`)

    if (response.ok) {
      const columnsData = await response.json()
      console.log(`✅ Successfully fetched columns metadata`)

      return NextResponse.json({
        success: true,
        data: columnsData,
        endpoint: columnsEndpoint,
        method: "Columns Metadata API",
      })
    } else {
      const errorText = await response.text()
      console.log(`❌ Columns endpoint failed: ${response.status} - ${errorText}`)

      // If columns endpoint fails, try a minimal call logs request to see what fields are returned
      console.log(`🔄 Trying minimal call logs request to discover fields...`)

      const callLogsEndpoint = `https://api.ringba.com/v2/${accountId}/calllogs`
      const minimalRequest = {
        reportStart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        reportEnd: new Date().toISOString(),
        offset: 0,
        size: 1, // Just get 1 record
        valueColumns: [
          { column: "callDt" }, // This should always work
        ],
      }

      const callLogsResponse = await fetch(callLogsEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(minimalRequest),
      })

      console.log(`📡 Minimal call logs response status: ${callLogsResponse.status}`)

      if (callLogsResponse.ok) {
        const callLogsData = await callLogsResponse.json()
        console.log(`✅ Got sample call logs data`)

        // Extract available fields from the response
        let availableFields: string[] = []

        if (callLogsData.data && Array.isArray(callLogsData.data) && callLogsData.data.length > 0) {
          availableFields = Object.keys(callLogsData.data[0])
        } else if (callLogsData.results && Array.isArray(callLogsData.results) && callLogsData.results.length > 0) {
          availableFields = Object.keys(callLogsData.results[0])
        } else if (callLogsData.rows && Array.isArray(callLogsData.rows) && callLogsData.rows.length > 0) {
          availableFields = Object.keys(callLogsData.rows[0])
        } else if (Array.isArray(callLogsData) && callLogsData.length > 0) {
          availableFields = Object.keys(callLogsData[0])
        }

        return NextResponse.json({
          success: true,
          data: {
            availableFields,
            sampleData: callLogsData,
            discoveryMethod: "Sample call logs request",
          },
          endpoint: callLogsEndpoint,
          method: "Field Discovery via Sample Data",
        })
      } else {
        const callLogsErrorText = await callLogsResponse.text()
        console.log(`❌ Call logs request also failed: ${callLogsResponse.status} - ${callLogsErrorText}`)

        return NextResponse.json(
          {
            success: false,
            error: "Both columns endpoint and sample call logs failed",
            columnsError: errorText,
            callLogsError: callLogsErrorText,
            columnsEndpoint,
            callLogsEndpoint,
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("💥 Error discovering columns:", error)

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
