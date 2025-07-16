import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET CAMPAIGNS METRICS API CALLED ===")

    // Initialize sample data first
    await campaignService.initializeSampleData()

    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Parse date range
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    const dateRange = {
      from: fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
      to: toParam ? new Date(toParam) : new Date(), // Default to now
    }

    console.log("Date range:", dateRange)

    // Get all campaign metrics
    const allMetrics = await campaignService.getAllCampaignMetrics(dateRange)

    // Get individual campaign metrics
    const campaigns = await campaignService.getCampaigns()
    const campaignMetrics = await Promise.all(
      campaigns.campaigns.map(async (campaign) => {
        const metrics = await campaignService.getCampaignMetrics(campaign.id, dateRange)
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          ...metrics,
        }
      }),
    )

    console.log("Returning metrics for", campaigns.campaigns.length, "campaigns")

    return NextResponse.json({
      success: true,
      data: {
        overall: {
          totalAverageScore: Number(allMetrics.totalAverageScore.toFixed(1)),
          accountHours: Number(allMetrics.accountHours.toFixed(1)),
          totalCalls: allMetrics.totalCalls,
          avgCallDuration: Number(allMetrics.avgCallDuration.toFixed(1)),
          commissionable: allMetrics.commissionable,
          cpa: Number(allMetrics.cpa.toFixed(2)),
          revenue: Number(allMetrics.revenue.toFixed(2)),
          skipped: allMetrics.skipped,
          completed: allMetrics.completed,
          qcApproved: allMetrics.qcApproved,
          qcRejected: allMetrics.qcRejected,
        },
        campaigns: campaignMetrics.map((metrics) => ({
          campaignId: metrics.campaignId,
          campaignName: metrics.campaignName,
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
        })),
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching campaign metrics:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaign metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
