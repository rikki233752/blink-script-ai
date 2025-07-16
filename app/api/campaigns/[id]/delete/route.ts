import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== DELETE CAMPAIGN API CALLED ===")
    console.log("Campaign ID:", params.id)

    const campaignId = params.id

    if (!campaignId) {
      console.error("No campaign ID provided")
      return NextResponse.json({ success: false, error: "Campaign ID is required" }, { status: 400 })
    }

    // Initialize sample data first to ensure we have data to work with
    await campaignService.initializeSampleData()

    // Check if campaign exists first
    const existingCampaign = await campaignService.getCampaign(campaignId)
    if (!existingCampaign) {
      console.error("Campaign not found:", campaignId)
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    console.log("Found campaign to delete:", existingCampaign.name)

    // Get related data for logging
    const relatedCalls = await campaignService.getCalls(campaignId)
    const relatedReviews = await campaignService.getQualityReviews(campaignId)

    console.log(`Campaign has ${relatedCalls.length} calls and ${relatedReviews.length} reviews`)

    // Delete campaign and all related data
    const deleted = await campaignService.deleteCampaignWithRelatedData(campaignId)

    if (!deleted) {
      console.error("Failed to delete campaign:", campaignId)
      return NextResponse.json({ success: false, error: "Failed to delete campaign" }, { status: 500 })
    }

    console.log("Campaign deleted successfully:", campaignId)

    // Refresh campaign data to ensure consistency
    await campaignService.refreshCampaignData()

    return NextResponse.json({
      success: true,
      message: `Campaign "${existingCampaign.name}" and all related data deleted successfully`,
      deletedData: {
        campaignName: existingCampaign.name,
        callsDeleted: relatedCalls.length,
        reviewsDeleted: relatedReviews.length,
      },
    })
  } catch (error) {
    console.error("Error in DELETE /api/campaigns/[id]/delete:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while deleting campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
