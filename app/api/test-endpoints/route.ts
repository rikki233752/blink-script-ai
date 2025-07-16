import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing API endpoints...")

    const tests = []

    // Test 1: Environment variables
    tests.push({
      name: "Environment Variables",
      status: "success",
      data: {
        hasRingbaApiKey: !!process.env.RINGBA_API_KEY,
        hasRingbaAccountId: !!process.env.RINGBA_ACCOUNT_ID,
        hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "not set",
      },
    })

    // Test 2: Basic fetch test
    try {
      const testResponse = await fetch("https://httpbin.org/json", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        redirect: "follow",
      })

      tests.push({
        name: "Basic Fetch Test",
        status: testResponse.ok ? "success" : "error",
        data: {
          status: testResponse.status,
          ok: testResponse.ok,
        },
      })
    } catch (fetchError) {
      tests.push({
        name: "Basic Fetch Test",
        status: "error",
        error: fetchError instanceof Error ? fetchError.message : "Unknown fetch error",
      })
    }

    // Test 3: OnScript URL building
    try {
      const onscriptUrl = new URL("https://app.onscript.ai/api/create_process_dialog")
      onscriptUrl.searchParams.set("api_key", "test-key")
      onscriptUrl.searchParams.set("url", "https://example.com/test.mp3")

      tests.push({
        name: "OnScript URL Building",
        status: "success",
        data: {
          url: onscriptUrl.toString(),
        },
      })
    } catch (urlError) {
      tests.push({
        name: "OnScript URL Building",
        status: "error",
        error: urlError instanceof Error ? urlError.message : "Unknown URL error",
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests,
    })
  } catch (error) {
    console.error("❌ Error in test endpoints:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
