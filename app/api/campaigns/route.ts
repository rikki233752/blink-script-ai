import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET CAMPAIGNS API CALLED ===")

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

    // Transform campaigns for the frontend
    const transformedCampaigns = result.campaigns.map((campaign) => ({
      id: campaign.id,
      campaign_name: campaign.name,
      average_score: 4.2, // Mock average score
      total_calls: Math.floor(Math.random() * 1000) + 100,
      qc_approved: Math.floor(Math.random() * 50) + 10,
      qc_rejected: Math.floor(Math.random() * 20) + 5,
      completed_calls: Math.floor(Math.random() * 800) + 50,
      skipped_calls: Math.floor(Math.random() * 100) + 10,
      audio_duration: Math.floor(Math.random() * 10000) + 1000,
      created_at: campaign.createdAt.toISOString(),
      status: campaign.status,
      color: ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"][Math.floor(Math.random() * 4)],
    }))

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
    console.error("Error fetching campaigns:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== CREATE CAMPAIGN API CALLED ===")

    const body = await request.json()
    console.log("Campaign creation data:", body)

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: "Campaign name is required" }, { status: 400 })
    }

    // Initialize sample data first
    await campaignService.initializeSampleData()

    const campaignData = {
      name: body.name.trim(),
      description: body.description?.trim() || "",
      status: body.status || "draft",
      type: body.type || "lead-generation",
      targetCalls: body.targetCalls || 1000,
      budget: body.budget || 10000,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      createdBy: body.createdBy || "system",
      settings: {
        qualityThreshold: body.qualityThreshold || 4.0,
        autoApproval: body.autoApproval || false,
        recordingEnabled: body.recordingEnabled !== false,
        transcriptionEnabled: body.transcriptionEnabled !== false,
      },
    }

    const newCampaign = await campaignService.createCampaign(campaignData)
    console.log("Created campaign:", newCampaign.name)

    return NextResponse.json({
      success: true,
      data: {
        ...newCampaign,
        createdAt: newCampaign.createdAt.toISOString(),
        updatedAt: newCampaign.updatedAt.toISOString(),
        startDate: newCampaign.startDate.toISOString(),
        endDate: newCampaign.endDate?.toISOString(),
      },
      message: "Campaign created successfully",
    })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
