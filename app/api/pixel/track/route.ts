import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const ringbaCampaign = searchParams.get("ringba_campaign")
    const onscriptCampaign = searchParams.get("onscript_campaign")
    const event = searchParams.get("event") || "page_view"
    const data = searchParams.get("data")

    console.log("🎯 Pixel tracking event:", {
      ringbaCampaign,
      onscriptCampaign,
      event,
      data: data ? JSON.parse(decodeURIComponent(data)) : null,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    })

    // In a real application, you would store this tracking data in a database
    // For now, we'll just log it and return a 1x1 transparent pixel

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
      },
    })
  } catch (error) {
    console.error("❌ Pixel tracking error:", error)

    // Still return a pixel even on error
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": pixel.length.toString(),
      },
    })
  }
}
