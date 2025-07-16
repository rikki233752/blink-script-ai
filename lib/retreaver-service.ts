export class RetreaverService {
  private apiKey: string
  private accountId: string
  private baseUrl = "https://api.retreaver.com"

  constructor() {
    this.apiKey = process.env.RETREAVER_API_KEY || ""
    this.accountId = process.env.RETREAVER_ACCOUNT_ID || ""
  }

  // Test connection to Retreaver API
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns.json?api_key=${this.apiKey}&company_id=${this.accountId}`)
      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? "Connection successful" : "Connection failed",
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Get all campaigns
  async getCampaigns() {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns.json?api_key=${this.apiKey}&company_id=${this.accountId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        campaigns: data.campaigns || [],
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        campaigns: [],
      }
    }
  }

  // Get calls for a specific campaign with date range using V2 API
  async getCallsV2WithDateRange(campaignId: string, startDate: string, endDate: string, page = 1) {
    try {
      // Validate RFC3339 format
      const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
      if (!rfc3339Regex.test(startDate) || !rfc3339Regex.test(endDate)) {
        throw new Error("Invalid date format. Use RFC3339 format: 2016-01-01T00:00:00+00:00")
      }

      const url = new URL(`${this.baseUrl}/api/v2/calls.json`)
      url.searchParams.set("api_key", this.apiKey)
      url.searchParams.set("company_id", this.accountId)
      url.searchParams.set("campaign_id", campaignId)
      url.searchParams.set("created_at_start", startDate)
      url.searchParams.set("created_at_end", endDate)
      url.searchParams.set("page", page.toString())

      console.log("📡 Retreaver V2 Service URL:", url.toString())

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      return {
        success: true,
        calls: data.calls || [],
        pagination: {
          currentPage: data.current_page || 1,
          hasNextPage: data.has_next_page || false,
          totalPages: data.total_pages || 1,
          totalCalls: data.total_calls || 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        calls: [],
        pagination: {
          currentPage: 1,
          hasNextPage: false,
          totalPages: 1,
          totalCalls: 0,
        },
      }
    }
  }

  // Create a new campaign
  async createCampaign(campaignData: {
    name: string
    description?: string
    tracking_number?: string
    target_number?: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          company_id: this.accountId,
          campaign: campaignData,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      return {
        success: true,
        campaign: data.campaign,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Format date to RFC3339 format for Retreaver API
  formatToRFC3339(date: Date, isEndOfDay = false): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    if (isEndOfDay) {
      return `${year}-${month}-${day}T23:59:59+00:00`
    } else {
      return `${year}-${month}-${day}T00:00:00+00:00`
    }
  }
}

export const retreaverService = new RetreaverService()
