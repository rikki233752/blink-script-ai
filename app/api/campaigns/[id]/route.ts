import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaign = await campaignService.getCampaign(params.id)

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // Get campaign metrics
    const dateRange = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }

    const metrics = await campaignService.getCampaignMetrics(params.id, dateRange)
    const calls = await campaignService.getCalls(params.id)
    const reviews = await campaignService.getQualityReviews(params.id)

    // Get recent calls with more details
    const recentCalls = calls
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10)
      .map((call) => ({
        id: call.id,
        agentId: call.agentId,
        phoneNumber: call.phoneNumber,
        duration: call.duration,
        status: call.status,
        disposition: call.disposition,
        qualityScore: call.qualityScore,
        sentiment: call.sentiment,
        startTime: call.startTime.toISOString(),
        endTime: call.endTime?.toISOString(),
        hasTranscription: !!call.transcription,
        hasRecording: !!call.recordingUrl,
      }))

    // Get recent reviews
    const recentReviews = reviews
      .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
      .slice(0, 10)
      .map((review) => ({
        id: review.id,
        callId: review.callId,
        reviewerId: review.reviewerId,
        status: review.status,
        score: review.score,
        feedback: review.feedback,
        criteria: review.criteria,
        reviewedAt: review.reviewedAt.toISOString(),
      }))

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          ...campaign,
          createdAt: campaign.createdAt.toISOString(),
          updatedAt: campaign.updatedAt.toISOString(),
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate?.toISOString(),
        },
        metrics: {
          totalCalls: metrics.totalCalls,
          completedCalls: metrics.completedCalls,
          avgCallDuration: Number(metrics.avgCallDuration.toFixed(1)),
          avgScore: Number(metrics.avgScore.toFixed(1)),
          qcApproved: metrics.qcApproved,
          qcRejected: metrics.qcRejected,
          qcPending: metrics.qcPending,
          conversions: metrics.conversions,
          conversionRate: Number(metrics.conversionRate.toFixed(1)),
          audioHours: Number(metrics.audioHours.toFixed(1)),
          skipped: metrics.skipped,
          revenue: Number((metrics.conversions * 150).toFixed(2)),
        },
        recentCalls,
        recentReviews,
        summary: {
          totalCalls: calls.length,
          totalReviews: reviews.length,
          avgScore: Number(metrics.avgScore.toFixed(1)),
          completionRate: Number(((metrics.completedCalls / metrics.totalCalls) * 100).toFixed(1)),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Validate data if provided
    if (body.targetCalls !== undefined && (typeof body.targetCalls !== "number" || body.targetCalls <= 0)) {
      return NextResponse.json({ success: false, error: "Target calls must be a positive number" }, { status: 400 })
    }

    if (body.budget !== undefined && (typeof body.budget !== "number" || body.budget <= 0)) {
      return NextResponse.json({ success: false, error: "Budget must be a positive number" }, { status: 400 })
    }

    if (body.status && !["active", "paused", "completed", "draft"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be one of: active, paused, completed, draft" },
        { status: 400 },
      )
    }

    const updatedCampaign = await campaignService.updateCampaign(params.id, {
      ...body,
      name: body.name?.trim(),
      description: body.description?.trim(),
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    })

    if (!updatedCampaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCampaign,
        createdAt: updatedCampaign.createdAt.toISOString(),
        updatedAt: updatedCampaign.updatedAt.toISOString(),
        startDate: updatedCampaign.startDate.toISOString(),
        endDate: updatedCampaign.endDate?.toISOString(),
      },
      message: "Campaign updated successfully",
    })
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

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
    console.error("Error in DELETE /api/campaigns/[id]:", error)
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
