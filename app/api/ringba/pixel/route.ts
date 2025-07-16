import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const campaignId = searchParams.get("campaign_id")
    const ringbaCampaignId = searchParams.get("ringba_campaign")
    const userId = searchParams.get("user_id")
    const event = searchParams.get("event") || "page_view"
    const callId = searchParams.get("call_id")
    const phoneNumber = searchParams.get("phone_number")

    // Log the pixel tracking event
    console.log("🎯 BlinkScriptAI Pixel Tracking:", {
      campaignId,
      ringbaCampaignId,
      userId,
      event,
      callId,
      phoneNumber,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      referer: request.headers.get("referer"),
    })

    // In a real application, you would:
    // 1. Store this tracking data in your database
    // 2. Trigger any necessary webhooks or notifications
    // 3. Update campaign analytics
    // 4. Process call data if this is a call event

    // For now, we'll simulate storing the data
    if (campaignId && event) {
      // Simulate database storage
      const trackingData = {
        campaignId,
        ringbaCampaignId,
        userId,
        event,
        callId,
        phoneNumber,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          referer: request.headers.get("referer"),
        },
      }

      console.log("💾 Storing tracking data:", trackingData)
    }

    // Return a 1x1 transparent PNG pixel
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": pixel.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "*",
      },
    })
  } catch (error) {
    console.error("❌ Pixel tracking error:", error)

    // Still return a pixel even on error to avoid breaking the page
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": pixel.length.toString(),
        "Access-Control-Allow-Origin": "*",
      },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("🎯 BlinkScriptAI Pixel POST Event:", {
      ...body,
      timestamp: new Date().toISOString(),
    })

    // Handle POST events (like form submissions, call completions, etc.)
    // This allows for more complex tracking data to be sent

    return NextResponse.json({
      success: true,
      message: "Event tracked successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Pixel POST tracking error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to track event",
      },
      { status: 500 },
    )
  }
}
