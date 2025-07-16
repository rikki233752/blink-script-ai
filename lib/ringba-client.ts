/**
 * RingBA API Client
 *
 * This client handles authentication and API calls to the RingBA API.
 * It supports multiple authentication methods and API versions.
 */

interface RingBAClientConfig {
  apiKey: string
  accountId: string
  baseUrl?: string
  apiVersion?: string
  authMethod?: "bearer" | "apikey" | "xapikey" | "basic"
}

interface RingBARequestOptions {
  method?: string
  path: string
  body?: any
  query?: Record<string, string>
}

class RingBAClient {
  private config: RingBAClientConfig
  private static instance: RingBAClient

  private constructor(config: RingBAClientConfig) {
    this.config = {
      baseUrl: "https://api.ringba.com",
      apiVersion: "v2",
      authMethod: "bearer",
      ...config,
    }
  }

  static getInstance(config?: RingBAClientConfig): RingBAClient {
    if (!RingBAClient.instance && config) {
      RingBAClient.instance = new RingBAClient(config)
    } else if (!RingBAClient.instance) {
      throw new Error("RingBA client not initialized")
    }
    return RingBAClient.instance
  }

  static initialize(config: RingBAClientConfig): RingBAClient {
    RingBAClient.instance = new RingBAClient(config)
    return RingBAClient.instance
  }

  private getAuthHeaders(): Record<string, string> {
    const { apiKey, authMethod } = this.config

    switch (authMethod) {
      case "bearer":
        return { Authorization: `Bearer ${apiKey}` }
      case "apikey":
        return { "API-Key": apiKey }
      case "xapikey":
        return { "X-API-Key": apiKey }
      case "basic":
        return { Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` }
      default:
        return { Authorization: `Bearer ${apiKey}` }
    }
  }

  private getBaseHeaders(): Record<string, string> {
    return {
      ...this.getAuthHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "CallCenter-Transcription/1.0",
    }
  }

  private buildUrl(path: string, query?: Record<string, string>): string {
    const { baseUrl, apiVersion, accountId } = this.config

    // Format: https://api.ringba.com/v2/accounts/{accountId}/{path}
    const url = new URL(`${baseUrl}/${apiVersion}/accounts/${accountId}/${path}`)

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value)
        }
      })
    }

    return url.toString()
  }

  async request<T = any>(options: RingBARequestOptions): Promise<T> {
    const { method = "GET", path, body, query } = options
    const url = this.buildUrl(path, query)

    const requestOptions: RequestInit = {
      method,
      headers: this.getBaseHeaders(),
    }

    if (body) {
      requestOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`RingBA API error (${response.status}): ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("RingBA API request failed:", error)
      throw error
    }
  }

  // API Methods

  async getCampaigns() {
    return this.request({ path: "campaigns" })
  }

  async getCampaign(campaignId: string) {
    return this.request({ path: `campaigns/${campaignId}` })
  }

  async getCallLogs(
    options: {
      campaignId?: string
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    } = {},
  ) {
    const { campaignId, startDate, endDate, limit, offset } = options

    const body = {
      ...(campaignId ? { campaignId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(limit ? { limit } : {}),
      ...(offset ? { offset } : {}),
    }

    return this.request({
      method: "POST",
      path: "calllogs",
      body,
    })
  }

  async getCallLogColumns() {
    return this.request({ path: "calllogs/columns" })
  }

  async getRecordingUrl(callId: string) {
    return this.request({ path: `calls/${callId}/recording` })
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request({ path: "" })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export { RingBAClient }
export type { RingBAClientConfig, RingBARequestOptions }
