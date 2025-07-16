import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        data: {
          status: "missing",
          message: "DEEPGRAM_API_KEY environment variable not found",
        },
      })
    }

    // Test the API key with a simple request
    const response = await fetch("https://api.deepgram.com/v1/projects", {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        data: {
          status: "valid",
          message: "API key is valid and working",
          projects: data.projects?.length || 0,
        },
      })
    } else if (response.status === 401) {
      return NextResponse.json({
        success: false,
        data: {
          status: "invalid",
          message: "API key is invalid or expired",
        },
      })
    } else if (response.status === 402) {
      return NextResponse.json({
        success: false,
        data: {
          status: "insufficient_credits",
          message: "API key is valid but has insufficient credits",
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        data: {
          status: "error",
          message: `API returned status ${response.status}`,
        },
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      data: {
        status: "error",
        message: error.message || "Failed to check API key",
      },
    })
  }
}
