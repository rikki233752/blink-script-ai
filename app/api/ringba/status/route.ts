import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json({ error: "Missing RingBA API key or account ID" }, { status: 400 })
    }

    // Make request to RingBA API to check connection
    const response = await fetch(`https://api.ringba.com/v2/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("RingBA API connection error:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: `RingBA API error: ${response.status}`,
          details: errorText,
        },
        { status: 200 }, // Return 200 even for API errors to handle in UI
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      account: {
        id: data.id || accountId,
        name: data.name || "RingBA Account",
        status: data.status || "active",
      },
    })
  } catch (error) {
    console.error("Error checking RingBA connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to RingBA API",
        details: String(error),
      },
      { status: 200 }, // Return 200 even for exceptions to handle in UI
    )
  }
}
