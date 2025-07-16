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
      response_format: options.response_format || undefined,
      max_tokens: options.max_tokens || 500,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get("text")
    const language = searchParams.get("language") || "en"

    if (!text) {
      return NextResponse.json({ error: "Missing 'text' parameter" }, { status: 400 })
    }

    if (text.length > 4000) {
      return NextResponse.json({ error: "Text too long. Maximum 4000 characters." }, { status: 400 })
    }

    // Analyze text with OpenRouter
    const completion = await callOpenRouter(
      [
        {
          role: "user",
          content: `Analyze the following text and provide:
1. Sentiment (positive/negative/neutral with confidence score)
2. Key topics (up to 5)
3. Intent classification
4. Language detection
5. Summary (1-2 sentences)

Text: "${text}"

Respond in JSON format with keys: sentiment, topics, intent, detectedLanguage, summary, confidence.`,
        },
      ],
      {
        response_format: { type: "json_object" },
        max_tokens: 500,
      },
    )

    const analysis = JSON.parse(completion.choices[0].message?.content || "{}")

    return NextResponse.json({
      success: true,
      input: {
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        language,
        length: text.length,
      },
      analysis: {
        sentiment: analysis.sentiment || "neutral",
        topics: analysis.topics || [],
        intent: analysis.intent || "unknown",
        detectedLanguage: analysis.detectedLanguage || language,
        summary: analysis.summary || "No summary available",
        confidence: analysis.confidence || 0.5,
      },
      metadata: {
        model: "openai/gpt-3.5-turbo",
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
      },
    })
  } catch (error: any) {
    console.error("[ANALYZE_TEXT_GET]", error)

    if (error.message?.includes("quota")) {
      return NextResponse.json({ error: "OpenRouter API quota exceeded" }, { status: 429 })
    }

    if (error.message?.includes("API key")) {
      return NextResponse.json({ error: "Invalid OpenRouter API key" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, language = "en", options = {} } = body

    if (!text) {
      return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400 })
    }

    // Enhanced analysis for POST requests
    const completion = await callOpenRouter(
      [
        {
          role: "user",
          content: `Perform comprehensive text analysis on the following text:

Text: "${text}"

Provide detailed analysis including:
1. Sentiment analysis with confidence scores
2. Key topics and themes
3. Intent classification
4. Emotional tone
5. Key phrases extraction
6. Summary and insights
7. Language detection
8. Readability assessment

${
  options.includeCallAnalysis
    ? `
9. Call center specific analysis:
   - Customer satisfaction indicators
   - Issue resolution likelihood
   - Escalation risk assessment
   - Agent performance indicators
`
    : ""
}

Respond in detailed JSON format.`,
        },
      ],
      {
        response_format: { type: "json_object" },
        max_tokens: 1000,
      },
    )

    const analysis = JSON.parse(completion.choices[0].message?.content || "{}")

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        model: "openai/gpt-3.5-turbo",
        timestamp: new Date().toISOString(),
        enhanced: true,
      },
    })
  } catch (error: any) {
    console.error("[ANALYZE_TEXT_POST]", error)
    return NextResponse.json({ error: "Failed to analyze text" }, { status: 500 })
  }
}
