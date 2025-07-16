import { NextResponse } from "next/server"

// Use OpenRouter instead of OpenAI
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

async function callOpenRouter(messages: any[], options: any = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured")
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Call Center Transcription",
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages,
      max_tokens: options.max_tokens || 1000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transcript, metadata = {} } = body

    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript in request body" }, { status: 400 })
    }

    // Analyze transcript with OpenRouter
    const completion = await callOpenRouter(
      [
        {
          role: "system",
          content: `You are an expert call center analyst. Analyze call transcripts and provide comprehensive insights including sentiment, intent, key topics, and performance metrics.`,
        },
        {
          role: "user",
          content: `Analyze this call transcript and provide detailed analysis:

Transcript: "${transcript}"

Provide analysis including:
1. Overall sentiment and emotional tone
2. Customer intent and needs
3. Agent performance indicators
4. Key topics discussed
5. Issue resolution status
6. Escalation risk assessment
7. Customer satisfaction indicators
8. Call quality score (1-10)
9. Key insights and recommendations

Respond in JSON format with structured data.`,
        },
      ],
      {
        max_tokens: 1000,
      },
    )

    const analysisText = completion.choices[0].message?.content || "{}"
    let analysis

    try {
      analysis = JSON.parse(analysisText)
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      analysis = {
        sentiment: "neutral",
        intent: "unknown",
        topics: [],
        agentPerformance: "average",
        resolutionStatus: "unknown",
        escalationRisk: "low",
        satisfactionIndicators: [],
        qualityScore: 5,
        insights: analysisText,
        recommendations: [],
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        sentiment: analysis.sentiment || "neutral",
        intent: analysis.intent || "unknown",
        topics: analysis.topics || [],
        agentPerformance: analysis.agentPerformance || "average",
        resolutionStatus: analysis.resolutionStatus || "unknown",
        escalationRisk: analysis.escalationRisk || "low",
        satisfactionIndicators: analysis.satisfactionIndicators || [],
        qualityScore: analysis.qualityScore || 5,
        insights: analysis.insights || "No specific insights available",
        recommendations: analysis.recommendations || [],
      },
      metadata: {
        model: "openai/gpt-3.5-turbo",
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
        inputLength: transcript.length,
      },
    })
  } catch (error: any) {
    console.error("[ANALYZE_TRANSCRIPT]", error)

    if (error.message?.includes("quota")) {
      return NextResponse.json({ error: "OpenRouter API quota exceeded" }, { status: 429 })
    }

    if (error.message?.includes("API key")) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to analyze transcript" }, { status: 500 })
  }
}
