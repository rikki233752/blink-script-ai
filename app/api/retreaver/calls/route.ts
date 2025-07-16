import { type NextRequest, NextResponse } from "next/server"

interface RetreaverCallLog {
  id: string
  campaign_id: string
  caller_id: string
  destination_number: string
  start_time: string
  end_time?: string
  duration: number
  status: string
  recording_url?: string
  tags?: string[]
  custom_data?: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== RETREAVER V2 CALLS API ENDPOINT ===")

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaign_id")
    const createdAtStart = searchParams.get("created_at_start")
    const createdAtEnd = searchParams.get("created_at_end")
    const page = searchParams.get("page") || "1"

    console.log("Request parameters:", {
      campaignId,
      createdAtStart,
      createdAtEnd,
      page,
    })

    // Validate required environment variables
    const apiKey = process.env.RETREAVER_API_KEY
    const companyId = process.env.RETREAVER_ACCOUNT_ID || "170308"

    console.log("Environment check:", {
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      companyId,
    })

    if (!apiKey) {
      console.error("RETREAVER_API_KEY is not configured")
      return NextResponse.json(
        {
          success: false,
          message: "Retreaver API key is not configured. Please set RETREAVER_API_KEY environment variable.",
          calls: [],
        },
        { status: 500 },
      )
    }

    // Build V2 API URL with proper parameters
    const baseUrl = "https://api.retreaver.com"
    const endpoint = "/api/v2/calls.json"
    const params = new URLSearchParams()

    // Required parameters
    params.append("api_key", apiKey)
    params.append("company_id", companyId)
    params.append("page", page)
    params.append("per_page", "50") // Increase per page limit

    // Add campaign filter if specified
    if (campaignId && campaignId !== "all") {
      params.append("campaign_id", campaignId)
      console.log("Adding campaign filter:", campaignId)
    }

    // Add date range filters if provided (RFC3339 format)
    if (createdAtStart) {
      params.append("created_at_start", createdAtStart)
      console.log("Start date filter (RFC3339):", createdAtStart)
    }

    if (createdAtEnd) {
      params.append("created_at_end", createdAtEnd)
      console.log("End date filter (RFC3339):", createdAtEnd)
    }

    const fullUrl = `${baseUrl}${endpoint}?${params.toString()}`
    console.log("V2 API Request URL:", fullUrl)

