export interface DeepgramConfig {
  apiKey: string
  baseUrl: string
  model: string
  language: string
  features: string[]
}

export function getDeepgramConfig(): DeepgramConfig {
  // Use the API key from your Python example
  const apiKey = process.env.DEEPGRAM_API_KEY || "826b863658186408cc422feb47b5fe93809d0eb7"

  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is required")
  }

  return {
    apiKey,
    baseUrl: "https://api.deepgram.com/v1/listen",
    model: "nova-2",
    language: "en-US",
    features: [
      "smart_format",
      "punctuate",
      "diarize",
      "utterances",
      "paragraphs",
      "sentiment",
      "filler_words",
      "alternatives",
    ],
  }
}

export function validateDeepgramConfig(): { valid: boolean; error?: string } {
  try {
    const config = getDeepgramConfig()

    // Validate the specific API key format from your example
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
