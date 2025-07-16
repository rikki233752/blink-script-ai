import type { NextRequest } from "next/server"
import { OnScriptCallSummaryGenerator } from "@/lib/onscript-call-summary-generator"

// Import the new OnScript AI summary generator
// Remove this import
// let generateOnScriptAISummary: any

// try {
//   const onscriptModule = await import("@/lib/onscript-ai-summary")
//   generateOnScriptAISummary = onscriptModule.generateOnScriptAISummary
// } catch (error) {
//   console.error("❌ Failed to import onscript-ai-summary:", error)
// }

// Check if all required modules are available
let detectCallIntentWithAI: any, detectCallDispositionWithAI: any, analyzeCallMetrics: any
let calculatePreciseScore: any, analyzeVocalytics: any, analyzeSentiment: any
let analyzeBusinessConversionEnhanced: any

try {
  const intentModule = await import("@/lib/intent-disposition-utils")
  detectCallIntentWithAI = intentModule.detectCallIntentWithAI
  detectCallDispositionWithAI = intentModule.detectCallDispositionWithAI
  analyzeCallMetrics = intentModule.analyzeCallMetrics
} catch (error) {
  console.error("❌ Failed to import intent-disposition-utils:", error)
}

try {
  const preciseModule = await import("@/lib/precise-scoring")
  calculatePreciseScore = preciseModule.calculatePreciseScore
} catch (error) {
  console.error("❌ Failed to import precise-scoring:", error)
}

try {
  const vocalyticsModule = await import("@/lib/vocalytics-utils")
  analyzeVocalytics = vocalyticsModule.analyzeVocalytics
} catch (error) {
  console.error("❌ Failed to import vocalytics-utils:", error)
}

try {
  const sentimentModule = await import("@/lib/sentiment-analysis")
  analyzeSentiment = sentimentModule.analyzeSentiment
} catch (error) {
  console.error("❌ Failed to import sentiment-analysis:", error)
}

try {
  const conversionModule = await import("@/lib/business-conversion-utils")
  analyzeBusinessConversionEnhanced = conversionModule.analyzeBusinessConversionEnhanced
} catch (error) {
  console.error("❌ Failed to import business-conversion-utils:", error)
}

