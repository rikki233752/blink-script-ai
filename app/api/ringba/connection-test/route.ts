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
          details: "Please set RINGBA_API_KEY and RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    const client = new RingBAApiClient({
      apiKey,
      accountId,
      baseUrl: "https://api.ringba.com/v2",
    })

    const result = await client.testConnection()

    return NextResponse.json({
      success: result.success,
      error: result.error,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
