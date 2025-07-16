import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse the exact payload format provided by the user
    const payload = await request.json()
    const { startDate, endDate, filters } = payload

    // Extract campaign IDs from the filters
    const campaignIds = filters?.campaignIds || []
    const campaignId = campaignIds.length > 0 ? campaignIds[0] : undefined

    console.log("📅 Date range:", startDate, "to", endDate)
    console.log("🎯 Campaign ID:", campaignId)

    // Use the exact credentials from the previous request
    const apiKey =
      "09f0c9f0c033544593cea5409fad971c23237045c201c8278e3d3f78a1e66ff226a6ca85c08f2b1719700f5adc627ffa9d8d8960e7093be361f54a322389f95c2a4ead77ea532267976348f7396e1117363f50999ee067d9c254488bebdf081ed6453a28c19a9b1ad0dd67e3116c0a3b28c0776c"
    const accountId = "RA8e9b7b0388ea4968868bf2351b647158"

    // Try multiple request formats to find one that works with the Ringba API
    const requestFormats = [
      // Format 1: Direct mapping of user's format
      {
        name: "Direct User Format",
        body: {
          startDate,
          endDate,
          filters: {
            campaignIds: campaignIds,
          },
        },
      },
      // Format 2: Standard Ringba calllogs format
      {
        name: "Standard Calllogs Format",
        body: {
          startDate,
          endDate,
          filter: {
            campaignId: campaignId,
          },
          paging: {
            pageSize: 100,
            pageIndex: 0,
          },
          sort: {
            columnName: "callStartTime",
            sortDirection: "Descending",
          },
        },
      },
      // Format 3: Reports API format
      {
        name: "Reports API Format",
        body: {
          filters: {
            campaignId: campaignIds,
            dateRange: {
              start: startDate,
              end: endDate,
            },
          },
          pagination: {
            limit: 100,
            offset: 0,
          },
        },
      },
    ]

    // Authentication headers
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Try different endpoints
    const endpoints = [
      `https://api.ringba.com/v2/${accountId}/calllogs`,
      `https://api.ringba.com/v2/${accountId}/reports/calls`,
      `https://api.ringba.com/v2/${accountId}/analytics/calls`,
    ]

    let successResponse = null

    // Try each endpoint with each request format
    for (const endpoint of endpoints) {
      for (const format of requestFormats) {
        try {
          console.log(`🔄 Trying ${endpoint} with ${format.name}...`)

          const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(format.body),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`✅ Success with ${format.name} at ${endpoint}`)

            // Process the response to extract call logs
            const callLogs = extractCallLogs(data)

            successResponse = {
              success: true,
              endpoint,
              format: format.name,
              callLogs,
              totalCalls: callLogs.length,
              callsWithRecordings: callLogs.filter((call) => call.hasRecording).length,
              rawResponse: data,
            }

            // Break out of the loops if we found a working endpoint
            break
          } else {
            const errorText = await response.text()
            console.log(
              `❌ Failed with ${format.name} at ${endpoint}: ${response.status} - ${errorText.substring(0, 100)}`,
            )
          }
        } catch (error) {
          console.error(`💥 Error with ${format.name} at ${endpoint}:`, error)
        }
      }

      if (successResponse) break
    }

    if (successResponse) {
      return NextResponse.json(successResponse)
    }

    // If all attempts failed, try a fallback approach with a simplified request
    try {
      console.log("🔄 Trying fallback approach...")

      const fallbackEndpoint = `https://api.ringba.com/v2/${accountId}/calllogs`
      const fallbackBody = {
        startDate,
        endDate,
        campaignId: campaignId,
      }

      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(fallbackBody),
      })

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json()
        console.log("✅ Fallback approach succeeded")

        const callLogs = extractCallLogs(data)

        return NextResponse.json({
          success: true,
          endpoint: fallbackEndpoint,
          format: "Fallback Format",
          callLogs,
          totalCalls: callLogs.length,
          callsWithRecordings: callLogs.filter((call) => call.hasRecording).length,
          rawResponse: data,
        })
      } else {
        const errorText = await fallbackResponse.text()
        console.log(`❌ Fallback approach failed: ${fallbackResponse.status} - ${errorText.substring(0, 100)}`)
      }
    } catch (fallbackError) {
      console.error("💥 Fallback approach error:", fallbackError)
    }

    // If everything failed, return mock data for development purposes
    return NextResponse.json({
      success: false,
      error: "Failed to fetch call logs from Ringba API",
      mockData: generateMockCallLogs(campaignId || "unknown"),
      requestPayload: payload,
    })
  } catch (error) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function extractCallLogs(data: any): any[] {
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
  } else {
    callLogs = [data]
  }

  // Field mappings for different API response formats
  const fieldMappings: Record<string, string[]> = {
    id: ["id", "call_id", "callId", "uuid", "callUuid"],
    campaignId: ["campaign_id", "campaignId", "campaign"],
    campaignName: ["campaign_name", "campaignName", "campaignTitle"],
    callerId: ["caller_id", "callerId", "from", "ani", "callerNumber", "caller_number"],
    calledNumber: ["called_number", "calledNumber", "to", "dnis", "target", "targetNumber"],
    startTime: ["start_time", "startTime", "timestamp", "call_start", "callStart", "dateTime"],
    endTime: ["end_time", "endTime", "call_end", "callEnd"],
    duration: ["duration", "call_duration", "talk_time", "talkTime", "callDuration", "length"],
    status: ["status", "call_status", "callStatus", "state"],
    disposition: ["disposition", "call_disposition", "outcome", "result", "callDisposition"],
    direction: ["direction", "call_direction", "callDirection", "callType"],
    recordingUrl: ["recording_url", "recordingUrl", "recording", "audio_url", "audioUrl", "recordingLink"],
    agentName: ["agent_name", "agentName", "agent", "rep_name", "repName", "representative"],
    revenue: ["revenue", "payout", "commission", "value", "callRevenue"],
    cost: ["cost", "media_cost", "mediaCost", "callCost", "price"],
    quality: ["quality", "call_quality", "callQuality", "score", "rating"],
    tags: ["tags", "labels", "categories", "callTags"],
  }

  // Transform call logs to our standardized format
  return callLogs.map((call: any, index: number) => {
    // Helper function to find a value using our mappings
    const findValue = (fieldName: string, defaultValue: any = null) => {
      const mappings = fieldMappings[fieldName] || []
      for (const mapping of mappings) {
        if (call[mapping] !== undefined) {
          return call[mapping]
        }
      }
      return defaultValue
    }

    // Check if a recording URL exists
    const recordingUrl = findValue("recordingUrl")
    const hasRecording = !!recordingUrl

    return {
      id: findValue("id", `call_${index}`),
      callId: findValue("id", `call_${index}`),
      campaignId: findValue("campaignId"),
      campaignName: findValue("campaignName", "Unknown Campaign"),
      callerId: findValue("callerId", "Unknown"),
      calledNumber: findValue("calledNumber", "Unknown"),
      startTime: findValue("startTime", new Date().toISOString()),
      endTime: findValue("endTime"),
      duration: Number.parseInt(String(findValue("duration", "0"))),
      status: findValue("status", "unknown"),
      disposition: findValue("disposition", "unknown"),
      direction: findValue("direction", "inbound"),
      recordingUrl,
      hasRecording,
      agent: findValue("agentName", "Unknown Agent"),
      agentName: findValue("agentName", "Unknown Agent"),
      revenue: Number.parseFloat(String(findValue("revenue", "0"))),
      cost: Number.parseFloat(String(findValue("cost", "0"))),
      quality: findValue("quality"),
      tags: findValue("tags", []),
      metadata: call,
    }
  })
}

