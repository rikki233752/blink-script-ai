import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function POST(request: NextRequest) {
  try {
    console.log("=== EXPORT CAMPAIGNS API CALLED ===")

    const body = await request.json()
    const { campaignIds, format, dateRange, includeMetrics } = body

    console.log("Export request:", { campaignIds, format, dateRange, includeMetrics })

    // Initialize sample data first
    await campaignService.initializeSampleData()

    // Validate format
    if (!format || !["csv", "json", "xlsx"].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Invalid export format. Must be csv, json, or xlsx" },
        { status: 400 },
      )
    }

    // Get campaigns to export
    let campaignsToExport
    if (campaignIds && campaignIds.length > 0) {
      // Export specific campaigns
      campaignsToExport = await Promise.all(
        campaignIds.map(async (id: string) => {
          const campaign = await campaignService.getCampaign(id)
          return campaign
        }),
      )
      campaignsToExport = campaignsToExport.filter(Boolean) // Remove null values
    } else {
      // Export all campaigns
      const result = await campaignService.getCampaigns()
      campaignsToExport = result.campaigns
    }

    if (campaignsToExport.length === 0) {
      return NextResponse.json({ success: false, error: "No campaigns found to export" }, { status: 404 })
    }

    // Parse date range if provided
    const parsedDateRange = dateRange
      ? {
          from: new Date(dateRange.from),
          to: new Date(dateRange.to),
        }
      : {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
          to: new Date(), // Default to now
        }

    // Prepare export data
    const exportData = await Promise.all(
      campaignsToExport.map(async (campaign) => {
        const baseData = {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          type: campaign.type,
          targetCalls: campaign.targetCalls,
          budget: campaign.budget,
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate?.toISOString(),
          createdAt: campaign.createdAt.toISOString(),
          updatedAt: campaign.updatedAt.toISOString(),
          createdBy: campaign.createdBy,
        }

        if (includeMetrics) {
          const metrics = await campaignService.getCampaignMetrics(campaign.id, parsedDateRange)
          return {
            ...baseData,
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
          }
        }

        return baseData
      }),
    )

    // Generate export based on format
    let exportContent: string
    let contentType: string
    let filename: string

    switch (format) {
      case "csv":
        // Convert to CSV
        if (exportData.length === 0) {
          exportContent = ""
        } else {
          const headers = Object.keys(exportData[0]).join(",")
          const rows = exportData.map((row) =>
            Object.values(row)
              .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
              .join(","),
          )
          exportContent = [headers, ...rows].join("\n")
        }
        contentType = "text/csv"
        filename = `campaigns_export_${new Date().toISOString().split("T")[0]}.csv`
        break

      case "json":
        exportContent = JSON.stringify(exportData, null, 2)
        contentType = "application/json"
        filename = `campaigns_export_${new Date().toISOString().split("T")[0]}.json`
        break

      case "xlsx":
        // For XLSX, we'll return JSON and let the frontend handle Excel generation
        exportContent = JSON.stringify(exportData, null, 2)
        contentType = "application/json"
        filename = `campaigns_export_${new Date().toISOString().split("T")[0]}.xlsx`
        break

      default:
        return NextResponse.json({ success: false, error: "Unsupported export format" }, { status: 400 })
    }

    console.log(`Exported ${exportData.length} campaigns in ${format} format`)

    // Return the export data
    return new NextResponse(exportContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": exportData.length.toString(),
        "X-Export-Format": format,
      },
    })
  } catch (error) {
    console.error("Error exporting campaigns:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
