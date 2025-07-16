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

    // Get call ID from query params
    const searchParams = request.nextUrl.searchParams
    const callId = searchParams.get("callId")

    if (!callId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing callId parameter",
        },
        { status: 400 },
      )
    }

    // Fetch recording URL for the specific call
    const response = await fetch(`https://api.ringba.com/v2/accounts/${accountId}/calls/${callId}/recording`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ringba API error:", response.status, errorText)

      return NextResponse.json(
        {
          success: false,
          error: `Ringba API error: ${response.status}`,
          details: errorText || "Failed to fetch recording URL",
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    const recordingUrl = data.recording_url || data.url

    if (!recordingUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "No recording URL found for this call",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      recordingUrl,
      callId,
    })
  } catch (error) {
    console.error("Error fetching Ringba recording URL:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recording URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
