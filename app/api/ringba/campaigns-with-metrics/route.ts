import { type NextRequest, NextResponse } from "next/server"

interface CampaignMetrics {
  id: string
  campaignName: string
  status: string
  averageScore: number
  totalCalls: number
  qcApproved: number
  qcRejected: number
  completedCalls: number
  skippedCalls: number
  rejectedCalls: number
  audioDuration: number // in minutes
  commissionable: number
  cpa: number
  revenue: number
}

export async function GET(request: NextRequest) {
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

    console.log("🔍 Fetching RingBA campaigns with metrics...")

    // Step 1: Fetch campaigns
    const campaignsResponse = await fetch(`https://api.ringba.com/v2/${accountId}/campaigns`, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text()
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch campaigns: ${campaignsResponse.status}`,
          details: errorText,
        },
        { status: campaignsResponse.status },
      )
    }

    const campaignsData = await campaignsResponse.json()
    const campaigns = Array.isArray(campaignsData) ? campaignsData : [campaignsData]

    console.log(`📊 Found ${campaigns.length} campaigns, fetching call logs...`)

    // Step 2: Fetch call logs for each campaign
    const campaignMetrics: CampaignMetrics[] = []

    for (const campaign of campaigns) {
      try {
        const campaignId = campaign.id || campaign.campaignId
        const campaignName = campaign.name || campaign.campaignName || `Campaign ${campaignId}`

        // Fetch call logs for this campaign
        const callLogsRequestBody = {
          reportStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          reportEnd: new Date().toISOString(),
          offset: 0,
          size: 1000, // Get more records for better metrics
          filters: [
            {
              anyConditionToMatch: [
                {
                  column: "campaignId",
                  value: campaignId.toString(),
                  isNegativeMatch: false,
                  comparisonType: "EQUALS",
                },
              ],
            },
          ],
          valueColumns: [
            { column: "inboundCallId" },
            { column: "callDt" },
            { column: "campaignId" },
            { column: "campaignName" },
            { column: "callLengthInSeconds" },
            { column: "connectedCallLengthInSeconds" },
            { column: "hasConnected" },
            { column: "hasConverted" },
            { column: "hasRecording" },
            { column: "conversionAmount" },
            { column: "payoutAmount" },
            { column: "buyer" },
            { column: "targetName" },
            { column: "callStatus" },
            { column: "disposition" },
          ],
        }

        const callLogsResponse = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(callLogsRequestBody),
        })

        let callLogs: any[] = []
        if (callLogsResponse.ok) {
          const callLogsData = await callLogsResponse.json()

          // Handle different response structures
          if (callLogsData.isSuccessful && callLogsData.report?.records) {
            callLogs = callLogsData.report.records
          } else if (Array.isArray(callLogsData.records)) {
            callLogs = callLogsData.records
          } else if (Array.isArray(callLogsData)) {
            callLogs = callLogsData
          }
        }

        // Calculate metrics
        const totalCalls = callLogs.length
        const completedCalls = callLogs.filter(
          (call) => call.hasConnected === true || call.callStatus === "completed",
        ).length

        const skippedCalls = callLogs.filter(
          (call) => call.callStatus === "missed" || call.callStatus === "no-answer" || call.hasConnected === false,
        ).length

        const rejectedCalls = callLogs.filter(
          (call) => call.callStatus === "rejected" || call.disposition === "rejected",
        ).length

        // Calculate audio duration (total connected time in minutes)
        const audioDuration =
          callLogs.reduce((total, call) => {
            const duration = Number.parseInt(call.connectedCallLengthInSeconds || call.callLengthInSeconds || "0")
            return total + duration
          }, 0) / 60 // Convert to minutes

        // Calculate commissionable calls (converted calls)
        const commissionable = callLogs.filter(
          (call) => call.hasConverted === true || call.disposition === "sale",
        ).length

        // Calculate revenue and CPA
        const revenue = callLogs.reduce((total, call) => {
          const amount = Number.parseFloat(call.conversionAmount || call.payoutAmount || "0")
          return total + amount
        }, 0)

        const cpa = totalCalls > 0 ? revenue / totalCalls : 0

        // Generate mock quality scores (in real implementation, this would come from your QC system)
        const averageScore = Math.random() * 2 + 3 // Random score between 3-5
        const qcApproved = Math.floor(completedCalls * 0.7) // 70% approved
        const qcRejected = Math.floor(completedCalls * 0.2) // 20% rejected

        campaignMetrics.push({
          id: campaignId.toString(),
          campaignName,
          status: campaign.status || "active",
          averageScore: Math.round(averageScore * 10) / 10,
          totalCalls,
          qcApproved,
          qcRejected,
          completedCalls,
          skippedCalls,
          rejectedCalls,
          audioDuration: Math.round(audioDuration),
          commissionable,
          cpa: Math.round(cpa * 100) / 100,
          revenue: Math.round(revenue * 100) / 100,
        })

        console.log(`✅ Processed campaign: ${campaignName} (${totalCalls} calls)`)
      } catch (error) {
        console.error(`❌ Error processing campaign ${campaign.id}:`, error)
        // Continue with next campaign
      }
    }

    console.log(`🎯 Successfully processed ${campaignMetrics.length} campaigns`)

    return NextResponse.json({
      success: true,
      data: campaignMetrics,
      total: campaignMetrics.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Error in campaigns with metrics API:", error)
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