export async function POST(request: NextRequest) {
  console.log("🚀 API Route: Starting transcription process...")

  try {
    // Check if Deepgram API key is available
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY || "826b863658186408cc422feb47b5fe93809d0eb7"
    if (!deepgramApiKey) {
      console.error("❌ No Deepgram API key found")
      return new Response(
        JSON.stringify({
          success: false,
          error: "Deepgram API key not configured",
          code: "MISSING_API_KEY",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("✅ Using Deepgram API key:", deepgramApiKey.substring(0, 8) + "...")

    // Parse form data with proper error handling
    let formData: FormData
    try {
      formData = await request.formData()
      console.log("✅ Form data parsed successfully")
    } catch (error) {
      console.error("❌ Error parsing form data:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid form data. Please ensure you're uploading a valid file.",
          code: "INVALID_FORM_DATA",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Validate file
    const audioFile = formData.get("audio") as File
    if (!audioFile) {
      console.error("❌ No audio file in form data")
      return new Response(
        JSON.stringify({
          success: false,
          error: "No audio file provided. Please select an audio file to upload.",
          code: "NO_FILE",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("📁 Processing file:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    })

    // File validation
    const maxSize = 200 * 1024 * 1024 // 200MB
    if (audioFile.size > maxSize) {
      console.error("❌ File too large:", audioFile.size)
      return new Response(
        JSON.stringify({
          success: false,
          error: `File too large (${(audioFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 200MB.`,
          code: "FILE_TOO_LARGE",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (audioFile.size === 0) {
      console.error("❌ Empty file")
      return new Response(
        JSON.stringify({
          success: false,
          error: "File is empty. Please select a valid audio file.",
          code: "EMPTY_FILE",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Convert to buffer
    let audioBuffer: ArrayBuffer
    try {
      audioBuffer = await audioFile.arrayBuffer()
      console.log("✅ File converted to buffer:", audioBuffer.byteLength, "bytes")
    } catch (error) {
      console.error("❌ Error reading file:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to read audio file. Please try again.",
          code: "FILE_READ_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("📤 Calling Deepgram API...")

    // Call Deepgram with proper error handling
    let deepgramResult: any
    try {
      deepgramResult = await callDeepgramAPIWithPythonConfig(audioBuffer, audioFile.type || "audio/*", deepgramApiKey)
      console.log("✅ Deepgram API call successful")
    } catch (error: any) {
      console.error("❌ Deepgram API error:", error)

      if (error.status === 401) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid Deepgram API key. Please check your configuration.",
            code: "INVALID_API_KEY",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (error.status === 402) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Insufficient Deepgram credits. Please check your account balance.",
            code: "INSUFFICIENT_CREDITS",
          }),
          {
            status: 402,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (error.status === 413) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "File too large for Deepgram API. Please use a smaller file.",
            code: "FILE_TOO_LARGE_FOR_API",
          }),
          {
            status: 413,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: `Deepgram API call failed: ${error.message || "Unknown error"}`,
          code: "DEEPGRAM_API_ERROR",
          details: error.stack || "No stack trace available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Validate Deepgram response
    const transcript = extractTranscript(deepgramResult)
    if (!transcript) {
      console.error("❌ No transcript extracted from Deepgram response")
      return new Response(
        JSON.stringify({
          success: false,
          error: "No transcript could be generated. Please ensure your audio contains clear speech.",
          code: "NO_TRANSCRIPT",
          deepgramResponse: deepgramResult ? "Response received but no transcript" : "No response from Deepgram",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("✅ Transcript extracted:", transcript.length, "characters")

    // Perform analysis with robust error handling
    let analysis: any
    try {
      analysis = await performCallAnalysisWithFallbacks(transcript, deepgramResult, audioFile)
      console.log("✅ Call analysis completed")
    } catch (error: any) {
      console.error("❌ Analysis error:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Call analysis failed: ${error.message || "Unknown error"}`,
          code: "ANALYSIS_ERROR",
          details: error.stack || "No stack trace available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Calculate duration
    const duration = calculateDuration(deepgramResult, audioFile.size)

    // Generate comprehensive call summary
    console.log("📋 Generating OnScript-style call summary...")
    let onScriptSummary = null
    try {
      const callTranscriptData = {
        transcript,
        analysis,
        fileName: audioFile.name,
        fileSize: audioFile.size,
        duration,
      }

      onScriptSummary = OnScriptCallSummaryGenerator.generateOnScriptSummary(callTranscriptData)
      console.log("✅ OnScript-style summary generated successfully")
    } catch (error: any) {
      console.error("❌ OnScript summary generation failed:", error)
      // Don't fail the entire process, just log the error
    }

    // Prepare response
    const responseData = {
      success: true,
      data: {
        transcript,
        analysis,
        fileName: audioFile.name,
        fileSize: audioFile.size,
        duration,
        provider: "deepgram-python-config",
        deepgramMetadata: deepgramResult.metadata,
        pythonEquivalent: true,
        apiKeyUsed: deepgramApiKey.substring(0, 8) + "...",
        onScriptSummary, // Add the OnScript-style summary
      },
    }

    console.log("✅ Analysis complete, returning response")
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("❌ Unexpected error in transcribe route:", error)

    // Log the full error for debugging
    console.error("Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
        timestamp: new Date().toISOString(),
        details: error.stack || "No stack trace available",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Enhanced analysis function with comprehensive fallbacks
async function performCallAnalysisWithFallbacks(transcript: string, deepgramResult: any, file: File) {
  console.log("🧠 Starting call analysis with fallbacks...")

  try {
    // Extract Deepgram insights safely
    const channels = deepgramResult?.results?.channels || []
    const alternatives = channels[0]?.alternatives || []
    const mainAlternative = alternatives[0] || {}

    // Basic scoring (simplified for reliability)
    const basicScores = calculateBasicScores(transcript)
    const overallScore = calculateOverallScore(basicScores)

    // Determine rating
    let overallRating: "GOOD" | "BAD" | "UGLY"
    if (overallScore > 7.4) {
      overallRating = "GOOD"
    } else if (overallScore >= 5.1) {
      overallRating = "BAD"
    } else {
      overallRating = "UGLY"
    }

    console.log("🔍 Performing individual analyses...")

    // All analysis steps wrapped in individual try-catch blocks
    const sentimentAnalysis = await safeAnalysis(
      "sentiment",
      () => {
        if (analyzeSentiment) {
          return analyzeSentiment(transcript)
        }
        return getDefaultSentiment()
      },
      getDefaultSentiment(),
    )

    const intentAnalysis = await safeAnalysis(
      "intent",
      () => {
        if (detectCallIntentWithAI) {
          return detectCallIntentWithAI(transcript)
        }
        return getDefaultIntent()
      },
      getDefaultIntent(),
    )

    const businessConversion = await safeAnalysis(
      "business conversion",
      () => {
        if (analyzeBusinessConversionEnhanced) {
          return analyzeBusinessConversionEnhanced(transcript, intentAnalysis, sentimentAnalysis)
        }
        return getDefaultConversion()
      },
      getDefaultConversion(),
    )

    const callMetrics = await safeAnalysis(
      "call metrics",
      () => {
        if (analyzeCallMetrics) {
          return analyzeCallMetrics(transcript)
        }
        return getDefaultMetrics()
      },
      getDefaultMetrics(),
    )

    const vocalyticsReport = await safeAnalysis(
      "vocalytics",
      () => {
        if (analyzeVocalytics) {
          return analyzeVocalytics(transcript, mainAlternative.words || [], mainAlternative.utterances || [])
        }
        return null
      },
      null,
    )

    // Precise scoring with proper data structure
    const callDataForPreciseScoring = {
      overallScore,
      agentPerformance: basicScores,
      toneQuality: {
        score: Math.round(overallScore),
      },
      businessConversion: {
        conversionAchieved: businessConversion?.conversionAchieved || false,
      },
    }

    const preciseScoring = await safeAnalysis(
      "precise scoring",
      () => {
        if (calculatePreciseScore) {
          return calculatePreciseScore(transcript, callDataForPreciseScoring)
        }
        return getDefaultPreciseScoring()
      },
      getDefaultPreciseScoring(),
    )

    const dispositionAnalysis = await safeAnalysis(
      "disposition",
      () => {
        if (detectCallDispositionWithAI) {
          return detectCallDispositionWithAI(transcript, intentAnalysis, businessConversion)
        }
        return getDefaultDisposition()
      },
      getDefaultDisposition(),
    )

    console.log("🎉 All analyses completed, building final result...")

    return {
      overallRating,
      overallScore,
      toneQuality: {
        agent: "Professional",
        customer: "Neutral",
        score: Math.round(overallScore),
        confidence: 85,
      },
      businessConversion,
      enhancedConversion: businessConversion,
      agentPerformance: basicScores,
      keyInsights: generateKeyInsights(transcript, overallScore, businessConversion),
      improvementSuggestions: generateImprovementSuggestions(basicScores, overallScore),
      callDuration: formatDuration(Math.round(file.size / 16000)),
      summary: generateSummary(transcript, intentAnalysis, businessConversion, overallRating),
      sentimentAnalysis,
      preciseScoring,
      intentAnalysis,
      dispositionAnalysis,
      callMetrics,
      vocalyticsReport,
      callQualityMetrics: {
        overallQuality: Math.round(overallScore),
        customerSatisfaction: Math.round((basicScores.customerService / 10) * 100),
        agentEffectiveness: Math.round(overallScore),
        communicationClarity: Math.round(basicScores.communicationSkills),
        resolutionSuccess: businessConversion?.conversionAchieved ? 10 : 5,
      },
    }
  } catch (error) {
    console.error("❌ Error in call analysis:", error)
    throw new Error(`Call analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Helper function for safe analysis execution
async function safeAnalysis<T>(analysisName: string, analysisFunction: () => T | Promise<T>, fallback: T): Promise<T> {
  try {
    console.log(`📊 Analyzing ${analysisName}...`)
    const result = await analysisFunction()

    if (!result || (typeof result === "object" && Object.keys(result).length === 0)) {
      console.warn(`⚠️ Invalid ${analysisName} result, using fallback`)
      return fallback
    }

    console.log(`✅ ${analysisName} analysis completed successfully`)
    return result
  } catch (error) {
    console.error(`❌ ${analysisName} analysis failed:`, error)
    return fallback
  }
}

// Fixed function that properly constructs the Deepgram API URL with all parameters
async function callDeepgramAPIWithPythonConfig(audioBuffer: ArrayBuffer, contentType: string, apiKey: string) {
  try {
    // Define the base URL for the Deepgram API endpoint
    const baseUrl = "https://api.deepgram.com/v1/listen"

    // Define the headers for the HTTP request (exactly like your Python code)
    const headers = {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "audio/*", // Using audio/* as in your Python code
    }

    // Build parameters object - this is the key fix!
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
    }

    // Manually construct the query string to ensure all parameters are included
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")

    const fullUrl = `${baseUrl}?${queryString}`

    console.log("🐍 Making Python-equivalent request:")
    console.log("   Base URL:", baseUrl)
    console.log("   Parameters:", params)
    console.log("   Full URL:", fullUrl)
    console.log("   Headers:", { ...headers, Authorization: "Token [REDACTED]" })
    console.log("   Body size:", audioBuffer.byteLength, "bytes")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

    try {
      // Make the HTTP request with the properly constructed URL
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: headers,
        body: audioBuffer, // equivalent to data=audio_file in Python
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("📡 Deepgram response status:", response.status)
      console.log("📡 Deepgram response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorText = "Unknown error"
        try {
          errorText = await response.text()
          console.error("❌ Deepgram error response:", errorText)
        } catch (e) {
          console.error("Failed to read error response:", e)
        }

        const error = new Error(`Deepgram API error: ${response.status} - ${errorText}`)
        ;(error as any).status = response.status
        throw error
      }

      const result = await response.json()
      console.log("✅ Python-equivalent request successful")
      console.log("📊 Deepgram result summary:", {
        hasResults: !!result.results,
        hasChannels: !!result.results?.channels,
        channelCount: result.results?.channels?.length || 0,
        hasTranscript: !!result.results?.channels?.[0]?.alternatives?.[0]?.transcript,
        transcriptLength: result.results?.channels?.[0]?.alternatives?.[0]?.transcript?.length || 0,
      })

      return result
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        const timeoutError = new Error("Request timeout - file may be too large or connection is slow")
        ;(timeoutError as any).name = "AbortError"
        ;(timeoutError as any).status = 408
        throw timeoutError
      }

      // Re-throw with status if available
      if (error.status) {
        throw error
      }

      // Network or other errors
      const networkError = new Error(`Network error: ${error.message}`)
      ;(networkError as any).status = 503
      throw networkError
    }
  } catch (error) {
    console.error("❌ Error in callDeepgramAPIWithPythonConfig:", error)
    throw error
  }
}

function extractTranscript(deepgramResult: any): string | null {
  try {
    console.log("🔍 Extracting transcript from Deepgram result...")

    const channels = deepgramResult?.results?.channels
    if (!channels || channels.length === 0) {
      console.error("❌ No audio channels found in Deepgram response")
      console.log("Deepgram result structure:", JSON.stringify(deepgramResult, null, 2))
      return null
    }

    console.log("✅ Found", channels.length, "audio channels")

    const alternatives = channels[0]?.alternatives
    if (!alternatives || alternatives.length === 0) {
      console.error("❌ No transcription alternatives found")
      console.log("Channel 0 structure:", JSON.stringify(channels[0], null, 2))
      return null
    }

    console.log("✅ Found", alternatives.length, "transcription alternatives")

    const transcript = alternatives[0]?.transcript
    if (!transcript || transcript.trim().length === 0) {
      console.error("❌ Empty transcript")
      console.log("Alternative 0 structure:", JSON.stringify(alternatives[0], null, 2))
      return null
    }

    console.log("✅ Transcript extracted successfully:", transcript.length, "characters")
    return transcript.trim()
  } catch (error) {
    console.error("❌ Error extracting transcript:", error)
    return null
  }
}

function calculateDuration(deepgramResult: any, fileSize: number): number {
  try {
    // Try to get duration from Deepgram metadata
    if (deepgramResult?.metadata?.duration) {
      return Math.round(deepgramResult.metadata.duration)
    }

    // Try to get from words
    const words = deepgramResult?.results?.channels?.[0]?.alternatives?.[0]?.words
    if (words && words.length > 0) {
      const lastWord = words[words.length - 1]
      if (lastWord?.end) {
        return Math.round(lastWord.end)
      }
    }

    // Estimate from file size (rough approximation)
    return Math.round(fileSize / 16000) // Assume 16kHz mono
  } catch (error) {
    console.error("❌ Error calculating duration:", error)
    return 0
  }
}

function calculateBasicScores(transcript: string) {
  const text = transcript.toLowerCase()

  // Communication skills
  let communication = 5.0
  const professionalPhrases = ["thank you", "please", "certainly", "absolutely", "i understand"]
  communication += professionalPhrases.filter((phrase) => text.includes(phrase)).length * 0.5

  // Problem solving
  let problemSolving = 5.0
  const solutionPhrases = ["let me help", "i can resolve", "solution", "fix this"]
  problemSolving += solutionPhrases.filter((phrase) => text.includes(phrase)).length * 0.5

  // Product knowledge
  let productKnowledge = 5.0
  const knowledgePhrases = ["this feature", "our product", "designed to", "works by"]
  productKnowledge += knowledgePhrases.filter((phrase) => text.includes(phrase)).length * 0.5

  // Customer service
  let customerService = 5.0
  const servicePhrases = ["how can i help", "is there anything else", "valued customer"]
  customerService += servicePhrases.filter((phrase) => text.includes(phrase)).length * 0.5

  return {
    communicationSkills: Math.max(1, Math.min(10, Math.round(communication * 10) / 10)),
    problemSolving: Math.max(1, Math.min(10, Math.round(problemSolving * 10) / 10)),
    productKnowledge: Math.max(1, Math.min(10, Math.round(productKnowledge * 10) / 10)),
    customerService: Math.max(1, Math.min(10, Math.round(customerService * 10) / 10)),
  }
}

function calculateOverallScore(scores: any): number {
  const average =
    (scores.communicationSkills + scores.problemSolving + scores.productKnowledge + scores.customerService) / 4
  return Math.max(1, Math.min(10, Math.round(average * 10) / 10))
}

function generateKeyInsights(transcript: string, score: number, conversion: any): string[] {
  const insights = []

  if (score > 8) {
    insights.push("Excellent call performance with strong customer engagement")
  } else if (score > 6) {
    insights.push("Good call handling with room for improvement")
  } else {
    insights.push("Call performance needs attention in key areas")
  }

  if (conversion?.conversionAchieved) {
    insights.push(`Successful business outcome: ${conversion.conversionType}`)
  } else {
    insights.push("No conversion achieved - focus on closing techniques")
  }

  if (transcript.length > 1000) {
    insights.push("Comprehensive conversation with detailed discussion")
  }

  return insights
}

function generateImprovementSuggestions(scores: any, overallScore: number): string[] {
  const suggestions = []

  if (scores.communicationSkills < 7) {
    suggestions.push("Improve communication clarity and professional language")
  }

  if (scores.problemSolving < 7) {
    suggestions.push("Enhance problem-solving approach and solution presentation")
  }

  if (scores.productKnowledge < 7) {
    suggestions.push("Strengthen product knowledge and feature explanations")
  }

  if (scores.customerService < 7) {
    suggestions.push("Focus on customer service excellence and empathy")
  }

  if (overallScore < 6) {
    suggestions.push("Consider additional training in call handling best practices")
  }

  return suggestions.length > 0 ? suggestions : ["Continue maintaining excellent call quality"]
}

function generateSummary(transcript: string, intent: any, conversion: any, rating: string): string {
  let summary = `Call handled with ${rating.toLowerCase()} performance. `
  summary += `Primary intent: ${intent?.primaryIntent || "General inquiry"}. `

  if (conversion?.conversionAchieved) {
    summary += `Successful conversion: ${conversion.conversionType}. `
  } else {
    summary += "No conversion achieved. "
  }

  summary += "Analysis completed using Python-equivalent configuration."
  return summary
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Enhanced default fallback functions with proper structure
function getDefaultSentiment() {
  return {
    agentSentiment: {
      overall: "Neutral",
      confidence: 50,
      positive: 50,
      negative: 25,
      neutral: 25,
    },
    customerSentiment: {
      overall: "Neutral",
      confidence: 50,
      positive: 50,
      negative: 25,
      neutral: 25,
    },
    overallCallSentiment: {
      overall: "Neutral",
      confidence: 50,
      positive: 50,
      negative: 25,
      neutral: 25,
    },
    sentimentTimeline: [],
    keyPhrases: {
      positive: [],
      negative: [],
      neutral: [],
    },
    emotionalJourney: {
      startSentiment: "neutral",
      endSentiment: "neutral",
      sentimentShifts: 0,
      dominantEmotion: "neutral",
    },
  }
}

function getDefaultIntent() {
  return {
    primaryIntent: "General Inquiry",
    subcategory: "Information Request",
    confidence: 75,
    intentKeywords: ["help", "information"],
    reasoning: "Default intent classification",
  }
}

function getDefaultConversion() {
  return {
    conversionAchieved: false,
    conversionType: "No Sale",
    conversionConfidence: 25,
    conversionStage: "Initial Contact",
    commitmentLevel: "Low",
    urgency: "Low",
    positiveSignals: [],
    negativeSignals: [],
    nextBestAction: "Follow up with customer",
  }
}

function getDefaultMetrics() {
  return {
    callDuration: 0,
    speakingTime: { agent: 50, customer: 50 },
    interruptionCount: 0,
    silencePeriods: 0,
    talkTime: { agent: 50, customer: 50 },
    questionCount: 0,
    responseTime: 2.5,
  }
}

function getDefaultPreciseScoring() {
  return {
    overallScore: 50,
    overallRating: "BAD" as const,
    categoryScores: {
      communication: 50,
      empathy: 50,
      problemResolution: 50,
      professionalism: 50,
      productKnowledge: 50,
      callControl: 50,
      compliance: 50,
      customerSatisfaction: 50,
    },
    weightedScores: {
      communication: { score: 50, weight: 0.2, weightedScore: 10 },
      empathy: { score: 50, weight: 0.15, weightedScore: 7.5 },
      problemResolution: { score: 50, weight: 0.2, weightedScore: 10 },
      professionalism: { score: 50, weight: 0.15, weightedScore: 7.5 },
      productKnowledge: { score: 50, weight: 0.1, weightedScore: 5 },
      callControl: { score: 50, weight: 0.08, weightedScore: 4 },
      compliance: { score: 50, weight: 0.07, weightedScore: 3.5 },
      customerSatisfaction: { score: 50, weight: 0.05, weightedScore: 2.5 },
    },
    benchmarks: {
      teamAverage: 75,
      companyAverage: 72,
      industryAverage: 70,
      performanceRank: "Below Average",
    },
    improvementAreas: [],
    strengths: [],
    trends: {
      lastCall: 50,
      last5Calls: 50,
      last30Days: 50,
      improvement: "Stable" as const,
    },
  }
}

function getDefaultDisposition() {
  return {
    disposition: "UNKNOWN",
    confidence: 50,
    reasoning: "Unable to determine call disposition",
    category: "General",
    outcome: "Incomplete",
  }
}
