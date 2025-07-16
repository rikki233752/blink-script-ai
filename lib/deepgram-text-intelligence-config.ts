export interface DeepgramTextIntelligenceConfig {
  apiKey: string
  baseUrl: string
  features: string[]
}

export function getDeepgramTextConfig(): DeepgramTextIntelligenceConfig {
  // Use your API key for Text Intelligence
  const apiKey = process.env.DEEPGRAM_API_KEY || "826b863658186408cc422feb47b5fe93809d0eb7"

  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is required")
  }

  return {
    apiKey,
    baseUrl: "https://api.deepgram.com/v1/read",
    features: ["summarize", "sentiment", "topics", "intents", "entities", "language"],
  }
}

export function validateDeepgramTextConfig(): { valid: boolean; error?: string } {
  try {
    const config = getDeepgramTextConfig()

    // Validate the API key format
    if (!config.apiKey.match(/^[a-f0-9]{40}$/)) {
      return {
        valid: false,
        error: "API key format appears invalid. Should be a 40-character hex string.",
      }
    }

    return { valid: true }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    }
  }
}
