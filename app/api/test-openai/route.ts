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
      max_tokens: options.max_tokens || 100,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export async function GET() {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "OpenRouter API key not configured",
        configured: false,
      })
    }

    // Test OpenRouter connection
    const completion = await callOpenRouter(
      [
        {
          role: "user",
          content: "Say 'Hello, OpenRouter is working!' in a friendly way.",
        },
      ],
      {
        max_tokens: 100,
      },
    )

    const response = completion.choices[0].message?.content || "No response"

    return NextResponse.json({
      success: true,
      configured: true,
      response,
      model: "openai/gpt-3.5-turbo",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[TEST_OPENROUTER]", error)

    return NextResponse.json({
      success: false,
      configured: !!OPENROUTER_API_KEY,
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message = "Hello, how are you?" } = body

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenRouter API key not configured",
        },
        { status: 401 },
      )
    }

    const completion = await callOpenRouter(
      [
        {
          role: "user",
          content: message,
        },
      ],
      {
        max_tokens: 150,
      },
    )

    const response = completion.choices[0].message?.content || "No response"

    return NextResponse.json({
      success: true,
      input: message,
      response,
      model: "openai/gpt-3.5-turbo",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[TEST_OPENROUTER_POST]", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to test OpenRouter",
      },
      { status: 500 },
    )
  }
}
