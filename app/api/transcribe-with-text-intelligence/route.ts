import type { NextRequest } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-error-handler"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Enhanced API: Starting transcription + text intelligence...")

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return createErrorResponse("No audio file provided", 400, "NO_FILE")
    }

    console.log("📁 Processing file:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    })

    // Step 1: Transcribe audio using /v1/listen
    console.log("🎤 Step 1: Transcribing audio...")
    const transcript = await transcribeAudio(audioFile)

    if (!transcript) {
      return createErrorResponse("Failed to transcribe audio", 400, "TRANSCRIPTION_FAILED")
    }

    console.log("✅ Transcription complete:", transcript.length, "characters")

    // Step 2: Analyze transcript using /v1/read (Text Intelligence)
    console.log("🧠 Step 2: Analyzing transcript with Text Intelligence...")
    const textIntelligence = await analyzeTextIntelligence(transcript)

    console.log("✅ Text Intelligence analysis complete")

    // Prepare enhanced response
    const responseData = {
      transcript,
      textIntelligence,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      provider: "deepgram-enhanced-pipeline",
      apiKeyUsed: "826b863658186408cc422feb47b5fe93809d0eb7",
      endpoints: {
        transcription: "https://api.deepgram.com/v1/listen",
        textIntelligence: "https://api.deepgram.com/v1/read",
      },
    }

    return createSuccessResponse(responseData)
  } catch (error: any) {
    console.error("❌ Enhanced pipeline error:", error)
    return handleApiError(error, "Enhanced transcription pipeline failed")
  }
}

async function transcribeAudio(audioFile: File): Promise<string | null> {
  try {
    const audioBuffer = await audioFile.arrayBuffer()

    const url = "https://api.deepgram.com/v1/listen"
    const headers = {
      Authorization: "Token 826b863658186408cc422feb47b5fe93809d0eb7",
      "Content-Type": audioFile.type || "audio/*",
    }

    const params = new URLSearchParams({
      model: "nova-2",
      language: "en-US",
      smart_format: "true",
      punctuate: "true",
      diarize: "true",
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers,
      body: audioBuffer,
    })

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`)
    }

    const result = await response.json()
    return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || null
  } catch (error) {
    console.error("❌ Transcription error:", error)
    return null
  }
}

async function analyzeTextIntelligence(text: string): Promise<any> {
  try {
    const url = "https://api.deepgram.com/v1/read"
    const headers = {
      Authorization: "Token 826b863658186408cc422feb47b5fe93809d0eb7",
      "Content-Type": "application/json",
    }

    const params = new URLSearchParams({
      summarize: "v2",
      sentiment: "true",
      topics: "true",
      intents: "true",
      entities: "true",
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`Text Intelligence failed: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("❌ Text Intelligence error:", error)
    return null
  }
}
