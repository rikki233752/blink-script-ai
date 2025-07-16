import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json({ error: "Missing RingBA API key or account ID" }, { status: 400 })
    }

    // Parse POST request body
    const requestData = await request.json()
    const { startDate, endDate, campaignId, limit = 50, offset = 0 } = requestData

    const requestBody = {
      startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString(),
      filter: {
        campaignId: campaignId || undefined,
        hasRecording: true,
      },
      paging: {
        pageSize: Number(limit),
        pageIndex: Number(offset),
      },
      sort: {
        columnName: "callStartTime",
        sortDirection: "Descending",
      },
    }

    // Use correct Ringba endpoint format
    const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("RingBA API error:", errorText)
      return NextResponse.json(
        { error: `RingBA API error: ${response.status}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching RingBA calls:", error)
    return NextResponse.json({ error: "Failed to fetch calls from RingBA", details: String(error) }, { status: 500 })
  }
}
