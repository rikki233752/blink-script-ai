import { type NextRequest, NextResponse } from "next/server"
import { openRouterAnalyzer } from "@/lib/openrouter-comprehensive-analyzer"

export async function POST(request: NextRequest) {
  console.log("🎵 RingBA Recording Transcription API called")

  try {
    const body = await request.json()
    const { recordingUrl, callId, campaignId, metadata } = body

    if (!recordingUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Recording URL is required",
          code: "MISSING_RECORDING_URL",
        },
        { status: 400 },
      )
    }

    console.log("🔗 Processing recording URL:", recordingUrl)
    console.log("📞 Call ID:", callId)
    console.log("🎯 Campaign ID:", campaignId)

    // Check if Deepgram API key is available
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramApiKey) {
      console.error("❌ No Deepgram API key found")
      return NextResponse.json(
        {
          success: false,
          error: "Deepgram API key not configured",
          code: "MISSING_API_KEY",
        },
        { status: 500 },
      )
    }

    console.log("✅ Using Deepgram API key:", deepgramApiKey.substring(0, 8) + "...")

    // First, let's validate and analyze the recording URL
    const urlAnalysis = analyzeRecordingUrl(recordingUrl)
    console.log("🔍 URL Analysis:", urlAnalysis)

    // Try multiple download strategies with improved error handling
    console.log("📥 Attempting to download audio from RingBA...")
    let downloadResult: { audioBuffer: ArrayBuffer; contentType: string } | null = null
    let lastError: Error | null = null
    const errors: string[] = []

    // Strategy 1: Try Deepgram URL processing first (most reliable for redirects)
    try {
      console.log("🔄 Strategy 1: Using Deepgram URL processing (handles redirects)")
      const transcriptResult = await transcribeDirectlyFromUrl(recordingUrl, deepgramApiKey)

      if (transcriptResult.success) {
        console.log("✅ Strategy 1 successful - Deepgram processed URL directly")
        return NextResponse.json(transcriptResult)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      console.log("❌ Strategy 1 failed:", errorMsg)
      errors.push(`Strategy 1 (Deepgram URL): ${errorMsg}`)
      lastError = error instanceof Error ? error : new Error("Strategy 1 failed")
    }

    // Strategy 2: Enhanced download with redirect handling
    try {
      console.log("🔄 Strategy 2: Enhanced download with redirect handling")
      downloadResult = await downloadWithRedirectHandling(recordingUrl)
      console.log("✅ Strategy 2 successful")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      console.log("❌ Strategy 2 failed:", errorMsg)
      errors.push(`Strategy 2 (Redirect handling): ${errorMsg}`)
      lastError = error instanceof Error ? error : new Error("Strategy 2 failed")
    }

    // Strategy 3: Follow redirects manually
    if (!downloadResult) {
      try {
        console.log("🔄 Strategy 3: Manual redirect following")
        downloadResult = await followRedirectsManually(recordingUrl)
        console.log("✅ Strategy 3 successful")
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        console.log("❌ Strategy 3 failed:", errorMsg)
        errors.push(`Strategy 3 (Manual redirects): ${errorMsg}`)
        lastError = error instanceof Error ? error : new Error("Strategy 3 failed")
      }
    }

    // Strategy 4: Try with different user agents
    if (!downloadResult) {
      try {
        console.log("🔄 Strategy 4: Alternative user agents")
        downloadResult = await downloadWithAlternativeHeaders(recordingUrl)
        console.log("✅ Strategy 4 successful")
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        console.log("❌ Strategy 4 failed:", errorMsg)
        errors.push(`Strategy 4 (Alternative headers): ${errorMsg}`)
        lastError = error instanceof Error ? error : new Error("Strategy 4 failed")
      }
    }

    // If all strategies failed, return detailed error
    if (!downloadResult) {
      console.error("❌ All download strategies failed")
      return NextResponse.json(
        {
          success: false,
          error: `Failed to download recording after trying multiple strategies. The recording URL appears to be redirecting (302) which suggests it may require special authentication or the file may have moved.`,
          code: "DOWNLOAD_FAILED",
          details: {
            urlAnalysis,
            errors,
            lastError: lastError?.message,
            strategiesTried: ["deepgram_url", "redirect_handling", "manual_redirects", "alternative_headers"],
            troubleshooting: {
              possibleCauses: [
                "Recording URL redirects to a protected location (302 redirect)",
                "Recording requires special authentication headers",
                "Recording file has been moved or expired",
                "RingBA API credentials may be invalid",
                "Recording URL format has changed",
              ],
              suggestions: [
                "Verify RingBA API credentials are correct and active",
                "Check if recording URL is accessible directly in browser",
                "Ensure recording hasn't expired or been moved",
                "Contact RingBA support about recording access",
                "Try accessing recording through RingBA dashboard first",
              ],
            },
          },
        },
        { status: 400 },
      )
    }

    const { audioBuffer, contentType } = downloadResult

    console.log("✅ Audio downloaded:", audioBuffer.byteLength, "bytes")
    console.log("🎵 Content type:", contentType)

    // Validate file size
    const maxSize = 200 * 1024 * 1024 // 200MB
    if (audioBuffer.byteLength > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Recording too large (${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB). Maximum size is 200MB.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 },
      )
    }

    if (audioBuffer.byteLength === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Downloaded recording is empty",
          code: "EMPTY_FILE",
        },
        { status: 400 },
      )
    }

    // Call Deepgram API
    console.log("📤 Calling Deepgram API...")
    let deepgramResult: any
    try {
      deepgramResult = await callDeepgramAPIWithPythonConfig(audioBuffer, contentType, deepgramApiKey)
      console.log("✅ Deepgram API call successful")
    } catch (error: any) {
      console.error("❌ Deepgram API error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Deepgram API call failed: ${error.message || "Unknown error"}`,
          code: "DEEPGRAM_API_ERROR",
          details: error.stack || "No stack trace available",
        },
        { status: 500 },
      )
    }

    // Extract transcript
    const transcript = extractTranscript(deepgramResult)
    if (!transcript) {
      console.error("❌ No transcript extracted from Deepgram response")
      return NextResponse.json(
        {
          success: false,
          error: "No transcript could be generated from the recording",
          code: "NO_TRANSCRIPT",
        },
        { status: 400 },
      )
    }

    console.log("✅ Transcript extracted:", transcript.length, "characters")

    // Perform comprehensive analysis using OpenRouter
    let analysis: any
    try {
      console.log("🤖 Starting OpenRouter comprehensive analysis...")
      const comprehensiveAnalysis = await openRouterAnalyzer.analyzeCall(transcript)

      // Transform OpenRouter analysis to match expected format
      const duration = metadata?.duration || calculateDuration(deepgramResult, audioBuffer.byteLength)
      analysis = {
        overallRating:
          comprehensiveAnalysis.qualityAnalysis.overallScore > 75
            ? "GOOD"
            : comprehensiveAnalysis.qualityAnalysis.overallScore > 50
              ? "BAD"
              : "UGLY",
        overallScore: Math.round(comprehensiveAnalysis.qualityAnalysis.overallScore / 10),

        // Intent and Disposition from OpenRouter
        callIntent: comprehensiveAnalysis.intentAnalysis.primaryIntent,
        disposition: comprehensiveAnalysis.dispositionAnalysis.disposition,

        // AI Summary from OpenRouter
        aiSummary: comprehensiveAnalysis.summary,

        // Topics from OpenRouter analysis
        topicsCovered: extractTopicsFromOpenRouter(comprehensiveAnalysis),

        // Key takeaways from OpenRouter
        keyTakeaways: extractTakeawaysFromOpenRouter(comprehensiveAnalysis),

        // Facts from OpenRouter
        facts: comprehensiveAnalysis.factsAnalysis.keyFacts,

        // Sentiment analysis from OpenRouter
        sentimentAnalysis: {
          overall: comprehensiveAnalysis.sentimentAnalysis.overallSentiment,
          confidence: comprehensiveAnalysis.sentimentAnalysis.confidence,
          positiveIndicators: comprehensiveAnalysis.factsAnalysis.keyFacts.filter(
            (fact) =>
              fact.toLowerCase().includes("positive") ||
              fact.toLowerCase().includes("good") ||
              fact.toLowerCase().includes("satisfied"),
          ).length,
          negativeIndicators: comprehensiveAnalysis.factsAnalysis.objections.length,
          agentSentiment: comprehensiveAnalysis.sentimentAnalysis.agentSentiment,
          customerSentiment: comprehensiveAnalysis.sentimentAnalysis.customerSentiment,
        },

        // Agent performance from OpenRouter
        agentPerformance: {
          communicationSkills: Math.round(comprehensiveAnalysis.qualityAnalysis.communicationClarity / 10),
          problemSolving: Math.round(comprehensiveAnalysis.qualityAnalysis.problemSolving / 10),
          productKnowledge: Math.round(comprehensiveAnalysis.qualityAnalysis.productKnowledge / 10),
          customerService: Math.round(comprehensiveAnalysis.qualityAnalysis.professionalism / 10),
        },

        // Business conversion from OpenRouter
        businessConversion: {
          conversionAchieved: comprehensiveAnalysis.businessAnalysis.conversionPotential > 70,
          conversionType: comprehensiveAnalysis.intentAnalysis.primaryIntent,
          conversionConfidence: comprehensiveAnalysis.businessAnalysis.conversionPotential,
        },

        // Call conclusion from OpenRouter
        callConclusion: generateCallConclusionFromOpenRouter(comprehensiveAnalysis),

        // Additional OpenRouter data
        openRouterAnalysis: comprehensiveAnalysis,

        // Original fields for compatibility
        summary: comprehensiveAnalysis.summary,
        keyInsights: [
          `Primary Intent: ${comprehensiveAnalysis.intentAnalysis.primaryIntent}`,
          `Disposition: ${comprehensiveAnalysis.dispositionAnalysis.disposition}`,
          `Sentiment: ${comprehensiveAnalysis.sentimentAnalysis.overallSentiment}`,
          `Quality Score: ${comprehensiveAnalysis.qualityAnalysis.overallScore}/100`,
          `Conversion Potential: ${comprehensiveAnalysis.businessAnalysis.conversionPotential}%`,
        ],
        callDuration: duration,
        source: "openrouter-ringba",
        transcribedAt: new Date().toISOString(),
        speakingRate: Math.round(transcript.split(/\s+/).length / (duration / 60)),
        wordCount: transcript.split(/\s+/).length,
      }

      console.log("✅ OpenRouter comprehensive analysis completed")
    } catch (error: any) {
      console.error("❌ OpenRouter analysis error:", error)
      // Fallback to basic analysis if OpenRouter fails
      analysis = await performEnhancedCallAnalysis(transcript, deepgramResult, {
        name: `ringba-call-${callId}`,
        size: audioBuffer.byteLength,
        callId,
        campaignId,
        metadata,
      })
      analysis.openRouterError = error.message
    }

    // Prepare response
    const responseData = {
      success: true,
      data: {
        transcript,
        analysis,
        callId,
        campaignId,
        recordingUrl,
        metadata: {
          ...metadata,
          fileSize: audioBuffer.byteLength,
          contentType,
          duration: metadata?.duration || calculateDuration(deepgramResult, audioBuffer.byteLength),
          transcribedAt: new Date().toISOString(),
        },
        provider: "deepgram-ringba",
        deepgramMetadata: deepgramResult.metadata,
      },
    }

    console.log("✅ RingBA recording transcription complete")
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("❌ Unexpected error in RingBA transcribe route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
        timestamp: new Date().toISOString(),
        details: error.stack || "No stack trace available",
      },
      { status: 500 },
    )
  }
}

