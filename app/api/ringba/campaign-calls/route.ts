import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API credentials not configured",
        },
        { status: 400 },
      )
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const campaignName = searchParams.get("campaignName")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = searchParams.get("limit") || "100"

    console.log("📞 Fetching call logs for specific campaign:", {
      campaignId,
      campaignName,
      timeRange: `${startDate} to ${endDate}`,
    })

    // Use the correct Ringba API endpoint for call details
    const endpoint = `https://api.ringba.com/v2/${accountId}/calllogs/detail`

    // Build the POST request body for campaign-specific call logs
    const requestBody: any = {
      limit: Number.parseInt(limit),
      campaign_filter: true, // Explicitly request campaign filtering
    }

    // Add campaign-specific filters
    if (campaignId) {
      requestBody.campaign_id = campaignId
      requestBody.filter_by_campaign = true
    }

    // Add date filters if provided
    if (startDate) {
      requestBody.start_date = startDate
    }
    if (endDate) {
      requestBody.end_date = endDate
    }

    // Add campaign filter if provided
    if (campaignId) {
      requestBody.campaign_id = campaignId
    }

    console.log("📤 POST request body:", requestBody)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "CallCenter-Transcription/1.0",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Ringba calllogs/detail API error:", response.status, errorText)

        return NextResponse.json(
          {
            success: false,
            error: `Ringba API error: ${response.status}`,
            details: errorText,
            endpoint,
            requestBody,
          },
          { status: response.status },
        )
      }

      const data = await response.json()
      console.log("📊 Ringba calllogs/detail response structure:", Object.keys(data))

      // Handle different response structures from calllogs/detail
      let calls = []
      if (Array.isArray(data)) {
        calls = data
      } else if (data.calls) {
        calls = data.calls
      } else if (data.data) {
        calls = Array.isArray(data.data) ? data.data : [data.data]
      } else if (data.results) {
        calls = data.results
      } else if (data.call_logs) {
        calls = data.call_logs
      } else if (data.records) {
        calls = data.records
      } else if (data.items) {
        calls = data.items
      } else if (data.response) {
        calls = Array.isArray(data.response) ? data.response : [data.response]
      }

      console.log(`📞 Found ${calls.length} calls from calllogs/detail endpoint`)

      // Filter calls by campaign name or custom tags if not already filtered by API
      let filteredCalls = calls

      if ((campaignName || campaignId) && !requestBody.campaign_id) {
        filteredCalls = calls.filter((call: any) => {
          // Check campaign ID match
          const callCampaignId = call.campaign_id || call.campaignId || call.campaign || call.Campaign
          const campaignIdMatch =
            campaignId &&
            (callCampaignId === campaignId ||
              callCampaignId === Number.parseInt(campaignId) ||
              String(callCampaignId) === campaignId)

          // Check campaign name match
          const callCampaignName = call.campaign_name || call.campaignName || call.campaign || call.Campaign
          const campaignNameMatch =
            campaignName && callCampaignName && callCampaignName.toLowerCase().includes(campaignName.toLowerCase())

          // Check custom tags
          const tags = call.tags || call.custom_tags || call.customTags || []
          const tagMatch =
            campaignName &&
            Array.isArray(tags) &&
            tags.some((tag: string) => tag.toLowerCase().includes(campaignName.toLowerCase()))

          return campaignIdMatch || campaignNameMatch || tagMatch
        })
      }

      console.log(`📞 Filtered to ${filteredCalls.length} calls for campaign ${campaignName || campaignId}`)

      // Transform calls to our format - save callId, agent, duration, recordingUrl as requested
      const transformedCalls = filteredCalls.map((call: any, index: number) => {
        // Extract core fields as requested by user
        const callId = call.id || call.call_id || call.callId || call.Id || call.uuid || ""
        const agent =
          call.agent ||
          call.agent_id ||
          call.agent_name ||
          call.user ||
          call.User ||
          call.rep ||
          call.representative ||
          call.publisher ||
          call.affiliate ||
          ""
        const duration = Number.parseInt(
          call.duration || call.call_duration || call.Duration || call.length || call.talk_time || "0",
        )
        const recordingUrl =
          call.recording_url ||
          call.recordingUrl ||
          call.recording ||
          call.Recording ||
          call.audio_url ||
          call.audioUrl ||
          null

        return {
          // Core fields as requested by user
          callId,
          agent,
          duration,
          recordingUrl,

          // Additional useful fields
          id: callId,
          campaignId: call.campaign_id || call.campaignId || campaignId,
          campaignName: call.campaign_name || call.campaignName || campaignName,
          direction: call.direction || call.Direction || call.type || "unknown",
          callerNumber:
            call.caller_id || call.from_number || call.caller || call.Caller || call.CallerNumber || call.ani || "",
          calledNumber:
            call.called_number ||
            call.to_number ||
            call.called ||
            call.Called ||
            call.CalledNumber ||
            call.dnis ||
            call.target_number ||
            "",
          startTime:
            call.start_time ||
            call.date_created ||
            call.timestamp ||
            call.StartTime ||
            call.CreatedDate ||
            call.call_start ||
            new Date().toISOString(),
          endTime: call.end_time || call.date_ended || call.EndTime || call.call_end || null,
          status: call.status || call.call_status || call.Status || call.disposition || "completed",
          disposition: call.disposition || call.call_disposition || call.Disposition || call.outcome || "unknown",
          hasRecording: !!recordingUrl,

          // Ringba specific fields
          publisherId: call.publisher_id || call.publisherId || call.affiliate_id,
          targetId: call.target_id || call.targetId,
          trackingNumber: call.tracking_number || call.trackingNumber || call.promo_number,
          revenue: call.revenue || call.payout || 0,
          cost: call.cost || call.price || 0,

          // Tags and custom data
          tags: call.tags || call.custom_tags || call.customTags || [],
          customData: call.custom_data || call.customData || call.custom_fields || {},

          // Metadata
          metadata: call,
        }
      })

      // Filter to only include valid calls (with required data)
      const validCalls = transformedCalls.filter((call) => {
        return call.callId && call.duration >= 0 && call.agent && call.recordingUrl // Must have ID, valid duration, agent and recording URL
      })

      if (validCalls.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No valid Ringba call data found after processing.",
            details:
              "The API returned data, but it did not contain the required fields (callId, duration, agent, recordingUrl) after transformation and validation.",
            endpoint,
            requestBody,
            rawDataStructure: data ? Object.keys(data) : [],
          },
          { status: 404 },
        )
      }

      console.log(`✅ Returning ${validCalls.length} valid calls (${transformedCalls.length} total)`)

      return NextResponse.json({
        success: true,
        data: validCalls,
        total: validCalls.length,
        campaignId,
        campaignName,
        callLogType: "CAMPAIGN_SPECIFIC",
        endpoint: "POST " + endpoint,
        dataSource: "REAL_RINGBA_API",
        timestamp: new Date().toISOString(),
      })
    } catch (fetchError) {
      console.error("💥 Error calling Ringba calllogs/detail:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch from Ringba calllogs/detail endpoint",
          details: fetchError instanceof Error ? fetchError.message : "Unknown fetch error",
          endpoint,
          requestBody,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("💥 Error fetching campaign calls:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaign calls",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
