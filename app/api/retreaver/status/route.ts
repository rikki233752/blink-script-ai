import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== RETREAVER API STATUS CHECK ===")

    const apiKey = process.env.RETREAVER_API_KEY
    const companyId = process.env.RETREAVER_ACCOUNT_ID || "170308"

    console.log("Environment variables check:", {
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      companyId,
    })

    const status = {
      api_key_configured: !!apiKey,
      api_key_length: apiKey?.length || 0,
      api_key_preview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "Not configured",
      company_id: companyId,
      base_url: "https://api.retreaver.com",
      endpoint: "/api/v2/calls.json",
      curl_format: `curl "https://api.retreaver.com/api/v2/calls.json?api_key=${apiKey ? "YOUR_API_KEY" : "NOT_CONFIGURED"}"`,
    }

    console.log("API Status:", status)

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error checking API status:", error)
    return NextResponse.json(
      {
        api_key_configured: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
