export class DeepgramDirectClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async transcribeFile(file: File, options: DeepgramOptions = {}) {
    const url = "https://api.deepgram.com/v1/listen"
    const params = new URLSearchParams({
      model: options.model || "nova-2",
      language: options.language || "en-US",
      smart_format: "true",
      punctuate: "true",
      diarize: "true",
      utterances: "true",
      paragraphs: "true",
      sentiment: "true",
      filler_words: "true",
      alternatives: "1",
      ...options.customParams,
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": file.type || "audio/wav",
      },
      body: file, // Direct file upload - no size limit from our side
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Deepgram API error: ${response.status} - ${error}`)
    }

    return await response.json()
  }

  async transcribeFromUrl(audioUrl: string, options: DeepgramOptions = {}) {
    const url = "https://api.deepgram.com/v1/listen"
    const params = new URLSearchParams({
      model: options.model || "nova-2",
      language: options.language || "en-US",
      smart_format: "true",
      punctuate: "true",
      diarize: "true",
      utterances: "true",
      paragraphs: "true",
      sentiment: "true",
      filler_words: "true",
      alternatives: "1",
      ...options.customParams,
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: audioUrl }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Deepgram API error: ${response.status} - ${error}`)
    }

    return await response.json()
  }
}

export interface DeepgramOptions {
  model?: string
  language?: string
  customParams?: Record<string, string>
}
