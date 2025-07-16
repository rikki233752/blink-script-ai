import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, webhookUrl, payloadConfig } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ success: false, message: "Campaign ID is required" }, { status: 400 })
    }

    if (!webhookUrl) {
      return NextResponse.json({ success: false, message: "Webhook URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      const url = new URL(webhookUrl)
      if (url.protocol !== "https:") {
        return NextResponse.json(
          {
            success: false,
            message: "Webhook URL must use HTTPS protocol",
          },
          { status: 400 },
        )
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook URL format",
        },
        { status: 400 },
      )
    }

    // Generate test payload
    const testPayload = generateTestPayload(campaignId, payloadConfig || {})

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "OnScript-AI-Webhook-Test/1.0",
          "X-OnScript-Test": "true",
          "X-OnScript-Campaign-ID": campaignId,
        },
        body: JSON.stringify(testPayload),
      })

      const responseText = await response.text()

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "Test webhook delivered successfully",
          statusCode: response.status,
          response: responseText.substring(0, 500), // Limit response size
        })
      } else {
        return NextResponse.json({
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          response: responseText.substring(0, 500),
        })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

function generateTestPayload(campaignId: string, payloadConfig: any) {
  const basePayload = {
    event: "call.processed",
    timestamp: new Date().toISOString(),
    campaignId: campaignId,
    callId: `test-call-${Date.now()}`,
    test: true,
  }

  // Sample call data for testing
  const sampleCallData = {
    id: `test-call-${Date.now()}`,
    duration: 432,
    startTime: new Date(Date.now() - 432000).toISOString(),
    endTime: new Date().toISOString(),
    agentName: "John Smith",
    customerName: "Jane Doe",
    phoneNumber: "+1-555-0123",
    status: "completed",
    disposition: "interested",
    transcript:
      "Agent: Hello, this is John from ABC Insurance. How are you today?\nCustomer: I'm doing well, thank you. I received your call about Medicare plans.\nAgent: Great! I'd love to help you understand your options for Medicare Advantage plans...",
    analysis: {
      overallScore: 8.5,
      overallRating: "Excellent",
      toneQuality: 9.0,
      businessConversion: "interested",
      agentPerformance: 8.8,
      summary:
        "Customer showed strong interest in Medicare Advantage plans. Agent provided clear information and scheduled follow-up.",
      keyInsights: [
        "Customer is turning 65 next month",
        "Currently has employer insurance ending soon",
        "Interested in prescription drug coverage",
      ],
      intent: "purchase_intent",
      sentiment: "positive",
      extractedFacts: {
        age: "64",
        zipCode: "90210",
        currentInsurance: "employer_plan",
      },
    },
  }

  // Build payload based on configuration
  const payload = { ...basePayload }

  // Core Data
  if (payloadConfig.metadata) {
    payload.metadata = {
      sessionId: sampleCallData.id,
      source: "OnScript-AI",
      version: "1.0",
      processingTime: new Date().toISOString(),
    }
  }

  if (payloadConfig.callDetails) {
    payload.callDetails = {
      duration: sampleCallData.duration,
      startTime: sampleCallData.startTime,
      endTime: sampleCallData.endTime,
      participants: {
        agent: sampleCallData.agentName,
        customer: sampleCallData.customerName,
      },
      phoneNumber: sampleCallData.phoneNumber,
      status: sampleCallData.status,
    }
  }

  if (payloadConfig.disposition) {
    payload.disposition = {
      outcome: sampleCallData.disposition,
      classification: sampleCallData.analysis.businessConversion,
      notes: sampleCallData.analysis.keyInsights[0],
    }
  }

  // Analysis & Insights
  if (payloadConfig.scorecard) {
    payload.scorecard = {
      overallScore: sampleCallData.analysis.overallScore,
      rating: sampleCallData.analysis.overallRating,
      breakdown: {
        toneQuality: sampleCallData.analysis.toneQuality,
        businessConversion: sampleCallData.analysis.businessConversion,
        agentPerformance: sampleCallData.analysis.agentPerformance,
      },
    }
  }

  if (payloadConfig.callSummary) {
    payload.callSummary = {
      summary: sampleCallData.analysis.summary,
      keyPoints: sampleCallData.analysis.keyInsights,
      outcome: sampleCallData.analysis.businessConversion,
    }
  }

  if (payloadConfig.callFacts) {
    payload.callFacts = {
      extractedFacts: sampleCallData.analysis.extractedFacts,
      customerInfo: {
        name: sampleCallData.customerName,
        demographics: sampleCallData.analysis.extractedFacts,
      },
    }
  }

  if (payloadConfig.intent) {
    payload.intent = {
      primary: sampleCallData.analysis.intent,
      confidence: 0.92,
      classification: sampleCallData.analysis.businessConversion,
    }
  }

  // Content & Transcription
  if (payloadConfig.transcript) {
    payload.transcript = {
      fullText: sampleCallData.transcript,
      segments: [
        { speaker: "agent", text: "Hello, this is John from ABC Insurance. How are you today?", timestamp: 0 },
        {
          speaker: "customer",
          text: "I'm doing well, thank you. I received your call about Medicare plans.",
          timestamp: 3.2,
        },
        {
          speaker: "agent",
          text: "Great! I'd love to help you understand your options for Medicare Advantage plans...",
          timestamp: 8.1,
        },
      ],
      language: "en-US",
      confidence: 0.95,
    }
  }

  if (payloadConfig.markers) {
    payload.markers = {
      keyMoments: ["greeting", "needs_assessment", "product_presentation", "objection_handling", "close"],
      highlights: ["Strong customer interest", "Clear product explanation", "Successful appointment set"],
      concerns: [],
    }
  }

  if (payloadConfig.questions) {
    payload.questions = {
      agentQuestions: [
        "What type of coverage are you looking for?",
        "When does your current insurance end?",
        "Do you take any prescription medications?",
      ],
      customerQuestions: ["What's the monthly premium?", "Is my doctor covered?", "When can I enroll?"],
      unansweredQuestions: [],
    }
  }

  if (payloadConfig.vocalytics) {
    payload.vocalytics = {
      sentiment: sampleCallData.analysis.sentiment,
      toneAnalysis: sampleCallData.analysis.toneQuality,
      speechMetrics: {
        speakingRate: 145, // words per minute
        silenceGaps: 2.3, // seconds
        interruptions: 1,
        talkTimeRatio: { agent: 0.65, customer: 0.35 },
      },
    }
  }

  return payload
}
