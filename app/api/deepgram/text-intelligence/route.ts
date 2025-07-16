import type { NextRequest } from "next/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/api-error-handler"

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Text Intelligence API call starting...")

    // Parse the request body to get the text
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== "string") {
      return createErrorResponse("No text provided or invalid text format", 400, "NO_TEXT")
    }

    console.log("📄 Processing text:", {
      length: text.length,
      preview: text.substring(0, 100) + "...",
    })

    // Define the URL for the Deepgram Text Intelligence API endpoint
    const url = "https://api.deepgram.com/v1/read"

    // Define the headers for the HTTP request (matching your Python code style)
    const headers = {
      Authorization: "Token 826b863658186408cc422feb47b5fe93809d0eb7",
      "Content-Type": "application/json",
    }

    // Enhanced parameters for comprehensive text analysis
    const params = new URLSearchParams({
      summarize: "v2",
      sentiment: "true",
      topics: "true",
      intents: "true",
      entities: "true",
      language: "true",
    })

    console.log("📤 Making HTTP request to Deepgram Text Intelligence...")
    console.log("🔗 URL:", `${url}?${params.toString()}`)
    console.log("📋 Headers:", headers)

    // Prepare the request body
    const requestBody = {
      text: text,
    }

    // Make the HTTP request (equivalent to requests.post in Python)
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Deepgram Text Intelligence API error:", errorText)
      return createErrorResponse(
        `Deepgram Text Intelligence API error: ${response.status} - ${errorText}`,
        response.status,
        "DEEPGRAM_ERROR",
      )
    }

    // Get the JSON response (equivalent to response.json() in Python)
    const result = await response.json()

    console.log("✅ Deepgram Text Intelligence response received successfully")
    console.log("📊 Response data:", {
      summary: result.results?.summary ? "Generated" : "Not available",
      sentiment: result.results?.sentiment ? "Analyzed" : "Not available",
      topics: result.results?.topics?.length || 0,
      intents: result.results?.intents?.length || 0,
      entities: result.results?.entities?.length || 0,
    })

    // Return the response in the same format as your Python print(response.json())
    return createSuccessResponse({
      deepgram_text_intelligence_response: result,
      python_equivalent: true,
      api_key_used: "826b863658186408cc422feb47b5fe93809d0eb7",
      endpoint_used: url,
      text_info: {
        length: text.length,
        word_count: text.split(/\s+/).length,
        preview: text.substring(0, 200),
      },
    })
  } catch (error: any) {
    console.error("❌ Text Intelligence API error:", error)
    return createErrorResponse(`Request failed: ${error.message}`, 500, "REQUEST_FAILED")
  }
}