// Analyze the recording URL to understand its structure
function analyzeRecordingUrl(url: string) {
  try {
    const urlObj = new URL(url)
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      hasQuery: urlObj.search.length > 0,
      isHttps: urlObj.protocol === "https:",
      fileExtension: urlObj.pathname.split(".").pop()?.toLowerCase(),
      isRingbaDomain: urlObj.hostname.includes("ringba") || urlObj.hostname.includes("ringcentral"),
      isS3Domain: urlObj.hostname.includes("s3.amazonaws.com") || urlObj.hostname.includes("amazonaws"),
      queryParams: Object.fromEntries(urlObj.searchParams.entries()),
    }
  } catch (error) {
    return {
      error: "Invalid URL format",
      originalUrl: url,
    }
  }
}

// Strategy 1: Let Deepgram handle the URL directly (best for redirects)
async function transcribeDirectlyFromUrl(recordingUrl: string, apiKey: string) {
  console.log("🔄 Attempting Deepgram URL processing...")

  const baseUrl = "https://api.deepgram.com/v1/listen"

  const headers = {
    Authorization: `Token ${apiKey}`,
    "Content-Type": "application/json",
  }

  const params: Record<string, string> = {
    model: "nova-2",
    language: "en-US",
    smart_format: "true",
    punctuate: "true",
    diarize: "true",
    utterances: "true",
    paragraphs: "true",
    sentiment: "true",
    filler_words: "true",
    alternatives: "1",
    topics: "true",
    intents: "true",
    summarize: "v2",
  }

  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  const fullUrl = `${baseUrl}?${queryString}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minute timeout

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ url: recordingUrl }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`Deepgram URL processing failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    const transcript = extractTranscript(result)

    if (!transcript) {
      throw new Error("No transcript extracted from Deepgram URL processing")
    }

    // Perform enhanced analysis
    const analysis = await performEnhancedCallAnalysis(transcript, result, {
      name: "ringba-url-processed",
      size: 0,
    })

    return {
      success: true,
      data: {
        transcript,
        analysis,
        provider: "deepgram-url",
        deepgramMetadata: result.metadata,
        metadata: {
          transcribedAt: new Date().toISOString(),
          method: "url_processing",
        },
      },
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Strategy 2: Enhanced download with proper redirect handling
async function downloadWithRedirectHandling(recordingUrl: string): Promise<{
  audioBuffer: ArrayBuffer
  contentType: string
}> {
  console.log("🔄 Attempting download with redirect handling...")

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "audio/*, application/octet-stream, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "identity",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  }

  // Add RingBA credentials if available
  const ringbaApiKey = process.env.RINGBA_API_KEY
  const ringbaAccountId = process.env.RINGBA_ACCOUNT_ID

  if (ringbaApiKey && ringbaAccountId) {
    headers["Authorization"] = `Token ${ringbaApiKey}`
    headers["X-Account-ID"] = ringbaAccountId
    console.log("🔐 Using RingBA authentication")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

  try {
    console.log("📥 Downloading with redirect handling from:", recordingUrl)

    const response = await fetch(recordingUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "follow", // This is key - follow redirects automatically
    })

    clearTimeout(timeoutId)

    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response URL: ${response.url}`)
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentLength = response.headers.get("content-length")
    console.log("📊 Content-Length:", contentLength)

    const audioBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "audio/wav"

    console.log(`✅ Downloaded ${audioBuffer.byteLength} bytes, Content-Type: ${contentType}`)

    return { audioBuffer, contentType }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Strategy 3: Manual redirect following
async function followRedirectsManually(recordingUrl: string): Promise<{
  audioBuffer: ArrayBuffer
  contentType: string
}> {
  console.log("🔄 Following redirects manually...")

  let currentUrl = recordingUrl
  let redirectCount = 0
  const maxRedirects = 5

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "audio/*, application/octet-stream, */*",
  }

  // Add RingBA credentials if available
  const ringbaApiKey = process.env.RINGBA_API_KEY
  if (ringbaApiKey) {
    headers["Authorization"] = `Token ${ringbaApiKey}`
  }

  while (redirectCount < maxRedirects) {
    console.log(`🔄 Attempt ${redirectCount + 1}: ${currentUrl}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
        redirect: "manual", // Don't follow redirects automatically
      })

      clearTimeout(timeoutId)

      console.log(`📊 Response status: ${response.status}`)

      if (response.status >= 300 && response.status < 400) {
        // Handle redirect
        const location = response.headers.get("location")
        if (!location) {
          throw new Error("Redirect response without location header")
        }

        // Handle relative URLs
        if (location.startsWith("/")) {
          const urlObj = new URL(currentUrl)
          currentUrl = `${urlObj.protocol}//${urlObj.host}${location}`
        } else if (location.startsWith("http")) {
          currentUrl = location
        } else {
          // Relative to current path
          const urlObj = new URL(currentUrl)
          const pathParts = urlObj.pathname.split("/")
          pathParts.pop() // Remove filename
          currentUrl = `${urlObj.protocol}//${urlObj.host}${pathParts.join("/")}/${location}`
        }

        console.log(`🔄 Redirecting to: ${currentUrl}`)
        redirectCount++
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Success - download the file
      const audioBuffer = await response.arrayBuffer()
      const contentType = response.headers.get("content-type") || "audio/wav"

      console.log(`✅ Downloaded ${audioBuffer.byteLength} bytes after ${redirectCount} redirects`)

      return { audioBuffer, contentType }
    } catch (error) {
      clearTimeout(timeoutId)
      if (redirectCount === 0) {
        throw error // If first attempt fails, throw the error
      }
      console.log(`❌ Failed after ${redirectCount} redirects:`, error)
      throw error
    }
  }

  throw new Error(`Too many redirects (${maxRedirects})`)
}

