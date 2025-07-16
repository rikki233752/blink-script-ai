import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaign_id")
    const createdAtStart = searchParams.get("created_at_start")
    const createdAtEnd = searchParams.get("created_at_end")
    const page = searchParams.get("page") || "1"

    console.log("🔄 Retreaver V2 Calls API Request:", {
      campaignId,
      createdAtStart,
      createdAtEnd,
      page,
    })

    // Validate required parameters
    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign ID is required",
        },
        { status: 400 },
      )
    }

    if (!createdAtStart || !createdAtEnd) {
      return NextResponse.json(
        {
          success: false,
          error: "Both created_at_start and created_at_end are required for V2 API",
          hint: "Use RFC3339 format: 2016-01-01T00:00:00+00:00",
        },
        { status: 400 },
      )
    }

    // Validate RFC3339 format
    const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
    if (!rfc3339Regex.test(createdAtStart) || !rfc3339Regex.test(createdAtEnd)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use RFC3339 format: 2016-01-01T00:00:00+00:00",
        },
        { status: 400 },
      )
    }

    const apiKey = process.env.RETREAVER_API_KEY
    const accountId = process.env.RETREAVER_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Retreaver API credentials not configured",
        },
        { status: 500 },
      )
    }

    // Build V2 API URL with exact format specified
    const apiUrl = new URL("https://api.retreaver.com/api/v2/calls.json")
    apiUrl.searchParams.set("api_key", apiKey)
    apiUrl.searchParams.set("company_id", accountId)
    apiUrl.searchParams.set("campaign_id", campaignId)
    apiUrl.searchParams.set("created_at_start", createdAtStart)
    apiUrl.searchParams.set("created_at_end", createdAtEnd)
    apiUrl.searchParams.set("page", page)

    console.log("📡 Retreaver V2 API URL:", apiUrl.toString())

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "OnScript-Retreaver-Integration/1.0",
      },
    })

    console.log("📡 Retreaver V2 API Response Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Retreaver V2 API Error:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: `Retreaver V2 API error: ${response.status} ${response.statusText}`,
          details: errorText,
          apiUrl: apiUrl.toString(),
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ Retreaver V2 API Response:", {
      totalCalls: data.calls?.length || 0,
      hasNextPage: data.has_next_page,
      currentPage: data.current_page,
    })

    // Transform the response to match our expected format
    const transformedCalls = (data.calls || []).map((call: any) => ({
      id: call.id,
      campaignId: campaignId,
      campaignName: call.campaign?.name || "Unknown Campaign",
      callId: call.id,
      agentName: call.agent?.name || "Unknown Agent",
      customerPhone: call.caller_id || call.phone_number || "Unknown",
      direction: call.direction || "inbound",
      duration: call.duration || 0,
      startTime: call.created_at || new Date().toISOString(),
      endTime: call.ended_at || new Date().toISOString(),
      status: call.status || "completed",
      disposition: call.disposition || "unknown",
      hasRecording: !!call.recording_url,
      recordingUrl: call.recording_url,
      hasTranscription: false,
      hasAnalysis: false,
      revenue: call.revenue || 0,
      cost: call.cost || 0,
      trackingNumber: call.tracking_number,
      metadata: {
        retreaver_id: call.id,
        campaign_id: call.campaign_id,
        agent_id: call.agent_id,
        caller_id: call.caller_id,
        tracking_number: call.tracking_number,
        tags: call.tags || [],
        custom_data: call.custom_data || {},
      },
    }))

    return NextResponse.json({
      success: true,
      data: transformedCalls,
      pagination: {
        currentPage: data.current_page || 1,
        hasNextPage: data.has_next_page || false,
        totalPages: data.total_pages || 1,
        totalCalls: data.total_calls || transformedCalls.length,
      },
      apiUrl: apiUrl.toString(),
      dateRange: {
        start: createdAtStart,
        end: createdAtEnd,
      },
    })
  } catch (error) {
    console.error("❌ Retreaver V2 Calls API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
