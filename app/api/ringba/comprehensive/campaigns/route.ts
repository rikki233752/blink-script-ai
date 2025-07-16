import { NextResponse } from "next/server"
import { RingBAComprehensiveClient } from "@/lib/ringba-comprehensive-client"

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

    const client = new RingBAComprehensiveClient({
      apiKey,
      accountId,
      baseUrl: "https://api.ringba.com/v2",
    })

    const result = await client.getCampaigns()

    return NextResponse.json({
      step: "3 - Fetch Campaigns",
      success: result.success,
      campaigns: result.campaigns,
      error: result.error,
      total: result.campaigns?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        step: "3 - Fetch Campaigns",
        success: false,
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
