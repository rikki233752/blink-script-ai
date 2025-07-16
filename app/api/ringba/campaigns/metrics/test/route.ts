import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing RingBA campaigns metrics endpoint...")

    // Test with last 7 days
    const endDate = new Date()
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const testPayload = {
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    }

    console.log("📅 Test date range:", testPayload.dateRange)

    // Make request to our metrics endpoint
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/ringba/campaigns/metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    const result = await response.json()

    if (result.success) {
      console.log("✅ Metrics test successful!")
      return NextResponse.json({
        success: true,
        message: "Metrics endpoint test successful",
        testResults: {
          totalCalls: result.data.totalCalls,
          revenue: result.data.revenue,
          cpa: result.data.cpa,
          campaignsProcessed: result.campaignsProcessed,
          processingTime: result.processingTimeMs,
        },
        fullResponse: result,
      })
    } else {
      throw new Error(result.error || "Metrics test failed")
    }
  } catch (error) {
    console.error("❌ Metrics test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        message: "Metrics endpoint test failed",
      },
      { status: 500 },
    )
  }
}
