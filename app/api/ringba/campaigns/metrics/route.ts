import { NextRequest, NextResponse } from "next/server"

interface MetricsRequest {
  dateRange: {
    from: string
    to: string
  }
  campaignIds?: string[]
}

interface CampaignMetrics {
  campaignId: string
  campaignName: string
  totalCalls: number
  averageCallDuration: number
  cpa: number
  revenue: number
  skippedCalls: number
  completedCalls: number
  qcApproved: number
  qcRejected: number
  cost: number
  conversions: number
  connectedCalls: number
  totalDuration: number
}

interface MetricsSummary {
  totalCalls: number
  averageCallDuration: number
  cpa: number
  revenue: number
  skippedCalls: number
  completedCalls: number
  qcApproved: number
  qcRejected: number
  totalCost: number
  totalConversions: number
  conversionRate: number
  totalDuration: number
  campaignMetrics: CampaignMetrics[]
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Fetching RingBA campaign metrics...")

    // Add response caching headers
    const headers = {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", // Cache for 5 minutes
    }

    // Parse request body
    const body: MetricsRequest = await request.json()
    const { dateRange, campaignIds } = body

    // Add request validation
    if (!dateRange?.from || !dateRange?.to) {
      return NextResponse.json(
        { success: false, error: "Both startDate and endDate are required" },
        { status: 400, headers },
      )
    }

    // Validate date range (not more than 90 days)
    const daysDiff =
      Math.abs(new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 90) {
      return NextResponse.json({ success: false, error: "Date range cannot exceed 90 days" }, { status: 400, headers })
    }

    const startTime = Date.now()
    console.log(`🚀 Starting metrics fetch for ${daysDiff} days (${dateRange.from} to ${dateRange.to})`)

    console.log(`📅 Date range: ${dateRange.from} to ${dateRange.to}`)
    console.log(`🎯 Campaign IDs: ${campaignIds?.length || "all"} campaigns`)

