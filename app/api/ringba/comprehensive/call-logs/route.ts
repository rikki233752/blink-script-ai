import { type NextRequest, NextResponse } from "next/server"
import { RingBAComprehensiveClient } from "@/lib/ringba-comprehensive-client"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "RingBA API credentials not configured",
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { campaignId, reportStart, reportEnd, offset, size } = body

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign ID is required",
        },
        { status: 400 },
      )
    }

    const client = new RingBAComprehensiveClient({
      apiKey,
      accountId,
      baseUrl: "https://api.ringba.com/v2",
    })

    // First get available columns
    await client.getAvailableColumns()

    // Then fetch call logs
    const result = await client.getCallLogs(campaignId, {
      reportStart,
      reportEnd,
      offset,
      size,
    })

    return NextResponse.json({
      step: "4-6 - Fetch & Transform Call Logs",
      success: result.success,
      callLogs: result.callLogs,
      error: result.error,
      totalRecords: result.totalRecords,
      campaignId,
      validColumns: client.getValidColumns(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        step: "4-6 - Fetch & Transform Call Logs",
        success: false,
        error: "Failed to fetch call logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
