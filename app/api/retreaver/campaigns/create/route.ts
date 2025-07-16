import { type NextRequest, NextResponse } from "next/server"
import { retreaverService } from "@/lib/retreaver-service"

export async function POST(request: NextRequest) {
  try {
    console.log("=== RETREAVER CREATE CAMPAIGN ROUTE ===")

    if (!process.env.RETREAVER_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Retreaver API key is not configured",
          error: "MISSING_API_KEY",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    console.log("Create campaign request body:", body)

    const campaign = await retreaverService.createCampaign(body)

    console.log("Successfully created campaign:", campaign)

    return NextResponse.json({
      success: true,
      campaign: campaign,
      message: "Campaign created successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== RETREAVER CREATE CAMPAIGN ERROR ===")
    console.error("Error details:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create campaign",
        error: "CREATE_CAMPAIGN_ERROR",
      },
      { status: 500 },
    )
  }
}