    // Get environment variables
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json({ success: false, error: "RingBA API credentials not configured" }, { status: 500 })
    }

    const baseUrl = `https://api.ringba.com/${accountId}`
    const apiHeaders = {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Step 1: Get campaigns if not provided
    let campaigns = []
    if (!campaignIds || campaignIds.length === 0) {
      console.log("📊 Fetching all campaigns...")
      const campaignsResponse = await fetch(`${baseUrl}/campaigns`, {
        method: "GET",
        headers: apiHeaders,
      })

      if (!campaignsResponse.ok) {
        throw new Error(`Failed to fetch campaigns: ${campaignsResponse.status}`)
      }

      const campaignsData = await campaignsResponse.json()
      campaigns = Array.isArray(campaignsData) ? campaignsData : [campaignsData]
      console.log(`✅ Found ${campaigns.length} campaigns`)
    } else {
      // Use provided campaign IDs
      campaigns = campaignIds.map((id) => ({ id, name: `Campaign ${id}` }))
    }

    // Step 2: Fetch call logs for each campaign
    const campaignMetrics: CampaignMetrics[] = []
    let totalCalls = 0
    let totalDuration = 0
    let totalRevenue = 0
    let totalCost = 0
    let totalConversions = 0
    let totalSkipped = 0
    let totalCompleted = 0
    let totalQcApproved = 0
    let totalQcRejected = 0
    let totalConnectedCalls = 0

    for (const campaign of campaigns) {
      const campaignId = campaign.id || campaign.campaign_id
      console.log(`📞 Fetching metrics for campaign: ${campaignId}`)

      try {
        // Build call logs request
        const callLogsRequest = {
          reportStart: dateRange.from,
          reportEnd: dateRange.to,
          offset: 0,
          size: 1000, // Get more records for accurate metrics
          filters: [
            {
              anyConditionToMatch: [
                {
                  column: "campaignId",
                  value: campaignId,
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
            { column: "inboundPhoneNumber" },
            { column: "callLengthInSeconds" },
            { column: "connectedCallLengthInSeconds" },
            { column: "hasConnected" },
            { column: "hasConverted" },
            { column: "recordingUrl" },
            { column: "hasRecording" },
            { column: "buyer" },
            { column: "targetName" },
            { column: "publisherName" },
            { column: "payoutAmount" },
            { column: "conversionAmount" },
            { column: "cost" },
            { column: "revenue" },
            { column: "disposition" },
            { column: "callStatus" },
            { column: "endCallSource" },
          ],
        }

        const callLogsResponse = await fetch(`${baseUrl}/calllogs`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify(callLogsRequest),
        })

        if (!callLogsResponse.ok) {
          console.warn(`Failed to fetch call logs for campaign ${campaignId}: ${callLogsResponse.status}`)
          continue
        }

        const callLogsData = await callLogsResponse.json()
        console.log(`📡 Call logs response for ${campaignId}:`, callLogsData)

        // Extract call logs from response
        let callLogs = []
        if (callLogsData.isSuccessful && callLogsData.report) {
          if (Array.isArray(callLogsData.report.records)) {
            callLogs = callLogsData.report.records
          } else if (Array.isArray(callLogsData.report)) {
            callLogs = callLogsData.report
          }
        } else if (Array.isArray(callLogsData.records)) {
          callLogs = callLogsData.records
        } else if (Array.isArray(callLogsData)) {
          callLogs = callLogsData
        }

        console.log(`📊 Found ${callLogs.length} calls for campaign ${campaignId}`)

        // Calculate metrics for this campaign
        const campaignTotalCalls = callLogs.length
        const campaignConnectedCalls = callLogs.filter(
          (call) =>
            call.hasConnected === true ||
            call.hasConnected === "true" ||
            Number.parseInt(call.connectedCallLengthInSeconds || "0") > 0,
        ).length

        const campaignSkippedCalls = campaignTotalCalls - campaignConnectedCalls
        const campaignCompletedCalls = callLogs.filter(
          (call) =>
            call.hasConnected === true ||
            call.hasConnected === "true" ||
            Number.parseInt(call.callLengthInSeconds || "0") > 30, // Calls longer than 30 seconds
        ).length

        // Calculate conversions
        const campaignConversions = callLogs.filter(
          (call) =>
            call.hasConverted === true ||
            call.hasConverted === "true" ||
            call.disposition === "sale" ||
            call.disposition === "converted",
        ).length

        // Calculate QC metrics based on disposition or call quality
        const campaignQcApproved = callLogs.filter(
          (call) =>
            call.disposition === "sale" ||
            call.disposition === "approved" ||
            call.disposition === "qualified" ||
            call.callStatus === "approved",
        ).length

        const campaignQcRejected = callLogs.filter(
          (call) =>
            call.disposition === "rejected" ||
            call.disposition === "unqualified" ||
            call.disposition === "bad_lead" ||
            call.callStatus === "rejected",
        ).length

        // Calculate financial metrics
        const campaignRevenue = callLogs.reduce((sum, call) => {
          const revenue = Number.parseFloat(call.revenue || call.conversionAmount || call.payoutAmount || "0")
          return sum + revenue
        }, 0)

        const campaignCost = callLogs.reduce((sum, call) => {
          const cost = Number.parseFloat(call.cost || "0")
          return sum + cost
        }, 0)

        // Calculate duration metrics
        const campaignTotalDuration = callLogs.reduce((sum, call) => {
          const duration = Number.parseInt(call.callLengthInSeconds || "0")
          return sum + duration
        }, 0)

        const campaignAverageCallDuration = campaignTotalCalls > 0 ? campaignTotalDuration / campaignTotalCalls : 0

        // Calculate CPA (Cost Per Acquisition)
        const campaignCpa = campaignConversions > 0 ? campaignCost / campaignConversions : 0

        const metrics: CampaignMetrics = {
          campaignId,
          campaignName: campaign.name || campaign.campaign_name || `Campaign ${campaignId}`,
          totalCalls: campaignTotalCalls,
          averageCallDuration: campaignAverageCallDuration,
          cpa: campaignCpa,
          revenue: campaignRevenue,
          skippedCalls: campaignSkippedCalls,
          completedCalls: campaignCompletedCalls,
          qcApproved: campaignQcApproved,
          qcRejected: campaignQcRejected,
          cost: campaignCost,
          conversions: campaignConversions,
          connectedCalls: campaignConnectedCalls,
          totalDuration: campaignTotalDuration,
        }

        campaignMetrics.push(metrics)

        // Add to totals
        totalCalls += campaignTotalCalls
        totalDuration += campaignTotalDuration
        totalRevenue += campaignRevenue
        totalCost += campaignCost
        totalConversions += campaignConversions
        totalSkipped += campaignSkippedCalls
        totalCompleted += campaignCompletedCalls
        totalQcApproved += campaignQcApproved
        totalQcRejected += campaignQcRejected
        totalConnectedCalls += campaignConnectedCalls

        console.log(`✅ Campaign ${campaignId} metrics:`, {
          calls: campaignTotalCalls,
          revenue: campaignRevenue,
          conversions: campaignConversions,
          cpa: campaignCpa,
        })
      } catch (error) {
        console.error(`❌ Error fetching metrics for campaign ${campaignId}:`, error)
        // Continue with other campaigns
      }
    }

    // Calculate overall metrics
    const averageCallDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
    const overallCpa = totalConversions > 0 ? totalCost / totalConversions : 0
    const conversionRate = totalCalls > 0 ? (totalConversions / totalCalls) * 100 : 0

    const summary: MetricsSummary = {
      totalCalls,
      averageCallDuration,
      cpa: overallCpa,
      revenue: totalRevenue,
      skippedCalls: totalSkipped,
      completedCalls: totalCompleted,
      qcApproved: totalQcApproved,
      qcRejected: totalQcRejected,
      totalCost,
      totalConversions,
      conversionRate,
      totalDuration,
      campaignMetrics,
    }

    console.log("📈 Overall metrics summary:", {
      totalCalls,
      totalRevenue,
      totalConversions,
      conversionRate: `${conversionRate.toFixed(2)}%`,
      overallCpa,
    })

    const processingTime = Date.now() - startTime
    console.log(`✅ Metrics processing completed in ${processingTime}ms`)

    return NextResponse.json(
      {
        success: true,
        data: summary,
        dateRange,
        campaignsProcessed: campaignMetrics.length,
        processingTimeMs: processingTime,
        message: `Successfully processed metrics for ${campaignMetrics.length} campaigns in ${processingTime}ms`,
      },
      { headers },
    )
  } catch (error) {
    console.error("❌ Error fetching campaign metrics:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to fetch campaign metrics from RingBA API",
      },
      { status: 500 },
    )
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!from || !to) {
    return NextResponse.json({ success: false, error: "from and to date parameters are required" }, { status: 400 })
  }

  // Convert GET to POST request format
  const body = {
    dateRange: { from, to },
  }

  // Create a new request with POST method
  const postRequest = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(body),
  })

  return POST(postRequest)
}
