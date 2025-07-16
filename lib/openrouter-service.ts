type OpenRouterConfig = {
  apiKey: string
  model: string
  baseUrl: string
}

type OpenRouterResponse = {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenRouterService {
  private config: OpenRouterConfig

  constructor(apiKey?: string) {
    this.config = {
      apiKey:
        apiKey ||
        process.env.OPENROUTER_API_KEY ||
        "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",
      model: "openai/gpt-4o-mini",
      baseUrl: "https://openrouter.ai/api/v1",
    }
  }

  async makeRequest(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("OpenRouter API key not configured")
    }

    const messages = []

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      })
    }

    messages.push({
      role: "user",
      content: prompt,
    })

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "CallCenter AI Analysis",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }

    const data: OpenRouterResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from OpenRouter API")
    }

    return data.choices[0].message.content
  }

  async testConnection(): Promise<{ success: boolean; message: string; usage?: any }> {
    try {
      const testPrompt = "Respond with exactly: 'OpenRouter connection successful'"
      const response = await this.makeRequest(testPrompt)

      return {
        success: true,
        message: response,
        usage: "Connection test completed successfully",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }
}
