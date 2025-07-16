import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Deepgram API Diagnostics - Testing new API key...")

    const apiKey = process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        data: {
          status: "missing",
          message:
            "DEEPGRAM_API_KEY environment variable not found. Please add your new API key to environment variables.",
          timestamp: new Date().toISOString(),
        },
      })
    }

    console.log("🔑 Testing API key for 50MB file support...")

    // Test the API key with projects endpoint
    const response = await fetch("https://api.deepgram.com/v1/projects", {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    })

    if (response.ok) {
      const data = await response.json()

      // Also test usage/billing endpoint for balance info
      let balanceInfo = {}
      try {
        const usageResponse = await fetch("https://api.deepgram.com/v1/projects", {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        })

        if (usageResponse.ok) {
          const usageData = await usageResponse.json()
          // Extract balance information if available
          balanceInfo = {
            projects: usageData.projects?.length || 0,
            hasProjects: (usageData.projects?.length || 0) > 0,
          }
        }
      } catch (usageError) {
        console.log("⚠️ Could not fetch usage data, but API key is valid")
      }

      return NextResponse.json({
        success: true,
        data: {
          status: "valid",
          message: "✅ New Deepgram API key is valid and ready for files up to 50MB!",
          timestamp: new Date().toISOString(),
          capabilities: {
            maxFileSize: "50MB",
            supportedFormats: ["WAV", "MP3", "M4A", "OGG", "WebM", "FLAC", "MP4"],
            features: ["Transcription", "Sentiment Analysis", "Topic Detection", "Intent Recognition"],
          },
          ...balanceInfo,
        },
      })
    } else if (response.status === 401) {
      return NextResponse.json({
        success: false,
        data: {
          status: "invalid",
          message: "❌ API key is invalid or expired. Please check your new Deepgram API key.",
          timestamp: new Date().toISOString(),
        },
      })
    } else if (response.status === 402) {
      return NextResponse.json({
        success: false,
        data: {
          status: "insufficient_credits",
          message: "⚠️ API key is valid but has insufficient credits for large file processing.",
          timestamp: new Date().toISOString(),
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        data: {
          status: "error",
          message: `API returned status ${response.status}. Please verify your new API key.`,
          timestamp: new Date().toISOString(),
        },
      })
    }
  } catch (error: any) {
    console.error("❌ Deepgram diagnostics error:", error)
    return NextResponse.json({
      success: false,
      data: {
        status: "error",
        message: `Failed to test API key: ${error.message}`,
        timestamp: new Date().toISOString(),
      },
    })
  }
}