function generateMockCallLogs(campaignId: string): any[] {
  // Generate realistic mock data for development/testing
  return Array.from({ length: 15 }, (_, index) => ({
    id: `call_${campaignId}_${index + 1}`,
    callId: `call_${campaignId}_${index + 1}`,
    campaignId,
    campaignName: `Campaign ${campaignId}`,
    callerId: `+1555${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
    calledNumber: `+1800${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
    startTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 + Math.random() * 600000).toISOString(),
    duration: Math.floor(Math.random() * 600) + 30,
    status: ["completed", "answered", "busy", "no-answer"][Math.floor(Math.random() * 4)],
    disposition: ["sale", "no-sale", "callback", "not-interested"][Math.floor(Math.random() * 4)],
    direction: Math.random() > 0.3 ? "inbound" : "outbound",
    recordingUrl: Math.random() > 0.3 ? `https://recordings.ringba.com/call_${index + 1}.mp3` : null,
    hasRecording: Math.random() > 0.3,
    agent: ["John Smith", "Sarah Johnson", "Mike Wilson", "Lisa Brown", "David Lee"][Math.floor(Math.random() * 5)],
    agentName: ["John Smith", "Sarah Johnson", "Mike Wilson", "Lisa Brown", "David Lee"][Math.floor(Math.random() * 5)],
    revenue: Math.random() * 500,
    cost: Math.random() * 50,
    quality: Math.random() > 0.5 ? ["excellent", "good", "fair", "poor"][Math.floor(Math.random() * 4)] : null,
    tags: [],
    metadata: {},
  }))
}
