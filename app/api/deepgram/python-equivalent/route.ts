import type { NextRequest } from "next/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/api-error-handler"

export async function POST(request: NextRequest) {
  try {
    console.log("🐍 Python-equivalent Deepgram API call starting...")

    // Parse the form data (equivalent to opening the file in Python)
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

    // Convert file to buffer (equivalent to reading binary file in Python)
    const audioBuffer = await audioFile.arrayBuffer()

    // Define the URL for the Deepgram API endpoint (exactly like your Python code)
    const url = "https://api.deepgram.com/v1/listen"

    // Define the headers for the HTTP request (exactly like your Python code)
    const headers = {
      Authorization: "Token 826b863658186408cc422feb47b5fe93809d0eb7",
      "Content-Type": "audio/*",
    }

    console.log("📤 Making HTTP request to Deepgram...")
    console.log("🔗 URL:", url)
    console.log("📋 Headers:", headers)

    // Make the HTTP request (equivalent to requests.post in Python)
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: audioBuffer, // equivalent to data=audio_file in Python
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Deepgram API error:", errorText)
      return createErrorResponse(
        `Deepgram API error: ${response.status} - ${errorText}`,
        response.status,
        "DEEPGRAM_ERROR",
      )
    }

    // Get the JSON response (equivalent to response.json() in Python)
    const result = await response.json()

    console.log("✅ Deepgram response received successfully")
    console.log("📊 Response data:", {
      channels: result.results?.channels?.length || 0,
      alternatives: result.results?.channels?.[0]?.alternatives?.length || 0,
      transcript_length: result.results?.channels?.[0]?.alternatives?.[0]?.transcript?.length || 0,
    })

    // Return the exact same structure as your Python print(response.json())
    return createSuccessResponse({
      deepgram_response: result,
      python_equivalent: true,
      api_key_used: "826b863658186408cc422feb47b5fe93809d0eb7",
      endpoint_used: url,
      file_info: {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
      },
    })
  } catch (error: any) {
    console.error("❌ Python-equivalent API error:", error)
    return createErrorResponse(`Request failed: ${error.message}`, 500, "REQUEST_FAILED")
  }
}
