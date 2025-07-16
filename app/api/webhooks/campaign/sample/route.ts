import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, payloadConfig } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ success: false, message: "Campaign ID is required" }, { status: 400 })
    }

    const samplePayload = generateSamplePayload(campaignId, payloadConfig || {})

    return NextResponse.json({
      success: true,
      payload: samplePayload,
      payloadSize: JSON.stringify(samplePayload).length,
      enabledFields: Object.keys(payloadConfig || {}).filter((key) => payloadConfig[key]).length,
    })
  } catch (error) {
    console.error("Sample payload error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

function generateSamplePayload(campaignId: string, payloadConfig: any) {
  const basePayload = {
    event: "call.processed",
    timestamp: new Date().toISOString(),
    campaignId: campaignId,
    callId: `sample-call-${Date.now()}`,
    sample: true,
  }

  // Sample call data
  const sampleCallData = {
    id: `sample-call-${Date.now()}`,
    duration: 432,
    startTime: new Date(Date.now() - 432000).toISOString(),
    endTime: new Date().toISOString(),
    agentName: "John Smith",
    customerName: "Jane Doe",
    phoneNumber: "+1-555-0123",
    status: "completed",
    disposition: "interested",
    transcript: `Agent: Hello, this is John from ABC Insurance. How are you today?
Customer: I'm doing well, thank you. I received your call about Medicare plans.
Agent: Great! I'd love to help you understand your options for Medicare Advantage plans. Are you currently turning 65 or do you have Medicare already?
Customer: I'm turning 65 next month, so I need to make some decisions soon.
Agent: Perfect timing! Let me explain your options. With Medicare Advantage, you get all your Medicare benefits plus additional coverage like prescription drugs, dental, and vision all in one plan.
Customer: That sounds interesting. What would the monthly cost be?
Agent: Great question! Many of our Medicare Advantage plans have $0 monthly premium. You'd still pay your Medicare Part B premium to the government, but the plan itself could be free.
Customer: Really? That's much better than I expected. What about my current doctor?
Agent: I can help you check if your doctor is in our network. What's your doctor's name and what area are you in?
Customer: Dr. Sarah Johnson in Beverly Hills.
Agent: Let me check that for you. And do you take any prescription medications currently?
Customer: Yes, I take medication for blood pressure and cholesterol.
Agent: Those are very common and typically well-covered. I'd love to schedule a time to go over all the details with you. Would tomorrow afternoon work?
Customer: Yes, that would be great. Thank you for explaining everything so clearly.
Agent: You're very welcome! I'll call you tomorrow at 2 PM. Have a great day!`,
    analysis: {
      overallScore: 8.5,
      overallRating: "Excellent",
      toneQuality: 9.0,
      businessConversion: "interested",
      agentPerformance: 8.8,
      summary:
        "Customer showed strong interest in Medicare Advantage plans. Agent provided clear information about benefits and costs, addressed customer concerns about doctor network and prescriptions, and successfully scheduled a follow-up appointment. Customer was engaged and asked relevant questions throughout the call.",
      keyInsights: [
        "Customer is turning 65 next month and needs Medicare coverage",
        "Currently has employer insurance ending soon",
        "Interested in comprehensive coverage including prescription drugs",
        "Concerned about keeping current doctor (Dr. Sarah Johnson)",
        "Takes blood pressure and cholesterol medications",
        "Responded positively to $0 premium option",
        "Agreed to follow-up appointment",
      ],
      intent: "purchase_intent",
      sentiment: "positive",
      extractedFacts: {
        age: "64",
        zipCode: "90210",
        currentInsurance: "employer_plan",
        doctorName: "Dr. Sarah Johnson",
        location: "Beverly Hills",
        medications: ["blood pressure", "cholesterol"],
        appointmentScheduled: true,
      },
      agentQuestions: [
        "How are you today?",
        "Are you currently turning 65 or do you have Medicare already?",
        "What's your doctor's name and what area are you in?",
        "Do you take any prescription medications currently?",
        "Would tomorrow afternoon work?",
      ],
      customerQuestions: ["What would the monthly cost be?", "What about my current doctor?"],
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
      environment: "production",
      apiVersion: "v1",
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
      direction: "outbound",
      recordingUrl: "https://recordings.onscript.ai/sample-recording.mp3",
    }
  }

  if (payloadConfig.disposition) {
    payload.disposition = {
      outcome: sampleCallData.disposition,
      classification: sampleCallData.analysis.businessConversion,
      notes: sampleCallData.analysis.keyInsights[0],
      followUpRequired: true,
      appointmentScheduled: true,
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
        compliance: 9.2,
        customerSatisfaction: 8.8,
      },
      passFailStatus: "pass",
    }
  }

  if (payloadConfig.callSummary) {
    payload.callSummary = {
      summary: sampleCallData.analysis.summary,
      keyPoints: sampleCallData.analysis.keyInsights,
      outcome: sampleCallData.analysis.businessConversion,
      nextSteps: [
        "Follow-up appointment scheduled for tomorrow at 2 PM",
        "Verify doctor network coverage",
        "Prepare prescription drug coverage details",
      ],
      customerProfile: "Engaged prospect turning 65, interested in comprehensive Medicare coverage",
    }
  }

  if (payloadConfig.callFacts) {
    payload.callFacts = {
      extractedFacts: sampleCallData.analysis.extractedFacts,
      customerInfo: {
        name: sampleCallData.customerName,
        demographics: {
          age: "64",
          location: "Beverly Hills, CA",
          zipCode: "90210",
        },
        healthInfo: {
          medications: ["blood pressure medication", "cholesterol medication"],
          preferredDoctor: "Dr. Sarah Johnson",
        },
        insuranceStatus: {
          current: "employer_plan",
          transition: "turning_65_next_month",
        },
      },
    }
  }

  if (payloadConfig.intent) {
    payload.intent = {
      primary: sampleCallData.analysis.intent,
      confidence: 0.92,
      classification: sampleCallData.analysis.businessConversion,
      indicators: [
        "Asked about monthly costs",
        "Inquired about doctor coverage",
        "Agreed to follow-up appointment",
        "Engaged throughout conversation",
      ],
    }
  }

  // Content & Transcription
  if (payloadConfig.transcript) {
    payload.transcript = {
      fullText: sampleCallData.transcript,
      segments: [
        {
          speaker: "agent",
          text: "Hello, this is John from ABC Insurance. How are you today?",
          timestamp: 0,
          confidence: 0.98,
        },
        {
          speaker: "customer",
          text: "I'm doing well, thank you. I received your call about Medicare plans.",
          timestamp: 3.2,
          confidence: 0.96,
        },
        {
          speaker: "agent",
          text: "Great! I'd love to help you understand your options for Medicare Advantage plans.",
          timestamp: 8.1,
          confidence: 0.97,
        },
        {
          speaker: "customer",
          text: "That sounds interesting. What would the monthly cost be?",
          timestamp: 45.3,
          confidence: 0.95,
        },
        {
          speaker: "agent",
          text: "Many of our Medicare Advantage plans have $0 monthly premium.",
          timestamp: 48.7,
          confidence: 0.98,
        },
      ],
      language: "en-US",
      confidence: 0.96,
      wordCount: 247,
    }
  }

  if (payloadConfig.markers) {
    payload.markers = {
      keyMoments: [
        { type: "greeting", timestamp: 0, description: "Professional opening" },
        { type: "needs_assessment", timestamp: 15.2, description: "Identified customer turning 65" },
        { type: "product_presentation", timestamp: 32.1, description: "Explained Medicare Advantage benefits" },
        { type: "objection_handling", timestamp: 58.4, description: "Addressed cost and doctor concerns" },
        { type: "close", timestamp: 78.9, description: "Successfully scheduled follow-up" },
      ],
      highlights: [
        "Strong customer engagement throughout call",
        "Clear explanation of benefits and costs",
        "Successful appointment scheduling",
        "Addressed all customer concerns",
      ],
      concerns: [],
      complianceFlags: [],
    }
  }

  if (payloadConfig.questions) {
    payload.questions = {
      agentQuestions: sampleCallData.analysis.agentQuestions,
      customerQuestions: sampleCallData.analysis.customerQuestions,
      unansweredQuestions: [],
      questionQuality: "high",
      discoveryScore: 8.5,
    }
  }

  if (payloadConfig.vocalytics) {
    payload.vocalytics = {
      sentiment: sampleCallData.analysis.sentiment,
      toneAnalysis: sampleCallData.analysis.toneQuality,
      speechMetrics: {
        speakingRate: 145,
        silenceGaps: 2.3,
        interruptions: 1,
        talkTimeRatio: { agent: 0.65, customer: 0.35 },
        energyLevel: "medium-high",
        clarity: 9.1,
      },
      emotionalJourney: [
        { timestamp: 0, emotion: "neutral", confidence: 0.8 },
        { timestamp: 30, emotion: "interested", confidence: 0.9 },
        { timestamp: 60, emotion: "positive", confidence: 0.95 },
        { timestamp: 90, emotion: "satisfied", confidence: 0.92 },
      ],
    }
  }

  return payload
}