// Strategy 4: Alternative headers approach
async function downloadWithAlternativeHeaders(recordingUrl: string): Promise<{
  audioBuffer: ArrayBuffer
  contentType: string
}> {
  console.log("🔄 Attempting alternative headers download...")

  const userAgents = [
    "curl/7.68.0",
    "wget/1.20.3",
    "RingBA-Client/1.0",
    "PostmanRuntime/7.29.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  ]

  const ringbaApiKey = process.env.RINGBA_API_KEY

  for (const userAgent of userAgents) {
    try {
      const headers: Record<string, string> = {
        "User-Agent": userAgent,
        Accept: "*/*",
      }

      if (ringbaApiKey) {
        headers["Authorization"] = `Token ${ringbaApiKey}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000)

      const response = await fetch(recordingUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
        redirect: "follow",
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        const contentType = response.headers.get("content-type") || "audio/wav"
        console.log(`✅ Success with User-Agent: ${userAgent}`)
        return { audioBuffer, contentType }
      }
    } catch (error) {
      console.log(`❌ Failed with User-Agent: ${userAgent}`)
      continue
    }
  }

  throw new Error("All alternative header approaches failed")
}

// Enhanced Deepgram API call
async function callDeepgramAPIWithPythonConfig(audioBuffer: ArrayBuffer, contentType: string, apiKey: string) {
  const baseUrl = "https://api.deepgram.com/v1/listen"

  const headers = {
    Authorization: `Token ${apiKey}`,
    "Content-Type": contentType || "audio/*",
  }

  const params: Record<string, string> = {
    model: "nova-2",
    language: "en-US",
    smart_format: "true",
    punctuate: "true",
    diarize: "true",
    utterances: "true",
    paragraphs: "true",
    sentiment: "true",
    filler_words: "true",
    alternatives: "1",
    topics: "true",
    intents: "true",
    summarize: "v2",
  }

  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  const fullUrl = `${baseUrl}?${queryString}`

  console.log("🐍 Making enhanced Deepgram request for RingBA recording")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minute timeout

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: headers,
      body: audioBuffer,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorText = "Unknown error"
      try {
        errorText = await response.text()
      } catch (e) {
        console.error("Failed to read error response:", e)
      }

      const error = new Error(`Deepgram API error: ${response.status} - ${errorText}`)
      ;(error as any).status = response.status
      throw error
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    clearTimeout(timeoutId)
    throw error
  }
}

function extractTranscript(deepgramResult: any): string | null {
  try {
    const channels = deepgramResult?.results?.channels
    if (!channels || channels.length === 0) {
      return null
    }

    const alternatives = channels[0]?.alternatives
    if (!alternatives || alternatives.length === 0) {
      return null
    }

    const transcript = alternatives[0]?.transcript
    if (!transcript || transcript.trim().length === 0) {
      return null
    }

    return transcript.trim()
  } catch (error) {
    console.error("❌ Error extracting transcript:", error)
    return null
  }
}

function calculateDuration(deepgramResult: any, fileSize: number): number {
  try {
    if (deepgramResult?.metadata?.duration) {
      return Math.round(deepgramResult.metadata.duration)
    }

    const words = deepgramResult?.results?.channels?.[0]?.alternatives?.[0]?.words
    if (words && words.length > 0) {
      const lastWord = words[words.length - 1]
      if (lastWord?.end) {
        return Math.round(lastWord.end)
      }
    }

    return Math.round(fileSize / 16000)
  } catch (error) {
    console.error("❌ Error calculating duration:", error)
    return 0
  }
}

async function performEnhancedCallAnalysis(transcript: string, deepgramResult: any, file: any) {
  // Enhanced analysis for RingBA recordings with comprehensive data extraction
  const wordCount = transcript.split(/\s+/).length
  const duration = calculateDuration(deepgramResult, file.size)

  // Calculate speaking rate
  const speakingRate = duration > 0 ? wordCount / (duration / 60) : 0

  // Enhanced sentiment analysis
  const positiveWords = [
    "great",
    "excellent",
    "good",
    "happy",
    "satisfied",
    "yes",
    "sure",
    "absolutely",
    "perfect",
    "wonderful",
    "amazing",
    "fantastic",
    "love",
    "appreciate",
    "thank",
  ]
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "no",
    "never",
    "hate",
    "angry",
    "frustrated",
    "disappointed",
    "upset",
    "problem",
    "issue",
    "wrong",
    "horrible",
    "worst",
  ]

  const lowerTranscript = transcript.toLowerCase()
  const positiveCount = positiveWords.filter((word) => lowerTranscript.includes(word)).length
  const negativeCount = negativeWords.filter((word) => lowerTranscript.includes(word)).length

  // Extract topics from Deepgram results
  const topics = deepgramResult?.results?.channels?.[0]?.alternatives?.[0]?.topics || []

  // Extract intents from Deepgram results
  const intents = deepgramResult?.results?.channels?.[0]?.alternatives?.[0]?.intents || []

  // Extract summary from Deepgram results
  const deepgramSummary = deepgramResult?.results?.summary?.short || ""

  // Calculate enhanced scores
  const communicationSkills = Math.min(10, 5 + (speakingRate > 100 && speakingRate < 200 ? 3 : 1) + positiveCount)
  const problemSolving = Math.min(
    10,
    5 + (transcript.includes("solution") || transcript.includes("help") ? 2 : 0) + positiveCount,
  )
  const productKnowledge = Math.min(
    10,
    5 + (wordCount > 100 ? 2 : 1) + (transcript.includes("product") || transcript.includes("service") ? 1 : 0),
  )
  const customerService = Math.min(10, 5 + positiveCount - negativeCount + (transcript.includes("thank") ? 1 : 0))

  const basicScores = {
    communicationSkills,
    problemSolving,
    productKnowledge,
    customerService,
  }

  const overallScore =
    (basicScores.communicationSkills +
      basicScores.problemSolving +
      basicScores.productKnowledge +
      basicScores.customerService) /
    4

  let overallRating: "GOOD" | "BAD" | "UGLY"
  if (overallScore > 7.4) {
    overallRating = "GOOD"
  } else if (overallScore >= 5.1) {
    overallRating = "BAD"
  } else {
    overallRating = "UGLY"
  }

  // Detect potential conversion indicators
  const conversionKeywords = [
    "sale",
    "purchase",
    "buy",
    "order",
    "payment",
    "credit card",
    "checkout",
    "confirm",
    "agreement",
    "contract",
    "deal",
    "price",
    "cost",
  ]
  const conversionAchieved = conversionKeywords.some((keyword) => lowerTranscript.includes(keyword))

  // Extract key facts from transcript
  const facts = extractKeyFacts(transcript)

  // Determine call intent and disposition
  const callIntent = determineCallIntent(transcript, intents)
  const disposition = determineDisposition(transcript, conversionAchieved)

  return {
    overallRating,
    overallScore: Math.round(overallScore * 10) / 10,
    agentPerformance: basicScores,

    // Enhanced analysis data
    callIntent,
    disposition,
    aiSummary: deepgramSummary || generateAISummary(transcript, duration, conversionAchieved),
    topicsCovered: extractTopicsCovered(topics, transcript),
    keyTakeaways: generateKeyTakeaways(transcript, positiveCount, negativeCount, conversionAchieved),
    callConclusion: generateCallConclusion(overallRating, conversionAchieved, transcript),
    callDetails: {
      duration,
      wordCount,
      speakingRate: Math.round(speakingRate),
      audioQuality: deepgramResult?.metadata?.model_info?.name || "Unknown",
      processingTime: new Date().toISOString(),
    },
    sentimentAnalysis: {
      overall: positiveCount > negativeCount ? "Positive" : negativeCount > positiveCount ? "Negative" : "Neutral",
      confidence: Math.min(95, 50 + Math.abs(positiveCount - negativeCount) * 10),
      positiveIndicators: positiveCount,
      negativeIndicators: negativeCount,
      agentSentiment: analyzeAgentSentiment(transcript),
      customerSentiment: analyzeCustomerSentiment(transcript),
    },
    facts,
    callMetadata: {
      transcriptionProvider: "Deepgram Nova-2",
      audioFormat: file.contentType || "Unknown",
      fileSize: file.size,
      processingFeatures: ["diarization", "sentiment", "topics", "intents", "summarization"],
      confidence: deepgramResult?.metadata?.model_info?.version || "Unknown",
    },

    // Original fields
    summary: `RingBA call analyzed: ${wordCount} words in ${duration}s. Speaking rate: ${Math.round(speakingRate)} WPM. ${conversionAchieved ? "Potential conversion detected." : "No clear conversion indicators."}`,
    keyInsights: [
      `Call duration: ${duration} seconds`,
      `Word count: ${wordCount} words`,
      `Speaking rate: ${Math.round(speakingRate)} words per minute`,
      `Sentiment: ${positiveCount > negativeCount ? "Positive" : negativeCount > positiveCount ? "Negative" : "Neutral"}`,
      conversionAchieved ? "🎯 Conversion indicators detected" : "ℹ️ No clear conversion signals",
    ],
    callDuration: duration,
    businessConversion: {
      conversionAchieved,
      conversionType: conversionAchieved ? "Sale/Purchase" : "Unknown",
      conversionConfidence: conversionAchieved ? 75 : 25,
    },
    source: "ringba-recording",
    transcribedAt: new Date().toISOString(),
    speakingRate: Math.round(speakingRate),
    wordCount,
  }
}

// Helper functions for enhanced analysis
function extractKeyFacts(transcript: string): string[] {
  const facts: string[] = []
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10)

  // Look for factual statements
  sentences.forEach((sentence) => {
    const trimmed = sentence.trim()
    if (trimmed.includes("$") || trimmed.includes("price") || trimmed.includes("cost")) {
      facts.push(`💰 ${trimmed}`)
    } else if (trimmed.includes("phone") || trimmed.includes("email") || trimmed.includes("address")) {
      facts.push(`📞 ${trimmed}`)
    } else if (trimmed.includes("name") || trimmed.includes("company")) {
      facts.push(`🏢 ${trimmed}`)
    }
  })

  return facts.slice(0, 5) // Limit to top 5 facts
}

function determineCallIntent(transcript: string, intents: any[]): string {
  if (intents && intents.length > 0) {
    return intents[0].intent || "General Inquiry"
  }

  const lowerTranscript = transcript.toLowerCase()
  if (lowerTranscript.includes("buy") || lowerTranscript.includes("purchase")) {
    return "Purchase Intent"
  } else if (lowerTranscript.includes("information") || lowerTranscript.includes("learn")) {
    return "Information Seeking"
  } else if (lowerTranscript.includes("problem") || lowerTranscript.includes("issue")) {
    return "Support Request"
  } else if (lowerTranscript.includes("quote") || lowerTranscript.includes("price")) {
    return "Pricing Inquiry"
  }

  return "General Inquiry"
}

function determineDisposition(transcript: string, conversionAchieved: boolean): string {
  if (conversionAchieved) {
    return "Sale/Conversion"
  }

  const lowerTranscript = transcript.toLowerCase()
  if (lowerTranscript.includes("interested") || lowerTranscript.includes("follow up")) {
    return "Interested - Follow Up"
  } else if (lowerTranscript.includes("not interested") || lowerTranscript.includes("no thank")) {
    return "Not Interested"
  } else if (lowerTranscript.includes("think about") || lowerTranscript.includes("consider")) {
    return "Considering"
  }

  return "Information Provided"
}

function generateAISummary(transcript: string, duration: number, conversionAchieved: boolean): string {
  const wordCount = transcript.split(/\s+/).length
  const avgWordsPerMinute = Math.round(wordCount / (duration / 60))

  return `This ${Math.round(duration / 60)} minute call involved ${wordCount} words at an average pace of ${avgWordsPerMinute} words per minute. ${conversionAchieved ? "The conversation resulted in a potential conversion with clear buying signals detected." : "The call was informational in nature without clear conversion indicators."} The overall tone was professional and the customer engagement level appeared moderate to high based on conversation flow.`
}

function extractTopicsCovered(
  topics: any[],
  transcript: string,
): Array<{ topic: string; timeSpent: number; keyPoints: string[] }> {
  const topicsCovered: Array<{ topic: string; timeSpent: number; keyPoints: string[] }> = []

  if (topics && topics.length > 0) {
    topics.forEach((topic: any) => {
      topicsCovered.push({
        topic: topic.topic || "Unknown Topic",
        timeSpent: topic.confidence || 0,
        keyPoints: [topic.text || "No details available"],
      })
    })
  } else {
    // Fallback topic extraction
    const lowerTranscript = transcript.toLowerCase()
    if (lowerTranscript.includes("price") || lowerTranscript.includes("cost")) {
      topicsCovered.push({
        topic: "Pricing Discussion",
        timeSpent: 30,
        keyPoints: ["Pricing information discussed", "Cost considerations mentioned"],
      })
    }
    if (lowerTranscript.includes("product") || lowerTranscript.includes("service")) {
      topicsCovered.push({
        topic: "Product/Service Information",
        timeSpent: 45,
        keyPoints: ["Product features discussed", "Service benefits explained"],
      })
    }
  }

  return topicsCovered
}

function generateKeyTakeaways(
  transcript: string,
  positiveCount: number,
  negativeCount: number,
  conversionAchieved: boolean,
): Array<{ category: string; takeaway: string }> {
  const takeaways: Array<{ category: string; takeaway: string }> = []

  if (positiveCount > negativeCount) {
    takeaways.push({
      category: "Positive",
      takeaway: "Customer expressed positive sentiment throughout the conversation",
    })
  }

  if (conversionAchieved) {
    takeaways.push({
      category: "Opportunity",
      takeaway: "Strong conversion potential identified with clear buying signals",
    })
  } else {
    takeaways.push({
      category: "Opportunity",
      takeaway: "Follow-up opportunity exists to nurture this lead further",
    })
  }

  if (negativeCount > 2) {
    takeaways.push({
      category: "Concern",
      takeaway: "Some resistance or concerns were expressed that need addressing",
    })
  }

  takeaways.push({
    category: "Action Required",
    takeaway: "Schedule follow-up contact within 24-48 hours to maintain momentum",
  })

  return takeaways
}

function generateCallConclusion(overallRating: string, conversionAchieved: boolean, transcript: string): string {
  if (overallRating === "GOOD" && conversionAchieved) {
    return "Excellent call outcome with successful conversion achieved. Agent performed well and customer was highly engaged."
  } else if (overallRating === "GOOD") {
    return "Positive call outcome with good customer engagement. Strong foundation laid for future conversion."
  } else if (conversionAchieved) {
    return "Conversion achieved despite some challenges in the conversation flow. Good recovery and closing techniques."
  } else {
    return "Call completed with mixed results. Opportunities exist for improvement in engagement and conversion techniques."
  }
}

function analyzeAgentSentiment(transcript: string): string {
  // Simple agent sentiment analysis - in real implementation, this would use speaker diarization
  const agentWords = ["help", "assist", "provide", "offer", "service", "support"]
  const agentWordCount = agentWords.filter((word) => transcript.toLowerCase().includes(word)).length

  return agentWordCount > 2 ? "Professional" : "Neutral"
}

function analyzeCustomerSentiment(transcript: string): string {
  // Simple customer sentiment analysis - in real implementation, this would use speaker diarization
  const positiveCustomerWords = ["interested", "good", "yes", "okay", "sure", "sounds good"]
  const negativeCustomerWords = ["no", "not interested", "busy", "not now", "maybe later"]

  const positiveCount = positiveCustomerWords.filter((word) => transcript.toLowerCase().includes(word)).length
  const negativeCount = negativeCustomerWords.filter((word) => transcript.toLowerCase().includes(word)).length

  if (positiveCount > negativeCount) return "Positive"
  if (negativeCount > positiveCount) return "Negative"
  return "Neutral"
}

// Helper functions for OpenRouter analysis transformation
function extractTopicsFromOpenRouter(analysis: any) {
  const topics = []

  // Extract topics from facts and business analysis
  if (analysis.factsAnalysis.productsMentioned.length > 0) {
    topics.push({
      topic: "Products & Services",
      importance: "High" as const,
      timeSpent: "2:30",
      keyPoints: analysis.factsAnalysis.productsMentioned.slice(0, 3),
    })
  }

  if (analysis.factsAnalysis.pricesDiscussed.length > 0) {
    topics.push({
      topic: "Pricing Discussion",
      importance: "High" as const,
      timeSpent: "1:45",
      keyPoints: analysis.factsAnalysis.pricesDiscussed.slice(0, 3),
    })
  }

  if (analysis.factsAnalysis.objections.length > 0) {
    topics.push({
      topic: "Customer Concerns",
      importance: "Medium" as const,
      timeSpent: "1:15",
      keyPoints: analysis.factsAnalysis.objections.slice(0, 3),
    })
  }

  if (analysis.factsAnalysis.technicalDetails.length > 0) {
    topics.push({
      topic: "Technical Requirements",
      importance: "Medium" as const,
      timeSpent: "1:00",
      keyPoints: analysis.factsAnalysis.technicalDetails.slice(0, 3),
    })
  }

  if (analysis.factsAnalysis.businessRequirements.length > 0) {
    topics.push({
      topic: "Business Requirements",
      importance: "High" as const,
      timeSpent: "2:00",
      keyPoints: analysis.factsAnalysis.businessRequirements.slice(0, 3),
    })
  }

  // If no specific topics found, create general ones
  if (topics.length === 0) {
    topics.push({
      topic: analysis.intentAnalysis.primaryIntent || "General Discussion",
      importance: "High" as const,
      timeSpent: "3:00",
      keyPoints: [
        analysis.intentAnalysis.reasoning || "Customer inquiry handled",
        analysis.dispositionAnalysis.reasoning || "Professional interaction",
        "Call completed successfully",
      ],
    })
  }

  return topics
}

function extractTakeawaysFromOpenRouter(analysis: any) {
  const takeaways = []

  // Positive takeaways from buying signals
  if (analysis.businessAnalysis.buyingSignals.length > 0) {
    takeaways.push({
      category: "Positive" as const,
      takeaway: analysis.businessAnalysis.buyingSignals[0] || "Customer showed interest",
      impact: "High" as const,
    })
  }

  // Opportunity takeaways from business analysis
  if (analysis.businessAnalysis.nextBestActions.length > 0) {
    takeaways.push({
      category: "Opportunity" as const,
      takeaway: analysis.businessAnalysis.nextBestActions[0] || "Follow-up opportunity identified",
      impact: analysis.businessAnalysis.conversionPotential > 70 ? ("High" as const) : ("Medium" as const),
    })
  }

  // Concern takeaways from risk factors
  if (analysis.businessAnalysis.riskFactors.length > 0) {
    takeaways.push({
      category: "Concern" as const,
      takeaway: analysis.businessAnalysis.riskFactors[0] || "Potential obstacles identified",
      impact: "Medium" as const,
    })
  }

  // Action required from disposition
  if (analysis.dispositionAnalysis.followUpRequired) {
    takeaways.push({
      category: "Action Required" as const,
      takeaway: analysis.dispositionAnalysis.nextSteps[0] || "Follow-up required",
      impact: "High" as const,
    })
  }

  // Quality improvement takeaways
  if (analysis.qualityAnalysis.improvementAreas.length > 0) {
    takeaways.push({
      category: "Improvement" as const,
      takeaway: analysis.qualityAnalysis.improvementAreas[0] || "Training opportunity identified",
      impact: "Medium" as const,
    })
  }

  // Ensure we have at least some takeaways
  if (takeaways.length === 0) {
    takeaways.push({
      category: "Positive" as const,
      takeaway: "Call completed successfully with professional interaction",
      impact: "Medium" as const,
    })
  }

  return takeaways
}

function generateCallConclusionFromOpenRouter(analysis: any) {
  const quality = analysis.qualityAnalysis.overallScore
  const conversion = analysis.businessAnalysis.conversionPotential
  const sentiment = analysis.sentimentAnalysis.overallSentiment

  if (quality > 80 && conversion > 70 && sentiment === "Positive") {
    return "Excellent call outcome with high conversion potential and positive customer experience. Agent performed exceptionally well."
  } else if (quality > 60 && conversion > 50) {
    return "Good call outcome with solid performance. Customer engagement was positive with clear next steps identified."
  } else if (quality > 40) {
    return "Satisfactory call with room for improvement. Customer needs were addressed but follow-up is recommended."
  } else {
    return "Call completed with mixed results. Coaching opportunities identified for improved customer experience."
  }
}
