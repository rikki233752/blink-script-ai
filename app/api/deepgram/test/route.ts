import { getDeepgramConfig, validateDeepgramConfig } from "@/lib/deepgram-config"
import { createErrorResponse, createSuccessResponse } from "@/lib/api-error-handler"

export async function GET() {
  try {
    console.log("🧪 Testing Deepgram API configuration...")

    // Validate configuration
    const configValidation = validateDeepgramConfig()
    if (!configValidation.valid) {
      return createErrorResponse(`Configuration invalid: ${configValidation.error}`, 400, "INVALID_CONFIG")
    }

    const config = getDeepgramConfig()
    console.log("✅ Configuration valid")

    // Test API connectivity
    const testResponse = await fetch("https://api.deepgram.com/v1/projects", {
      method: "GET",
      headers: {
        Authorization: `Token ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Deepgram API response:", testResponse.status)

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error("❌ Deepgram API error:", errorText)

      if (testResponse.status === 401) {
        return createErrorResponse(
          "Invalid API key. Please check your DEEPGRAM_API_KEY environment variable.",
          401,
          "INVALID_API_KEY",
        )
      }

      if (testResponse.status === 402) {
        return createErrorResponse(
          "Insufficient credits. Please check your Deepgram account balance.",
          402,
          "INSUFFICIENT_CREDITS",
        )
      }

      return createErrorResponse(
        `Deepgram API error: ${testResponse.status} - ${errorText}`,
        testResponse.status,
        "API_ERROR",
      )
    }

    const projectData = await testResponse.json()
    console.log("✅ Deepgram API test successful")

    return createSuccessResponse({
      status: "connected",
      config: {
        baseUrl: config.baseUrl,
        model: config.model,
        language: config.language,
        features: config.features,
      },
      projects: projectData.projects?.length || 0,
      message: "Deepgram API is properly configured and accessible",
    })
  } catch (error: any) {
    console.error("❌ Deepgram test error:", error)
    return createErrorResponse(`Test failed: ${error.message}`, 500, "TEST_FAILED")
  }
}

export async function POST() {
  try {
    console.log("🧪 Testing Deepgram transcription with sample audio...")

    const config = getDeepgramConfig()

    // Create a minimal test audio buffer (silence)
    const sampleRate = 16000
    const duration = 1 // 1 second
    const samples = sampleRate * duration
    const buffer = new ArrayBuffer(samples * 2) // 16-bit audio
    const view = new Int16Array(buffer)

    // Generate a simple tone for testing
    for (let i = 0; i < samples; i++) {
      view[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 1000 // 440Hz tone
    }

    const params = new URLSearchParams({
      model: config.model,
      language: config.language,
      smart_format: "true",
      punctuate: "true",
    })

    const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${config.apiKey}`,
        "Content-Type": "audio/wav",
      },
      body: buffer,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return createErrorResponse(
        `Transcription test failed: ${response.status} - ${errorText}`,
        response.status,
        "TRANSCRIPTION_TEST_FAILED",
      )
    }

    const result = await response.json()
    console.log("✅ Deepgram transcription test successful")

    return createSuccessResponse({
      status: "transcription_ready",
      message: "Deepgram transcription API is working correctly",
      testResult: {
        channels: result.results?.channels?.length || 0,
        confidence: result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
        hasTranscript: !!result.results?.channels?.[0]?.alternatives?.[0]?.transcript,
      },
    })
  } catch (error: any) {
    console.error("❌ Transcription test error:", error)
    return createErrorResponse(`Transcription test failed: ${error.message}`, 500, "TRANSCRIPTION_TEST_FAILED")
  }
}
