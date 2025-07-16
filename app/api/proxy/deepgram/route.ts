import { type NextRequest, NextResponse } from "next/server"

/**
 * Secure Deepgram API Proxy
 *
 * This endpoint acts as a secure proxy between the client and Deepgram API.
 * It handles authentication, request validation, and error handling.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔒 Deepgram Proxy: Starting secure request...")

    // Check if Deepgram API key is available
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramApiKey) {
      console.error("❌ DEEPGRAM_API_KEY not found")
      return NextResponse.json({ error: "Deepgram API key not configured" }, { status: 500 })
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get("audio") as File

    if (!file) {
      console.error("❌ No audio file provided")
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("📁 File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Security checks
    // 1. Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size)
      return NextResponse.json(
        { error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size is 50MB.` },
        { status: 413 },
      )
    }

    // 2. Validate file type
    const validTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/m4a", "audio/ogg", "audio/webm"]
    const fileType = file.type || ""
    if (!validTypes.includes(fileType.toLowerCase()) && !file.name.match(/\.(wav|mp3|m4a|ogg|webm)$/i)) {
      console.error("❌ Invalid file type:", fileType)
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType}. Please use WAV, MP3, M4A, OGG, or WebM files.` },
        { status: 415 },
      )
    }

    try {
      // Convert file to buffer
      console.log("📦 Converting file to buffer...")
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log("📦 Buffer created successfully, size:", buffer.length, "bytes")

      // Prepare Deepgram API request
      const deepgramUrl = "https://api.deepgram.com/v1/listen"

      // Get additional parameters from request (if any)
      const model = formData.get("model") || "nova-2"
      const language = formData.get("language") || "en-US"

      // Build query parameters with security validation
      const params = new URLSearchParams({
        model: typeof model === "string" ? model : "nova-2",
        language: typeof language === "string" ? language : "en-US",
        smart_format: "true",
        punctuate: "true",
        diarize: "true",
        utterances: "true",
        paragraphs: "true",
        sentiment: "true",
        detect_language: "false",
        filler_words: "true",
        multichannel: "false",
        alternatives: "1",
      })

      const apiUrl = `${deepgramUrl}?${params.toString()}`
      console.log("🔒 Making secure proxy request to Deepgram API...")

      // Set timeout for the request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      // Make direct HTTP request to Deepgram API
      const startTime = Date.now()
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramApiKey}`,
          "Content-Type": fileType || "audio/wav",
          "User-Agent": "OnScript-Secure-Proxy/1.0",
        },
        body: buffer,
        signal: controller.signal,
      })

      // Clear the timeout
      clearTimeout(timeoutId)

      const processingTime = Date.now() - startTime
      console.log(`⏱️ Deepgram processing time: ${processingTime}ms`)
      console.log("📡 Deepgram response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Deepgram API error:", errorText)

        // Handle specific error codes
        if (response.status === 401) {
          return NextResponse.json({ error: "Invalid Deepgram API key" }, { status: 401 })
        } else if (response.status === 402) {
          return NextResponse.json({ error: "Insufficient Deepgram credits" }, { status: 402 })
        } else if (response.status === 413) {
          return NextResponse.json({ error: "File too large for Deepgram API" }, { status: 413 })
        } else if (response.status === 415) {
          return NextResponse.json({ error: "Unsupported audio format" }, { status: 415 })
        } else {
          return NextResponse.json({ error: `Deepgram API error: ${errorText}` }, { status: response.status })
        }
      }

      const result = await response.json()
      console.log("✅ Deepgram API call successful!")

      // Validate result structure
      const channels = result.results?.channels
      if (!channels || channels.length === 0) {
        console.error("❌ No channels in Deepgram result")
        return NextResponse.json({ error: "Invalid audio format or corrupted file" }, { status: 422 })
      }

      const alternatives = channels[0]?.alternatives
      if (!alternatives || alternatives.length === 0) {
        console.error("❌ No alternatives in Deepgram result")
        return NextResponse.json({ error: "No transcription alternatives found" }, { status: 422 })
      }

      const transcript = alternatives[0]?.transcript
      if (!transcript || transcript.trim().length === 0) {
        console.error("❌ Empty transcript from Deepgram")
        return NextResponse.json({ error: "No speech detected in audio file" }, { status: 422 })
      }

      // Extract metadata
      const words = alternatives[0]?.words || []
      const paragraphs = alternatives[0]?.paragraphs || []
      const sentimentSegments = alternatives[0]?.sentiment_segments || []

      console.log("🎉 Transcription successful!")
      console.log("📝 Transcript length:", transcript.length, "characters")
      console.log("📝 Words detected:", words.length)
      console.log("📄 Paragraphs:", paragraphs.length)
      console.log("💭 Sentiment segments:", sentimentSegments.length)

      // Return successful result with sanitized data
      return NextResponse.json({
        success: true,
        result: result,
        metadata: {
          processingTime,
          wordsCount: words.length,
          paragraphsCount: paragraphs.length,
          sentimentSegmentsCount: sentimentSegments.length,
          confidence: alternatives[0]?.confidence || 0,
          model: model,
          language: language,
        },
      })
    } catch (deepgramError: any) {
      console.error("❌ Deepgram processing error:", deepgramError)

      // Handle fetch errors
      if (deepgramError.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout after 60 seconds" }, { status: 408 })
      } else if (deepgramError.name === "TypeError" && deepgramError.message.includes("fetch")) {
        return NextResponse.json({ error: "Network error connecting to Deepgram API" }, { status: 503 })
      } else {
        return NextResponse.json({ error: `Deepgram error: ${deepgramError.message}` }, { status: 500 })
      }
    }
  } catch (error: any) {
    console.error("❌ General API error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