    // Make request to Retreaver V2 API
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "OnScript-Retreaver-V2-Integration/1.0",
      },
    })

    console.log(`V2 API Response Status: ${response.status} ${response.statusText}`)
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("V2 API Error Response:", errorText)

      let errorMessage = `Retreaver V2 API error: ${response.status} - ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.message || errorJson.error) {
          errorMessage = errorJson.message || errorJson.error
        }
      } catch (e) {
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          calls: [],
          debug: {
            status: response.status,
            statusText: response.statusText,
            url: fullUrl,
            headers: Object.fromEntries(response.headers.entries()),
            errorBody: errorText,
          },
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("V2 API Response Data Type:", typeof data)
    console.log("V2 API Response Keys:", data && typeof data === "object" ? Object.keys(data) : "Not an object")

    // Log first few characters of response for debugging
    const responsePreview = JSON.stringify(data).substring(0, 1000)
    console.log("V2 API Response Preview:", responsePreview)

    // Handle V2 API response structure - Retreaver typically returns direct array or nested structure
    let calls: any[] = []

    if (Array.isArray(data)) {
      calls = data
      console.log("Response is direct array with", data.length, "items")
    } else if (data && typeof data === "object") {
      // Try different possible response structures
      if (data.calls && Array.isArray(data.calls)) {
        calls = data.calls
        console.log("Found calls in response.calls:", data.calls.length)
      } else if (data.data && Array.isArray(data.data)) {
        calls = data.data
        console.log("Found calls in response.data:", data.data.length)
      } else if (data.results && Array.isArray(data.results)) {
        calls = data.results
        console.log("Found calls in response.results:", data.results.length)
      } else if (data.items && Array.isArray(data.items)) {
        calls = data.items
        console.log("Found calls in response.items:", data.items.length)
      } else {
        console.log("Searching for arrays in response structure...")
        // Try to find any array in the response
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            calls = data[key]
            console.log(`Found calls array in response.${key}:`, data[key].length)
            break
          }
        }
      }
    }

    console.log(`Found ${calls.length} calls from V2 API`)

    // If no calls found, log the full response for debugging
    if (calls.length === 0) {
      console.log("No calls found. Full response structure:")
      console.log(JSON.stringify(data, null, 2))
    } else {
      // Log sample call structure for debugging
      console.log("Sample call structure from V2 API:")
      console.log(JSON.stringify(calls[0], null, 2))
    }

    // Transform V2 API response to our format with comprehensive field mapping
    const transformedCalls: RetreaverCallLog[] = calls.map((call: any, index: number) => {
      console.log(`Transforming call ${index} with keys:`, Object.keys(call))

      // Extract all possible field variations from Retreaver API
      const transformedCall = {
        id: call.id || call.call_id || call.uuid || call.cid || call.call_uuid || String(Date.now() + index),

        campaign_id: call.campaign_id || call.campaign?.id || call.cid || call.campaign_cid || campaignId || "",

        caller_id:
          call.caller_id ||
          call.from_number ||
          call.caller ||
          call.ani ||
          call.source ||
          call.from ||
          call.caller_number ||
          call.calling_number ||
          "",

        destination_number:
          call.destination_number ||
          call.to_number ||
          call.destination ||
          call.dnis ||
          call.target ||
          call.to ||
          call.destination_phone ||
          call.called_number ||
          "",

        start_time:
          call.start_time ||
          call.created_at ||
          call.timestamp ||
          call.call_start ||
          call.started_at ||
          call.start_timestamp ||
          call.created ||
          call.call_created_at ||
          "",

        end_time:
          call.end_time ||
          call.ended_at ||
          call.end_timestamp ||
          call.call_end ||
          call.finished_at ||
          call.completed_at ||
          call.call_ended_at ||
          "",

        duration: Number(
          call.duration ||
            call.call_duration ||
            call.length ||
            call.talk_time ||
            call.call_length ||
            call.total_duration ||
            call.billable_duration ||
            0,
        ),

        status:
          call.status ||
          call.call_status ||
          call.disposition ||
          call.state ||
          call.call_disposition ||
          call.result ||
          call.outcome ||
          "unknown",

        recording_url:
          call.recording_url ||
          call.recording ||
          call.audio_url ||
          call.recording_file ||
          call.audio ||
          call.recording_path ||
          call.audio_file ||
          call.call_recording ||
          call.recording_link ||
          "",

        tags: call.tags || call.call_tags || call.labels || call.keywords || call.tag_list || [],

        custom_data:
          call.custom_data ||
          call.metadata ||
          call.custom_fields ||
          call.extra_data ||
          call.attributes ||
          call.properties ||
          {},
      }

      // Log the transformation for debugging
      console.log(`Call ${index} transformation result:`, {
        original_keys: Object.keys(call),
        transformed: {
          id: transformedCall.id,
          campaign_id: transformedCall.campaign_id,
          caller_id: transformedCall.caller_id,
          destination_number: transformedCall.destination_number,
          start_time: transformedCall.start_time,
          duration: transformedCall.duration,
          status: transformedCall.status,
          has_recording: !!transformedCall.recording_url,
          recording_url: transformedCall.recording_url,
        },
      })

      return transformedCall
    })

    console.log(`Successfully transformed ${transformedCalls.length} calls`)

    // Log summary of transformed calls
    const callsWithRecordings = transformedCalls.filter((call) => call.recording_url)
    const callsWithValidCallerID = transformedCalls.filter(
      (call) => call.caller_id && call.caller_id !== "" && call.caller_id !== "Unknown",
    )
    const callsWithValidDestination = transformedCalls.filter(
      (call) => call.destination_number && call.destination_number !== "" && call.destination_number !== "Unknown",
    )

    console.log("Transformation summary:", {
      total_calls: transformedCalls.length,
      calls_with_recordings: callsWithRecordings.length,
      calls_with_valid_caller_id: callsWithValidCallerID.length,
      calls_with_valid_destination: callsWithValidDestination.length,
      sample_recording_urls: callsWithRecordings.slice(0, 3).map((call) => call.recording_url),
    })

    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${transformedCalls.length} calls from V2 API`,
      calls: transformedCalls,
      page: Number.parseInt(page),
      campaign_id: campaignId,
      date_range: {
        start: createdAtStart,
        end: createdAtEnd,
      },
      debug: {
        total_calls_found: calls.length,
        calls_with_recordings: callsWithRecordings.length,
        calls_with_valid_data: callsWithValidCallerID.length,
        response_structure: data && typeof data === "object" ? Object.keys(data) : "Not an object",
        api_url: fullUrl,
        sample_call_keys: calls.length > 0 ? Object.keys(calls[0]) : [],
        curl_equivalent: `curl "${fullUrl}"`,
      },
    })
  } catch (error) {
    console.error("=== ERROR IN RETREAVER V2 CALLS API ===")
    console.error("Error details:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch calls from V2 API",
        calls: [],
        error: {
          name: error instanceof Error ? error.name : "Unknown Error",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 },
    )
  }
}
