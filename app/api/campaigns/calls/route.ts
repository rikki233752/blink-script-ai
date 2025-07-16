import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get("campaignId")
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Initialize sample data if needed
    await campaignService.initializeSampleData()

    // Build filters
    const filters: any = {}

    if (agentId) filters.agentId = agentId
    if (status) filters.status = status
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    // Get calls
    const allCalls = await campaignService.getCalls(campaignId || undefined, filters)

    // Sort by start time (newest first)
    allCalls.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    // Paginate
    const total = allCalls.length
    const startIndex = (page - 1) * limit
    const paginatedCalls = allCalls.slice(startIndex, startIndex + limit)

    // Format calls for response
    const formattedCalls = paginatedCalls.map((call) => ({
      id: call.id,
      campaignId: call.campaignId,
      agentId: call.agentId,
      phoneNumber: call.phoneNumber,
      duration: call.duration,
      durationFormatted: `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, "0")}`,
      status: call.status,
      disposition: call.disposition,
      qualityScore: call.qualityScore,
      sentiment: call.sentiment,
      startTime: call.startTime.toISOString(),
      endTime: call.endTime?.toISOString(),
      hasTranscription: !!call.transcription,
      hasRecording: !!call.recordingUrl,
      metadata: call.metadata,
    }))

    // Calculate summary stats
    const completedCalls = allCalls.filter((c) => c.status === "completed")
    const avgDuration =
      completedCalls.length > 0
        ? completedCalls.reduce((sum, call) => sum + call.duration, 0) / completedCalls.length
        : 0

    const conversions = allCalls.filter((c) => c.disposition === "sale").length
    const conversionRate = allCalls.length > 0 ? (conversions / allCalls.length) * 100 : 0

    const qualityScores = allCalls.filter((c) => c.qualityScore).map((c) => c.qualityScore!)
    const avgQualityScore =
      qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0

    return NextResponse.json({
      success: true,
      data: {
        calls: formattedCalls,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalCalls: allCalls.length,
          completedCalls: completedCalls.length,
          avgDuration: Number(avgDuration.toFixed(1)),
          conversions,
          conversionRate: Number(conversionRate.toFixed(1)),
          avgQualityScore: Number(avgQualityScore.toFixed(1)),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching calls:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch calls",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["campaignId", "agentId", "phoneNumber", "duration", "status"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      )
    }

    // Validate campaign exists
    const campaign = await campaignService.getCampaign(body.campaignId)
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    const newCall = await campaignService.createCall({
      campaignId: body.campaignId,
      agentId: body.agentId,
      phoneNumber: body.phoneNumber,
      duration: Number(body.duration),
      status: body.status,
      disposition: body.disposition || "no-sale",
      qualityScore: body.qualityScore ? Number(body.qualityScore) : undefined,
      sentiment: body.sentiment,
      transcription: body.transcription,
      recordingUrl: body.recordingUrl,
      startTime: body.startTime ? new Date(body.startTime) : new Date(),
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      metadata: body.metadata || {},
    })

    return NextResponse.json({
      success: true,
      data: {
        ...newCall,
        startTime: newCall.startTime.toISOString(),
        endTime: newCall.endTime?.toISOString(),
      },
      message: "Call created successfully",
    })
  } catch (error) {
    console.error("Error creating call:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
