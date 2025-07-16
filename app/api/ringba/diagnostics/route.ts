import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    return NextResponse.json({
      hasCredentials: !!(apiKey && accountId),
      apiKeyLength: apiKey?.length || 0,
      accountIdLength: accountId?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 8) + "..." || "Not set",
      accountIdPrefix: accountId?.substring(0, 8) + "..." || "Not set",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check diagnostics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
