import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET CAMPAIGNS LIST API CALLED ===")

    // Initialize sample data first
    await campaignService.initializeSampleData()

    const url = new URL(request.url)
    const searchParams = url.searchParams

    const filters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      sortBy: searchParams.get("sortBy") || "updatedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: Number.parseInt(searchParams.get("page") || "1"),
      limit: Number.parseInt(searchParams.get("limit") || "50"),
    }

    console.log("Applied filters:", filters)

    const result = await campaignService.getCampaigns(filters)

    // Transform campaigns for the frontend with consistent data structure
    const transformedCampaigns = result.campaigns.map((campaign) => {
      // Generate consistent mock data based on campaign ID
      const seed = campaign.id.split("_").pop() || "1"
      const seedNum = Number.parseInt(seed, 36) || 1

      return {
        id: campaign.id,
        campaign_name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        type: campaign.type,
        target_calls: campaign.targetCalls,
        budget: campaign.budget,
        average_score: Number((3.5 + (seedNum % 15) / 10).toFixed(1)), // 3.5-5.0 range
        total_calls: Math.floor(seedNum * 47) + 100, // Consistent based on seed
        qc_approved: Math.floor(seedNum * 12) + 10,
        qc_rejected: Math.floor(seedNum * 3) + 2,
        completed_calls: Math.floor(seedNum * 35) + 50,
        skipped_calls: Math.floor(seedNum * 8) + 5,
        audio_duration: Math.floor(seedNum * 234) + 1000, // in seconds
        created_at: campaign.createdAt.toISOString(),
        updated_at: campaign.updatedAt.toISOString(),
        start_date: campaign.startDate.toISOString(),
        end_date: campaign.endDate?.toISOString(),
        created_by: campaign.createdBy,
        settings: campaign.settings,
        color: ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"][seedNum % 4],
      }
    })

    console.log(`Returning ${transformedCampaigns.length} campaigns`)

    return NextResponse.json({
      success: true,
      data: {
        campaigns: transformedCampaigns,
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    })
  } catch (error) {
    console.error("Error fetching campaigns list:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaigns list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
