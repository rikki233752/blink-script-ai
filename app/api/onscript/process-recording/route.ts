import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🎯 Starting OnScript recording processing...")

    const body = await request.json()
    console.log("📝 Request body keys:", Object.keys(body))

    const {
      recordingUrl,
      audioDuration,
      affiliateName,
      clientPhone,
      aniOutbound,
      targetName,
      buyerName,
      hangupDirection,
      revenue,
      clientState,
      apiKey,
    } = body

    // Validate required fields
    if (!recordingUrl || !apiKey) {
      console.error("❌ Missing required fields:", { recordingUrl: !!recordingUrl, apiKey: !!apiKey })
      return NextResponse.json(
        {
          success: false,
          error: "Recording URL and API key are required",
          received: { recordingUrl: !!recordingUrl, apiKey: !!apiKey },
        },
        { status: 400 },
      )
    }

    console.log(`🔑 Processing with API key: ${apiKey.substring(0, 8)}...`)
    console.log(`🎵 Recording URL: ${recordingUrl}`)

    // Build the OnScript API URL with parameters
    const onscriptUrl = new URL("https://app.onscript.ai/api/create_process_dialog")

    // Add all parameters to the URL
    const params = {
      api_key: apiKey,
      url: recordingUrl,
      audio_duration: (audioDuration || 0).toString(),
      affiliate_name: affiliateName || "",
      client_phone: clientPhone || "",
      ani_outbound: aniOutbound || "",
      target_name: targetName || "",
      buyer_name: buyerName || "",
      hangup_direction: hangupDirection || "",
      revenue: (revenue || 0).toString(),
      client_state: clientState || "",
    }

    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        onscriptUrl.searchParams.set(key, value)
      }
    })

    console.log(`📡 OnScript API URL: ${onscriptUrl.toString()}`)

    // Call the OnScript API with proper headers and error handling
    const response = await fetch(onscriptUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "OnScript-Integration/1.0",
      },
      redirect: "follow",
      cache: "no-store",
    })

    console.log(`📡 OnScript API response status: ${response.status}`)
    console.log(`📡 OnScript API response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ OnScript API error: ${response.status} - ${errorText}`)

      return NextResponse.json(
        {
          success: false,
          error: `OnScript API error: ${response.status} ${response.statusText}`,
          details: errorText,
          apiUrl: onscriptUrl.toString(),
        },
        { status: response.status },
      )
    }

    // Try to parse JSON response
    let result
    try {
      const responseText = await response.text()
      console.log(`📄 OnScript raw response: ${responseText.substring(0, 500)}...`)

      result = JSON.parse(responseText)
      console.log("✅ OnScript API response parsed successfully")
    } catch (parseError) {
      console.error("❌ Failed to parse OnScript response as JSON:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON response from OnScript API",
          details: parseError instanceof Error ? parseError.message : "Parse error",
        },
        { status: 502 },
      )
    }

    console.log("✅ OnScript processing completed successfully")

    return NextResponse.json({
      success: true,
      data: {
        onscriptResponse: result,
        processedAt: new Date().toISOString(),
        apiKey: `${apiKey.substring(0, 8)}...`,
        recordingUrl,
        parameters: params,
      },
    })
  } catch (error) {
    console.error("❌ Critical error in OnScript process-recording:", error)
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : "No additional details",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
