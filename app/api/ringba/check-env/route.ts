import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.RINGBA_API_KEY
  const accountId = process.env.RINGBA_ACCOUNT_ID

  return NextResponse.json({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}` : null,
    hasAccountId: !!accountId,
    accountId: accountId || null,
    timestamp: new Date().toISOString(),
  })
}
