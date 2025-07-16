import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, accountId } = await request.json()

    if (!apiKey || !accountId) {
      return NextResponse.json({ error: "API Key and Account ID are required" }, { status: 400 })
    }

    // Test connection to Ringba API
    const response = await fetch(`https://api.ringba.com/v2/${accountId}/campaigns`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ringba API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      accountName: `Account ${accountId}`,
      campaignCount: data.length || 0,
    })
  } catch (error: any) {
    console.error("Ringba connection test error:", error)
    return NextResponse.json({ error: error.message || "Connection test failed" }, { status: 500 })
  }
}
