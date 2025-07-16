import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing RingBA API key or account ID",
          details: "Please configure RINGBA_API_KEY and RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    // Get request body
    const body = await request.json()
    const days = body.days || "30"
    const limit = body.limit || "100"
    const minDuration = body.minDuration || "10"
    const campaignId = body.campaignId
    const hasRecording = body.hasRecording

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(days))

    console.log(`🔍 Fetching Ringba calls for account ${accountId}`)
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`)

    const url = `https://api.ringba.com/v2/${accountId}/calllogs`
    console.log(`🌐 Trying endpoint: ${url}`)

    const requestBody = {
      limit: Number(limit),
      min_duration: Number(minDuration),
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    }

    if (campaignId && campaignId !== "all") {
      Object.assign(requestBody, { campaign_id: campaignId })
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Endpoint failed:`, response.status, errorText)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch calls. ${response.status}: ${errorText}`,
          },
          { status: 500 },
        )
      }

      const data = await response.json()

      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error("❌ Invalid data format received:", data)
        return NextResponse.json(
          {
            success: false,
            error: "Invalid data format received from Ringba API",
            details: data,
          },
          { status: 500 },
        )
      }

      const callsData = data.data

      console.log(`✅ Endpoint succeeded:`, {
        dataType: typeof data,
        hasData: !!data.data,
        dataLength: Array.isArray(data.data) ? data.data.length : "not array",
        keys: Object.keys(data),
      })

      console.log(`📞 Found ${callsData.length} calls`)

      // Transform the call data to a consistent format
      const transformedCalls = callsData.map((call: any) => {
        // Handle different field names from different endpoints
        const callId = call.id || call.call_id || call.callId || `unknown_${Date.now()}`
        const startTime = call.start_time || call.startTime || call.created_at || new Date().toISOString()
        const duration = call.duration || call.call_duration || 0
        const direction = call.direction || call.call_direction || "inbound"
        const callerNumber = call.caller_id || call.caller_number || call.from || "Unknown"
        const calledNumber = call.called_number || call.to || call.destination || "Unknown"
        const status = call.status || call.call_status || "completed"
        const disposition = call.disposition || call.call_disposition || "unknown"

        // Check for recording URL in various possible fields
        const recordingUrl = call.recording_url || call.recordingUrl || call.recording || call.media_url || null
        const hasRecording = !!recordingUrl

        // Get campaign information
        const campaignId = call.campaign_id || call.campaignId || "unknown"
        const campaignName = call.campaign_name || call.campaignName || `Campaign ${campaignId}`

        // Get agent information
        const agentId = call.agent_id || call.agentId || call.user_id || "unknown"
        const agent = call.agent || call.agent_name || call.user_name || `Agent ${agentId}`

        return {
          callId,
          campaignId,
          campaignName,
          agent,
          agentId,
          duration: Number(duration),
          recordingUrl,
          direction,
          callerNumber,
          calledNumber,
          startTime,
          endTime: call.end_time || call.endTime || null,
          status,
          disposition,
          hasRecording,
          publisherId: call.publisher_id || call.publisherId,
          targetId: call.target_id || call.targetId,
          trackingNumber: call.tracking_number || call.trackingNumber,
          revenue: call.revenue ? Number(call.revenue) : 0,
          cost: call.cost ? Number(call.cost) : 0,
          metadata: call,
        }
      })

      // Apply additional filters
      let filteredCalls = transformedCalls

      // Filter by recording availability if requested
      if (hasRecording === "true") {
        filteredCalls = filteredCalls.filter((call) => call.hasRecording)
      }

      // Sort by start time (newest first)
      filteredCalls.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

      console.log(`✅ Returning ${filteredCalls.length} processed calls`)
      console.log(`📊 Calls with recordings: ${filteredCalls.filter((c) => c.hasRecording).length}`)

      return NextResponse.json({
        success: true,
        data: filteredCalls,
        metadata: {
          total: filteredCalls.length,
          withRecordings: filteredCalls.filter((c) => c.hasRecording).length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          accountId,
        },
      })
    } catch (error) {
      console.error("❌ Network error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Network error while fetching calls from RingBA",
          details: String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Error fetching Ringba calls:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch calls from RingBA",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
