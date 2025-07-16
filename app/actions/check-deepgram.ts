"use server"

/**
 * Server action to check Deepgram API key status
 * Returns detailed information about the API key
 */
export async function checkDeepgramApiKey() {
  try {
    console.log("🔍 Checking Deepgram API key status...")

    // Only use environment variable - no hardcoded keys
    const apiKey = process.env.DEEPGRAM_API_KEY
    if (!apiKey) {
      return {
        success: false,
        data: {
          status: "missing",
          message: "DEEPGRAM_API_KEY environment variable not found. Please add your new API key.",
          timestamp: new Date().toISOString(),
        },
        statusCode: 404,
      }
    }

    // Get the base URL for the API call
    let baseUrl = "http://localhost:3000"
    if (process.env.NEXTAUTH_URL) {
      baseUrl = process.env.NEXTAUTH_URL
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    }

    console.log("🌐 Using base URL:", baseUrl)

    // Call our diagnostic endpoint
    const response = await fetch(`${baseUrl}/api/diagnostics/deepgram`, {
      method: "GET",
      cache: "no-store",
    })

    const data = await response.json()

    return {
      success: response.ok,
      data,
      statusCode: response.status,
    }
  } catch (error: any) {
    console.error("❌ Error checking Deepgram API key:", error)
    return {
      success: false,
      data: {
        status: "error",
        message: `Error checking API key: ${error.message}`,
        timestamp: new Date().toISOString(),
      },
      statusCode: 500,
    }
  }
}
