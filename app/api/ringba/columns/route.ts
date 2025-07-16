import { NextResponse } from "next/server"
import { RingBAApiClient } from "@/lib/ringba-api-client"

export async function GET() {
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

    const client = new RingBAApiClient({
      apiKey,
      accountId,
      baseUrl: "https://api.ringba.com/v2",
    })

    const result = await client.getAvailableColumns()

    return NextResponse.json({
      success: result.success,
      columns: result.columns,
      error: result.error,
      recommendedColumns: [
        "inboundCallId",
        "callDt",
        "campaignId",
        "campaignName",
        "inboundPhoneNumber",
        "callLengthInSeconds",
        "connectedCallLengthInSeconds",
        "hasConnected",
        "hasConverted",
        "recordingUrl",
        "hasRecording",
        "buyer",
        "targetName",
        "publisherName",
        "targetNumber",
        "payoutAmount",
        "conversionAmount",
        "timeToConnectInSeconds",
        "endCallSource",
        "noConversionReason",
        "blockReason",
      ],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch columns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
