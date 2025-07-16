import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🏥 Health check called")

    return NextResponse.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasRingbaKey: !!process.env.RINGBA_API_KEY,
        hasRingbaAccount: !!process.env.RINGBA_ACCOUNT_ID,
        hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      },
    })
  } catch (error) {
    console.error("❌ Health check failed:", error)

    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
