import { type NextRequest, NextResponse } from "next/server"
import { OpenRouterComprehensiveAnalyzer } from "@/lib/openrouter-comprehensive-analyzer"

const OPENROUTER_API_KEY = "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"

export async function POST(request: NextRequest) {
  try {
    const { transcript, testConnection } = await request.json()

    const analyzer = new OpenRouterComprehensiveAnalyzer(OPENROUTER_API_KEY)

    // If just testing connection
    if (testConnection) {
      console.log("🔍 Testing OpenRouter connection with GPT-4o Mini...")
      const connectionTest = await analyzer.testConnection()

      return NextResponse.json({
        success: connectionTest.success,
        message: connectionTest.message,
        apiKeyConfigured: !!OPENROUTER_API_KEY,
        model: "openai/gpt-4o-mini",
        timestamp: new Date().toISOString(),
      })
    }

    // If no transcript provided, return error
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No transcript provided for analysis",
        },
        { status: 400 },
      )
    }

    console.log("🤖 Starting comprehensive OpenRouter analysis with GPT-4o Mini...")
    console.log("📝 Transcript length:", transcript.length, "characters")

    const startTime = Date.now()

    // Perform comprehensive analysis
    const analysis = await analyzer.analyzeCall(transcript)

    const processingTime = Date.now() - startTime

    console.log("✅ OpenRouter comprehensive analysis completed")
    console.log("⏱️ Processing time:", processingTime, "ms")
    console.log("🎯 Overall confidence:", analysis.confidence, "%")

    return NextResponse.json({
      success: true,
      analysis,
      processingTime,
      apiKeyConfigured: !!OPENROUTER_API_KEY,
      model: "openai/gpt-4o-mini",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ OpenRouter comprehensive analysis failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Analysis failed",
        details: error.stack || "No additional details",
        apiKeyConfigured: !!OPENROUTER_API_KEY,
        model: "openai/gpt-4o-mini",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const analyzer = new OpenRouterComprehensiveAnalyzer(OPENROUTER_API_KEY)
    const connectionTest = await analyzer.testConnection()

    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.message,
      apiKeyConfigured: !!OPENROUTER_API_KEY,
      apiKeyPreview: OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 12) + "..." : "Not configured",
      model: "openai/gpt-4o-mini",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Connection test failed",
        apiKeyConfigured: !!OPENROUTER_API_KEY,
        model: "openai/gpt-4o-mini",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
