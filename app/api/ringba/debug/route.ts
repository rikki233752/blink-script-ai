import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("🔍 Debug Info:")
    console.log("- API Key exists:", !!apiKey)
    console.log("- Account ID exists:", !!accountId)
    console.log("- API Key length:", apiKey?.length || 0)
    console.log("- Account ID length:", accountId?.length || 0)
    console.log("- API Key first 10 chars:", apiKey?.substring(0, 10) || "N/A")
    console.log("- Account ID first 10 chars:", accountId?.substring(0, 10) || "N/A")

    if (!apiKey || !accountId) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        debug: {
          hasApiKey: !!apiKey,
          hasAccountId: !!accountId,
          envVars: Object.keys(process.env).filter((key) => key.includes("RINGBA")),
        },
      })
    }

    // Test the exact format provided by the user
    const endpoint = `https://api.ringba.com/v2/${accountId}/campaigns`

    console.log("🌐 Making request to:", endpoint)
    console.log("🔑 Using API key:", apiKey.substring(0, 20) + "...")

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "CallCenter-Transcription/1.0",
    }

    console.log("📋 Headers:", Object.keys(headers))

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    })

    console.log("📡 Response status:", response.status)
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("📄 Response body:", responseText.substring(0, 500))

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { rawText: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      endpoint,
      headers: Object.keys(headers),
      responseData,
      debug: {
        apiKeyLength: apiKey.length,
        accountIdLength: accountId.length,
        apiKeyPrefix: apiKey.substring(0, 10),
        accountIdPrefix: accountId.substring(0, 10),
        fullEndpoint: endpoint,
      },
    })
  } catch (error) {
    console.error("💥 Debug error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      debug: {
        hasApiKey: !!process.env.RINGBA_API_KEY,
        hasAccountId: !!process.env.RINGBA_ACCOUNT_ID,
      },
    })
  }
}
