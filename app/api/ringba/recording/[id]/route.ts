import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const callId = params.id
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json({ error: "Missing RingBA API key or account ID" }, { status: 400 })
    }

    if (!callId) {
      return NextResponse.json({ error: "Missing call ID" }, { status: 400 })
    }

    // Make request to RingBA API
    const response = await fetch(`https://api.ringba.com/v2/accounts/${accountId}/calls/${callId}/recording`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`RingBA API error for call ${callId}:`, errorText)
      return NextResponse.json(
        { error: `RingBA API error: ${response.status}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      recordingUrl: data.recording_url || data.url || null,
    })
  } catch (error) {
    console.error("Error fetching RingBA recording:", error)
    return NextResponse.json(
      { error: "Failed to fetch recording from RingBA", details: String(error) },
      { status: 500 },
    )
  }
}
