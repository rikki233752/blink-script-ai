import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Simple transcribe API called")

    // Check environment variables first
    if (!process.env.DEEPGRAM_API_KEY) {
      console.error("❌ DEEPGRAM_API_KEY not found")
      return NextResponse.json(
        {
          success: false,
          error: "Deepgram API key not configured",
        },
        { status: 500 },
      )
    }

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
      console.log("✅ Form data parsed successfully")
    } catch (error) {
      console.error("❌ Form data parse error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse form data",
        },
        { status: 400 },
      )
    }

    const audioFile = formData.get("audio") as File
    if (!audioFile) {
      console.error("❌ No audio file found")
      return NextResponse.json(
        {
          success: false,
          error: "No audio file provided",
        },
        { status: 400 },
      )
    }

    console.log("📁 File info:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    })

    // For now, just return a mock response to test the pipeline
    const mockResponse = {
      transcript: "This is a test transcript for debugging purposes.",
      analysis: {
        overallRating: "GOOD" as const,
        overallScore: 8.5,
        toneQuality: {
          agent: "Professional",
          customer: "Neutral",
          score: 8.0,
          confidence: 85,
        },
        businessConversion: {
          conversionAchieved: true,
          conversionType: "Sales",
          conversionConfidence: 75,
          conversionStage: "Closed",
          commitmentLevel: "High",
          estimatedValue: 5000,
          valueCategory: "High Value",
          urgency: "medium",
          followUpTiming: "immediate",
          positiveSignals: ["Customer expressed interest", "Asked about pricing"],
          negativeSignals: [],
          agentEffectiveness: {
            closingAttempts: 2,
            objectionHandling: 8,
            valueProposition: 9,
            urgencyCreation: 7,
          },
          riskFactors: [],
          nextBestAction: "Send proposal",
        },
        agentPerformance: {
          communicationSkills: 8.5,
          problemSolving: 8.0,
          productKnowledge: 8.2,
          customerService: 8.8,
        },
        keyInsights: [
          "Excellent customer engagement",
          "Strong product knowledge demonstrated",
          "Effective closing techniques used",
        ],
        improvementSuggestions: ["Continue current approach", "Focus on follow-up timing"],
        callDuration: "5:30",
        summary: "Successful sales call with high conversion potential",
        sentimentAnalysis: {
          agentSentiment: {
            overall: "Positive",
            confidence: 90,
            positive: 80,
            negative: 5,
            neutral: 15,
          },
          customerSentiment: {
            overall: "Positive",
            confidence: 85,
            positive: 75,
            negative: 10,
            neutral: 15,
          },
          overallCallSentiment: {
            overall: "Positive",
            confidence: 87,
            positive: 77,
            negative: 8,
            neutral: 15,
          },
          sentimentTimeline: [],
          keyPhrases: {
            positive: ["great", "excellent", "interested"],
            negative: [],
            neutral: ["product", "service", "information"],
          },
          emotionalJourney: {
            startSentiment: "neutral",
            endSentiment: "positive",
            sentimentShifts: 2,
            dominantEmotion: "positive",
          },
        },
        preciseScoring: {
          overallScore: 85,
          categoryScores: {
            communication: 85,
            problemSolving: 80,
            productKnowledge: 82,
            customerService: 88,
          },
          detailedMetrics: {
            responseTime: 95,
            accuracy: 90,
            empathy: 85,
            professionalism: 90,
          },
        },
        intentAnalysis: {
          primaryIntent: "SALES",
          subcategory: "Product Inquiry",
          confidence: 90,
          reasoning: "Customer inquired about product features and pricing",
        },
        dispositionAnalysis: {
          disposition: "INTERESTED",
          confidence: 85,
          reasoning: "Customer showed strong interest and asked follow-up questions",
        },
        callMetrics: {
          totalDuration: 330,
          talkTime: {
            agent: 180,
            customer: 150,
          },
          silenceTime: 15,
          interruptionCount: 2,
          questionCount: 8,
          averageResponseTime: 2.5,
        },
        vocalyticsReport: {
          speakingRate: 150,
          toneVariation: 75,
          volumeConsistency: 85,
          clarityScore: 90,
        },
        callQualityMetrics: {
          overallQuality: 8.5,
          customerSatisfaction: 88,
          agentEffectiveness: 8.2,
          communicationClarity: 9.0,
          resolutionSuccess: 8.8,
        },
      },
      fileName: audioFile.name,
      fileSize: audioFile.size,
      duration: 330,
      provider: "mock-for-debugging",
    }

    console.log("✅ Returning mock response")

    return NextResponse.json({
      success: true,
      data: mockResponse,
    })
  } catch (error: any) {
    console.error("❌ Unexpected error in simple transcribe:", error)
    console.error("❌ Error stack:", error.stack)

    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error.message}`,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
