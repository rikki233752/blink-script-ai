import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🏥 Health check endpoint called")

    // Check environment variables
    const hasDeepgramKey = !!process.env.DEEPGRAM_API_KEY

    return NextResponse.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        hasDeepgramKey,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error: any) {
    console.error("❌ Health check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return GET() // Same response for POST
}
