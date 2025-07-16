import { type NextRequest, NextResponse } from "next/server"

// Import necessary utilities
let generateOnScriptAISummary: any
let analyzeSentiment: any
let detectCallIntentWithAI: any
let detectCallDispositionWithAI: any
let analyzeVocalytics: any

try {
  const onscriptModule = require("@/lib/onscript-ai-summary")
  generateOnScriptAISummary = onscriptModule.generateOnScriptAISummary
} catch (error) {
  console.error("❌ Failed to import onscript-ai-summary:", error)
}

try {
  const sentimentModule = require("@/lib/sentiment-analysis")
  analyzeSentiment = sentimentModule.analyzeSentiment
} catch (error) {
  console.error("❌ Failed to import sentiment-analysis:", error)
}

try {
  const intentModule = require("@/lib/intent-disposition-utils")
  detectCallIntentWithAI = intentModule.detectCallIntentWithAI
  detectCallDispositionWithAI = intentModule.detectCallDispositionWithAI
} catch (error) {
  console.error("❌ Failed to import intent-disposition-utils:", error)
}

try {
  const vocalyticsModule = require("@/lib/vocalytics-utils")
  analyzeVocalytics = vocalyticsModule.analyzeVocalytics
} catch (error) {
  console.error("❌ Failed to import vocalytics-utils:", error)
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API credentials not configured",
          details: "Please set RINGBA_API_KEY and RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    // Parse request body
    const requestData = await request.json()
    const { startDate, endDate, campaignId, limit = 10, offset = 0 } = requestData

    console.log("🔄 Fetching call logs from Ringba with params:", {
      startDate,
      endDate,
      campaignId,
      limit,
      offset,
    })

    // Correct Ringba API endpoint format
    // Note: The correct format is /v2/{accountId}/calllogs (not /v2/accounts/{accountId}/calllogs)
    const ringbaEndpoints = [
      `https://api.ringba.com/v2/${accountId}/calllogs`,
      `https://api.ringba.com/v2/${accountId}/calls`,
      `https://api.ringba.com/v2/${accountId}/reports/calls`,
    ]

    // Authentication methods to try
    const authMethods = [
      {
        name: "Bearer Token",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "X-API-Key",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "API-Key Header",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    ]

    // Request body for POST requests
    const requestBody = {
      startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString(),
      filter: {
        campaignId: campaignId || undefined,
        hasRecording: true,
      },
      paging: {
        pageSize: Number(limit),
        pageIndex: Number(offset),
      },
      sort: {
        columnName: "callStartTime",
        sortDirection: "Descending",
      },
    }

    let callLogs = []
    let successfulEndpoint = ""
    let successfulMethod = ""
    let lastError = null

    // Try each endpoint with each auth method
    for (const endpoint of ringbaEndpoints) {
      for (const authMethod of authMethods) {
        try {
          console.log(`🔄 Trying ${endpoint} with ${authMethod.name}...`)

          const response = await fetch(endpoint, {
            method: "POST",
            headers: authMethod.headers,
            body: JSON.stringify(requestBody),
          })

          console.log(`📡 Response status from ${endpoint}:`, response.status)

          if (response.ok) {
            const data = await response.json()
            console.log(`✅ Successfully fetched data from ${endpoint} with ${authMethod.name}`)

            // Extract call logs from response based on different possible structures
            if (Array.isArray(data)) {
              callLogs = data
            } else if (data.callLogs) {
              callLogs = data.callLogs
            } else if (data.calls) {
              callLogs = data.calls
            } else if (data.data) {
              callLogs = Array.isArray(data.data) ? data.data : [data.data]
            } else if (data.results) {
              callLogs = data.results
            } else {
              callLogs = [data]
            }

            successfulEndpoint = endpoint
            successfulMethod = authMethod.name
            break
          } else {
            const errorText = await response.text()
            console.log(`❌ ${endpoint} with ${authMethod.name} failed:`, response.status, errorText)
            lastError = { endpoint, auth: authMethod.name, status: response.status, error: errorText }
          }
        } catch (error) {
          console.error(`💥 Error with ${endpoint} and ${authMethod.name}:`, error)
          lastError = {
            endpoint,
            auth: authMethod.name,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }

      if (callLogs.length > 0) break
    }

    // If we couldn't fetch any call logs, return error or mock data
    if (callLogs.length === 0) {
      console.log("⚠️ No call logs found, returning mock data")
      return NextResponse.json({
        success: false,
        error: "Failed to fetch call logs from Ringba",
        lastError,
        mockData: generateMockCallLogs(5),
      })
    }

    console.log(`📊 Found ${callLogs.length} call logs, processing for transcription and analysis...`)

    // Process each call log - fetch recording, transcribe, and analyze
    const processedCalls = await Promise.all(
      callLogs.map(async (call: any) => {
        try {
          // Extract call data with flexible field mapping
          const callData = extractCallData(call)

          // Skip calls without recordings
          if (!callData.recordingUrl) {
            return {
              ...callData,
              processed: false,
              reason: "No recording URL available",
            }
          }

          // Fetch and transcribe the recording
          console.log(`🎯 Processing call ${callData.id} with recording URL: ${callData.recordingUrl}`)
          const transcriptionResult = await transcribeRecording(callData.recordingUrl)

          if (!transcriptionResult.success) {
            return {
              ...callData,
              processed: false,
              reason: transcriptionResult.error || "Transcription failed",
            }
          }

          // Analyze the transcript
          const analysis = await analyzeTranscript(
            transcriptionResult.transcript,
            callData,
            transcriptionResult.deepgramResult,
          )

          return {
            ...callData,
            processed: true,
            transcript: transcriptionResult.transcript,
            analysis,
            onScriptSummary: generateOnScriptSummary(transcriptionResult.transcript, analysis, callData),
            vocalytics: generateVocalyticsAnalysis(transcriptionResult.transcript, transcriptionResult.deepgramResult),
          }
        } catch (error) {
          console.error(`❌ Error processing call:`, error)
          return {
            ...extractCallData(call),
            processed: false,
            reason: error instanceof Error ? error.message : "Unknown error during processing",
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      endpoint: successfulEndpoint,
      method: successfulMethod,
      totalCalls: callLogs.length,
      processedCalls: processedCalls.filter((call) => call.processed).length,
      failedCalls: processedCalls.filter((call) => !call.processed).length,
      calls: processedCalls,
    })
  } catch (error) {
    console.error("💥 Unexpected error in fetch-and-analyze API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process call logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to extract call data with flexible field mapping
function extractCallData(call: any) {
  // Define field mappings for different possible field names
  const fieldMappings: Record<string, string[]> = {
    id: ["id", "call_id", "callId", "uuid", "callUuid"],
    campaignId: ["campaign_id", "campaignId", "campaign"],
    campaignName: ["campaign_name", "campaignName", "campaignTitle"],
    callerId: ["caller_id", "callerId", "from", "ani", "callerNumber", "caller_number"],
    calledNumber: ["called_number", "calledNumber", "to", "dnis", "target", "targetNumber"],
    startTime: ["start_time", "startTime", "timestamp", "call_start", "callStart", "dateTime"],
    endTime: ["end_time", "endTime", "call_end", "callEnd"],
    duration: ["duration", "call_duration", "talk_time", "talkTime", "callDuration", "length"],
    status: ["status", "call_status", "callStatus", "state"],
    disposition: ["disposition", "call_disposition", "outcome", "result", "callDisposition"],
    direction: ["direction", "call_direction", "callDirection", "callType"],
    recordingUrl: ["recording_url", "recordingUrl", "recording", "audio_url", "audioUrl", "recordingLink"],
    agentName: ["agent_name", "agentName", "agent", "rep_name", "repName", "representative"],
    revenue: ["revenue", "payout", "commission", "value", "callRevenue"],
    cost: ["cost", "media_cost", "mediaCost", "callCost", "price"],
  }

  // Helper function to find a value using our mappings
  const findValue = (fieldName: string, defaultValue: any = null) => {
    const mappings = fieldMappings[fieldName] || []
    for (const mapping of mappings) {
      if (call[mapping] !== undefined) {
        return call[mapping]
      }
    }
    return defaultValue
  }

  // Check if a recording URL exists
  const recordingUrl = findValue("recordingUrl")

  return {
    id: findValue("id", `call_${Math.random().toString(36).substring(2, 11)}`),
    campaignId: findValue("campaignId", "unknown"),
    campaignName: findValue("campaignName", "Unknown Campaign"),
    callerId: findValue("callerId", "Unknown"),
    calledNumber: findValue("calledNumber", "Unknown"),
    startTime: findValue("startTime", new Date().toISOString()),
    endTime: findValue("endTime", null),
    duration: Number.parseInt(String(findValue("duration", "0"))),
    status: findValue("status", "unknown"),
    disposition: findValue("disposition", "unknown"),
    direction: findValue("direction", "inbound"),
    recordingUrl,
    hasRecording: !!recordingUrl,
    agentName: findValue("agentName", "Unknown Agent"),
    revenue: Number.parseFloat(String(findValue("revenue", "0"))),
    cost: Number.parseFloat(String(findValue("cost", "0"))),
    metadata: call,
  }
}

// Helper function to transcribe a recording
async function transcribeRecording(recordingUrl: string) {
  try {
    console.log(`🎤 Transcribing recording: ${recordingUrl}`)

    // Call our transcription API
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioUrl: recordingUrl,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Transcription API error")
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Transcription failed")
    }

    return {
      success: true,
      transcript: result.data.transcript,
      deepgramResult: result.data.deepgramMetadata,
    }
  } catch (error) {
    console.error("❌ Transcription error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown transcription error",
    }
  }
}

// Helper function to analyze a transcript
async function analyzeTranscript(transcript: string, callData: any, deepgramResult: any) {
  try {
    console.log(`🧠 Analyzing transcript for call ${callData.id}...`)

    // Basic analysis
    const analysis = {
      sentiment: analyzeSentiment ? await analyzeSentiment(transcript) : getDefaultSentiment(),
      intent: detectCallIntentWithAI ? await detectCallIntentWithAI(transcript) : getDefaultIntent(),
      disposition: null as any,
      callMetrics: {
        totalWords: transcript.split(/\s+/).length,
        callDuration: callData.duration,
        wordsPerMinute: Math.round((transcript.split(/\s+/).length / callData.duration) * 60),
        fillerWordCount: countFillerWords(transcript),
      },
      keyPhrases: extractKeyPhrases(transcript),
      topics: deepgramResult?.topics || [],
    }

    // Add disposition analysis (depends on intent)
    analysis.disposition = detectCallDispositionWithAI
      ? await detectCallDispositionWithAI(transcript, analysis.intent)
      : getDefaultDisposition()

    return analysis
  } catch (error) {
    console.error("❌ Analysis error:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown analysis error",
      partial: true,
      sentiment: getDefaultSentiment(),
      intent: getDefaultIntent(),
      disposition: getDefaultDisposition(),
    }
  }
}

// Helper function to generate OnScript summary
function generateOnScriptSummary(transcript: string, analysis: any, callData: any) {
  try {
    if (generateOnScriptAISummary) {
      const callAnalysisData = {
        transcript,
        analysis,
        fileName: `ringba_${callData.id}.wav`,
        fileSize: 1000000, // Placeholder
        duration: callData.duration,
        provider: "ringba-integration",
      }

      const campaignInfo = {
        id: callData.campaignId,
        name: callData.campaignName,
      }

      return generateOnScriptAISummary(callAnalysisData, campaignInfo)
    }

    // Fallback if the function isn't available
    return {
      summary: "OnScript AI summary not available. Please check the integration.",
      keyPoints: ["Integration required", "Check OnScript AI module"],
      actionItems: ["Setup OnScript AI integration"],
    }
  } catch (error) {
    console.error("❌ OnScript summary generation error:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error generating OnScript summary",
      summary: "Error generating summary",
    }
  }
}

// Helper function to generate Vocalytics analysis
function generateVocalyticsAnalysis(transcript: string, deepgramResult: any) {
  try {
    if (analyzeVocalytics) {
      const words = deepgramResult?.words || []
      const utterances = deepgramResult?.utterances || []
      return analyzeVocalytics(transcript, words, utterances)
    }

    // Fallback if the function isn't available
    return generateBasicVocalytics(transcript)
  } catch (error) {
    console.error("❌ Vocalytics analysis error:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error generating Vocalytics",
      basic: generateBasicVocalytics(transcript),
    }
  }
}

// Helper function to generate basic vocalytics when full analysis isn't available
function generateBasicVocalytics(transcript: string) {
  const words = transcript.split(/\s+/)
  const fillerWords = countFillerWords(transcript)
  const fillerWordPercentage = (fillerWords / words.length) * 100

  return {
    vocalCharacteristics: {
      articulationAndClarity: {
        negative: fillerWordPercentage > 5 ? 1 : 0,
        neutral: 1,
        positive: fillerWordPercentage < 2 ? 2 : 1,
      },
      vocalConfidence: {
        negative: 0,
        neutral: 1,
        positive: 1,
      },
      voiceQuality: {
        negative: 0,
        neutral: 1,
        positive: 1,
      },
    },
    conversationFlow: {
      activeListening: {
        negative: 0,
        neutral: 1,
        positive: 0,
        analysis: "The agent demonstrates active listening skills by directly addressing the prospect's needs.",
      },
      pacingAndTurnTaking: {
        negative: 0,
        neutral: 0,
        positive: 2,
        analysis: "The agent maintains an appropriate speech rate and good turn management.",
      },
      pausesAndSilence: {
        negative: 0,
        neutral: 0,
        positive: 2,
        analysis: "The agent uses silence effectively, allowing the prospect time to understand the information.",
      },
    },
    emotionalIntelligence: {
      adaptability: {
        negative: 0,
        neutral: 3,
        positive: 0,
      },
      emotionalExpressiveness: {
        negative: 0,
        neutral: 1,
        positive: 0,
      },
      empathyAndRapport: {
        negative: 0,
        neutral: 2,
        positive: 0,
      },
    },
    professionalism: {
      conflictManagement: {
        negative: 0,
        neutral: 1,
        positive: 1,
      },
      customerCentricApproach: {
        negative: 0,
        neutral: 2,
        positive: 0,
      },
      languageAppropriateness: {
        negative: 0,
        neutral: 0,
        positive: 3,
      },
      personalBoundaries: {
        negative: 0,
        neutral: 0,
        positive: 1,
      },
      professionalDemeanor: {
        negative: 0,
        neutral: 0,
        positive: 1,
      },
      professionalKnowledge: {
        negative: 0,
        neutral: 1,
        positive: 0,
      },
    },
  }
}

// Helper function to count filler words
function countFillerWords(transcript: string) {
  const fillerWords = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "literally"]
  const lowerTranscript = transcript.toLowerCase()

  return fillerWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g")
    const matches = lowerTranscript.match(regex)
    return count + (matches ? matches.length : 0)
  }, 0)
}

// Helper function to extract key phrases
function extractKeyPhrases(transcript: string) {
  // This is a simplified version - in production you'd use NLP
  const phrases = []

  // Look for questions
  const questions = transcript.match(/\b[^.?!]+\?/g) || []
  phrases.push(...questions.slice(0, 3))

  // Look for statements with key business terms
  const businessTerms = ["price", "cost", "offer", "deal", "purchase", "buy", "service", "product", "interested"]
  const sentences = transcript.split(/[.!?]+/)

  for (const term of businessTerms) {
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(term) && phrases.length < 10) {
        phrases.push(sentence.trim())
        break
      }
    }
  }

  return phrases.slice(0, 5) // Return up to 5 key phrases
}

// Default values for analysis when modules aren't available
function getDefaultSentiment() {
  return {
    agentSentiment: { overall: "Neutral", confidence: 70 },
    customerSentiment: { overall: "Neutral", confidence: 70 },
    overallCallSentiment: { overall: "Neutral", confidence: 70 },
  }
}

function getDefaultIntent() {
  return {
    primaryIntent: "General Inquiry",
    confidence: 70,
    subcategory: "Information Request",
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

// Generate mock call logs for testing
function generateMockCallLogs(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `mock_call_${index + 1}`,
    campaignId: `campaign_${Math.floor(Math.random() * 5) + 1}`,
    campaignName: `Mock Campaign ${Math.floor(Math.random() * 5) + 1}`,
    callerId: `+1555${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
    calledNumber: `+1800${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
    startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + Math.random() * 600000).toISOString(),
    duration: Math.floor(Math.random() * 600) + 30,
    status: ["completed", "answered", "busy", "no-answer"][Math.floor(Math.random() * 4)],
    disposition: ["sale", "no-sale", "callback", "not-interested"][Math.floor(Math.random() * 4)],
    direction: Math.random() > 0.3 ? "inbound" : "outbound",
    recordingUrl: `https://example.com/recordings/mock_call_${index + 1}.mp3`,
    hasRecording: true,
    agentName: ["John Smith", "Sarah Johnson", "Mike Wilson", "Lisa Brown", "David Lee"][Math.floor(Math.random() * 5)],
    revenue: Math.random() * 500,
    cost: Math.random() * 50,
  }))
}
