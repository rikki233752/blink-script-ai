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
          details: "Please set RINGBA_API_KEY and RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    const { searchParams } = new URL(request.url)
    const callId = searchParams.get("callId")
    const startDate =
      searchParams.get("startDate") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]
    const limit = searchParams.get("limit") || "100"
    const offset = searchParams.get("offset") || "0"
    const campaignId = searchParams.get("campaignId")

    console.log("🌐 Fetching detailed call logs from Ringba API")
    console.log("📋 Parameters:", { callId, startDate, endDate, limit, offset, campaignId })

    // Authentication methods to try
    const authMethods = [
      {
        name: "Bearer Token",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "X-API-Key",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "API-Key Header",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    ]

    // Update the POST request configuration to match the new format
    const requestConfigs = [
      {
        name: "POST with Filters Array",
        method: "POST",
        url: `https://api.ringba.com/v2/${accountId}/calllogs/detail`,
        body: {
          filters: [
            ...(callId ? [{ column: "callId", operator: "Equals", value: callId }] : []),
            ...(campaignId ? [{ column: "campaignId", operator: "Equals", value: campaignId }] : []),
          ],
          startDate,
          endDate,
          pageSize: Number.parseInt(limit),
          pageNumber: Number.parseInt(offset) / Number.parseInt(limit) + 1,
        },
      },
      {
        name: "POST with JSON Body",
        method: "POST",
        url: `https://api.ringba.com/v2/${accountId}/calllogs/detail`,
        body: {
          ...(callId && { callId }),
          ...(campaignId && { campaignId }),
          startDate,
          endDate,
          limit: Number.parseInt(limit),
          offset: Number.parseInt(offset),
        },
      },
      {
        name: "GET with Query Params",
        method: "GET",
        url: `https://api.ringba.com/v2/${accountId}/calllogs/detail`,
        queryParams: {
          ...(callId && { callId }),
          ...(campaignId && { campaignId }),
          startDate,
          endDate,
          limit,
          offset,
        },
      },
    ]

    let lastError = null

    // Try each request config with each auth method
    for (const config of requestConfigs) {
      for (const authMethod of authMethods) {
        try {
          console.log(`🔄 Trying ${config.name} with ${authMethod.name}...`)

          let url = config.url
          const requestOptions: RequestInit = {
            method: config.method,
            headers: authMethod.headers,
          }

          if (config.method === "GET" && config.queryParams) {
            const queryString = new URLSearchParams(
              Object.entries(config.queryParams).reduce(
                (acc, [key, value]) => {
                  if (value !== undefined && value !== null) {
                    acc[key] = String(value)
                  }
                  return acc
                },
                {} as Record<string, string>,
              ),
            ).toString()
            url = `${url}?${queryString}`
          } else if (config.method === "POST" && config.body) {
            requestOptions.body = JSON.stringify(config.body)
          }

          console.log(`📡 Making request to: ${url}`)

          const response = await fetch(url, requestOptions)

          console.log(`📊 ${config.name} with ${authMethod.name} response status:`, response.status)

          if (response.ok) {
            const data = await response.json()
            console.log(`✅ ${config.name} with ${authMethod.name} succeeded!`)
            console.log(`📈 Response data keys:`, Object.keys(data))

            return processDetailedCallLogsResponse(data, `${config.name} - ${authMethod.name}`)
          } else {
            const errorText = await response.text()
            console.log(`❌ ${config.name} with ${authMethod.name} failed:`, response.status, errorText)
            lastError = {
              config: config.name,
              auth: authMethod.name,
              status: response.status,
              error: errorText,
              url,
            }
          }
        } catch (error) {
          console.error(`💥 ${config.name} with ${authMethod.name} error:`, error)
          lastError = {
            config: config.name,
            auth: authMethod.name,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }
    }

    // If all methods failed, return mock detailed data
    console.log("⚠️ All API methods failed, returning mock detailed call logs")
    return generateMockDetailedCallLogs(lastError)
  } catch (error) {
    console.error("💥 Unexpected error in detailed call logs API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch detailed call logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function processDetailedCallLogsResponse(data: any, method: string) {
  // Handle different response structures from Ringba
  let callLogs = []

  if (Array.isArray(data)) {
    callLogs = data
  } else if (data.callLogs) {
    callLogs = data.callLogs
  } else if (data.calls) {
    callLogs = data.calls
  } else if (data.data) {
    callLogs = Array.isArray(data.data) ? data.data : [data.data]
  } else if (data.results) {
    callLogs = data.results
  } else if (data.items) {
    callLogs = data.items
  } else if (data.details) {
    callLogs = Array.isArray(data.details) ? data.details : [data.details]
  } else {
    callLogs = [data]
  }

  console.log(`📈 Found ${callLogs.length} detailed call logs`)

  // Enhanced field mappings for detailed call logs
  const detailedFieldMappings: Record<string, string[]> = {
    // Basic call info
    id: ["id", "call_id", "callId", "uuid", "callUuid", "call_uuid"],
    campaignId: ["campaign_id", "campaignId", "campaign", "campaignUuid"],
    campaignName: ["campaign_name", "campaignName", "campaignTitle", "campaign_title"],

    // Phone numbers
    callerId: ["caller_id", "callerId", "from", "ani", "callerNumber", "caller_number", "source_number"],
    calledNumber: ["called_number", "calledNumber", "to", "dnis", "target", "targetNumber", "destination_number"],

    // Timing
    startTime: ["start_time", "startTime", "timestamp", "call_start", "callStart", "dateTime", "call_date"],
    endTime: ["end_time", "endTime", "call_end", "callEnd", "hangup_time"],
    duration: ["duration", "call_duration", "talk_time", "talkTime", "callDuration", "length", "total_duration"],
    ringTime: ["ring_time", "ringTime", "ring_duration", "ringDuration"],

    // Call status and outcome
    status: ["status", "call_status", "callStatus", "state", "call_state"],
    disposition: ["disposition", "call_disposition", "outcome", "result", "callDisposition", "hangup_cause"],
    direction: ["direction", "call_direction", "callDirection", "callType", "call_type"],

    // Recording info
    recordingUrl: [
      "recording_url",
      "recordingUrl",
      "recording",
      "audio_url",
      "audioUrl",
      "recordingLink",
      "recording_link",
    ],
    recordingDuration: ["recording_duration", "recordingDuration", "recorded_duration"],
    recordingSize: ["recording_size", "recordingSize", "file_size", "fileSize"],

    // Agent/Rep info
    agentName: ["agent_name", "agentName", "agent", "rep_name", "repName", "representative", "agent_display_name"],
    agentId: ["agent_id", "agentId", "rep_id", "repId", "agent_uuid"],

    // Financial
    revenue: ["revenue", "payout", "commission", "value", "callRevenue", "call_revenue", "total_payout"],
    cost: ["cost", "media_cost", "mediaCost", "callCost", "price", "call_cost", "total_cost"],
    profit: ["profit", "margin", "net_revenue", "netRevenue"],

    // Quality and scoring
    quality: ["quality", "call_quality", "callQuality", "score", "rating", "quality_score"],

    // Location and routing
    callerCity: ["caller_city", "callerCity", "source_city", "sourceCity"],
    callerState: ["caller_state", "callerState", "source_state", "sourceState"],
    callerCountry: ["caller_country", "callerCountry", "source_country", "sourceCountry"],
    targetCity: ["target_city", "targetCity", "destination_city", "destinationCity"],
    targetState: ["target_state", "targetState", "destination_state", "destinationState"],

    // Tracking and attribution
    trackingNumber: ["tracking_number", "trackingNumber", "tracking", "dnis"],
    sourceId: ["source_id", "sourceId", "source", "traffic_source", "trafficSource"],
    keywordId: ["keyword_id", "keywordId", "keyword", "search_term"],

    // Additional metadata
    tags: ["tags", "labels", "categories", "callTags", "call_tags"],
    customFields: ["custom_fields", "customFields", "custom_data", "customData"],
    notes: ["notes", "comments", "description", "call_notes"],

    // Technical details
    userAgent: ["user_agent", "userAgent", "browser", "device"],
    ipAddress: ["ip_address", "ipAddress", "ip", "caller_ip"],
    referrer: ["referrer", "referring_url", "referringUrl", "ref"],
  }

  // Transform detailed call logs to our enhanced format
  const transformedCallLogs = callLogs.map((call: any, index: number) => {
    // Helper function to find a value using our enhanced mappings
    const findValue = (fieldName: string, defaultValue: any = null) => {
      const mappings = detailedFieldMappings[fieldName] || []
      for (const mapping of mappings) {
        if (call[mapping] !== undefined && call[mapping] !== null) {
          return call[mapping]
        }
      }
      return defaultValue
    }

    // Check if a recording URL exists
    const recordingUrl = findValue("recordingUrl")
    const hasRecording = !!recordingUrl

    return {
      // Basic call information
      id: findValue("id", `detailed_call_${index}`),
      campaignId: findValue("campaignId", "unknown"),
      campaignName: findValue("campaignName", "Unknown Campaign"),

      // Phone numbers and routing
      callerId: findValue("callerId", "Unknown"),
      calledNumber: findValue("calledNumber", "Unknown"),
      trackingNumber: findValue("trackingNumber"),

      // Timing information
      startTime: findValue("startTime", new Date().toISOString()),
      endTime: findValue("endTime"),
      duration: Number.parseInt(String(findValue("duration", "0"))),
      ringTime: Number.parseInt(String(findValue("ringTime", "0"))),

      // Call status and outcome
      status: findValue("status", "unknown"),
      disposition: findValue("disposition", "unknown"),
      direction: findValue("direction", "inbound"),

      // Recording information
      recordingUrl,
      hasRecording,
      recordingDuration: Number.parseInt(String(findValue("recordingDuration", "0"))),
      recordingSize: Number.parseInt(String(findValue("recordingSize", "0"))),

      // Agent information
      agentName: findValue("agentName", "Unknown Agent"),
      agentId: findValue("agentId"),

      // Financial data
      revenue: Number.parseFloat(String(findValue("revenue", "0"))),
      cost: Number.parseFloat(String(findValue("cost", "0"))),
      profit: Number.parseFloat(String(findValue("profit", "0"))),

      // Quality metrics
      quality: findValue("quality"),

      // Location data
      callerLocation: {
        city: findValue("callerCity"),
        state: findValue("callerState"),
        country: findValue("callerCountry"),
      },
      targetLocation: {
        city: findValue("targetCity"),
        state: findValue("targetState"),
      },

      // Tracking and attribution
      sourceId: findValue("sourceId"),
      keywordId: findValue("keywordId"),

      // Additional metadata
      tags: findValue("tags", []),
      customFields: findValue("customFields", {}),
      notes: findValue("notes"),

      // Technical details
      userAgent: findValue("userAgent"),
      ipAddress: findValue("ipAddress"),
      referrer: findValue("referrer"),

      // Transcription fields
      isTranscribed: false,
      transcriptionStatus: "pending",
      transcript: null,
      analysis: null,
      aiInsights: null,

      // Raw data for debugging
      metadata: call,
    }
  })

  return NextResponse.json({
    success: true,
    data: transformedCallLogs,
    total: transformedCallLogs.length,
    method,
    dataSource: "REAL_RINGBA_DETAIL_API",
    endpoint: "calllogs/detail",
  })
}

function generateMockDetailedCallLogs(lastError: any) {
  // Generate realistic mock detailed call logs for development/testing
  const mockDetailedCallLogs = Array.from({ length: 10 }, (_, index) => ({
    id: `detailed_call_${index + 1}`,
    campaignId: `campaign_${Math.floor(Math.random() * 5) + 1}`,
    campaignName: `Campaign ${Math.floor(Math.random() * 5) + 1}`,

    callerId: `+1555${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
    calledNumber: `+1800${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
    trackingNumber: `+1800${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,

    startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + Math.random() * 600000).toISOString(),
    duration: Math.floor(Math.random() * 600) + 30,
    ringTime: Math.floor(Math.random() * 30) + 5,

    status: ["completed", "answered", "busy", "no-answer", "failed"][Math.floor(Math.random() * 5)],
    disposition: ["sale", "no-sale", "callback", "not-interested", "qualified"][Math.floor(Math.random() * 5)],
    direction: Math.random() > 0.3 ? "inbound" : "outbound",

    recordingUrl: Math.random() > 0.3 ? `https://recordings.ringba.com/detailed_call_${index + 1}.mp3` : null,
    hasRecording: Math.random() > 0.3,
    recordingDuration: Math.floor(Math.random() * 600) + 30,
    recordingSize: Math.floor(Math.random() * 10000000) + 1000000, // 1-10MB

    agentName: ["John Smith", "Sarah Johnson", "Mike Wilson", "Lisa Brown", "David Lee"][Math.floor(Math.random() * 5)],
    agentId: `agent_${Math.floor(Math.random() * 10) + 1}`,

    revenue: Math.random() * 500,
    cost: Math.random() * 50,
    profit: Math.random() * 450,

    quality: Math.random() > 0.5 ? ["excellent", "good", "fair", "poor"][Math.floor(Math.random() * 4)] : null,

    callerLocation: {
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
      state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
      country: "US",
    },
    targetLocation: {
      city: ["Miami", "Seattle", "Denver", "Atlanta", "Boston"][Math.floor(Math.random() * 5)],
      state: ["FL", "WA", "CO", "GA", "MA"][Math.floor(Math.random() * 5)],
    },

    sourceId: `source_${Math.floor(Math.random() * 20) + 1}`,
    keywordId: `keyword_${Math.floor(Math.random() * 50) + 1}`,

    tags: [`tag_${Math.floor(Math.random() * 10) + 1}`],
    customFields: {
      leadScore: Math.floor(Math.random() * 100),
      priority: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
    },
    notes: `Sample call notes for call ${index + 1}`,

    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    referrer: "https://example.com/landing-page",

    isTranscribed: Math.random() > 0.7,
    transcriptionStatus: Math.random() > 0.7 ? "completed" : "pending",
    transcript: null,
    analysis: null,
    aiInsights: null,

    metadata: {},
  }))

  return NextResponse.json({
    success: true,
    data: mockDetailedCallLogs,
    total: mockDetailedCallLogs.length,
    method: "Mock Detailed Data (API Failed)",
    dataSource: "MOCK_DETAILED_DATA",
    endpoint: "calllogs/detail",
    apiError: lastError,
    note: "Real detailed API calls failed, showing mock detailed data for development. Check API credentials and endpoint availability.",
  })
}
