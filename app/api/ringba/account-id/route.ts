import { NextResponse } from "next/server"

export async function GET() {
  try {
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!accountId) {
      return NextResponse.json({ success: false, error: "RINGBA_ACCOUNT_ID not configured" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      accountId,
    })
  } catch (error) {
    console.error("Error getting Ringba account ID:", error)
    return NextResponse.json({ success: false, error: "Failed to get account ID" }, { status: 500 })
  }
}
