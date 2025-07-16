import type { CallRecord, CallFilters } from "./types"

export class RingBAService {
  private apiKey: string
  private accountId: string
  private baseUrl = "https://api.ringba.com/v2"

  constructor(config: { apiKey: string; accountId: string }) {
    this.apiKey = config.apiKey
    this.accountId = config.accountId
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/account/${this.accountId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`RingBA API error: ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async fetchCalls(filters: CallFilters): Promise<CallRecord[]> {
    try {
      const params = new URLSearchParams({
        account_id: this.accountId,
        limit: "100",
        ...this.buildFilters(filters),
      })

      const response = await fetch(`${this.baseUrl}/calls?${params}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`RingBA API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformCalls(data.calls || [])
    } catch (error) {
      console.error("RingBA fetch error:", error)
      return []
    }
  }

  async getRecordingUrl(callId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/recording`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.recording_url || null
    } catch (error) {
      console.error("RingBA recording fetch error:", error)
      return null
    }
  }

  private buildFilters(filters: CallFilters): Record<string, string> {
    const params: Record<string, string> = {}

    if (filters.dateRange) {
      params.start_date = filters.dateRange.start
      params.end_date = filters.dateRange.end
    }

    if (filters.minDuration) {
      params.min_duration = filters.minDuration.toString()
    }

    if (filters.maxDuration) {
      params.max_duration = filters.maxDuration.toString()
    }

    if (filters.campaigns?.length) {
      params.campaign_ids = filters.campaigns.join(",")
    }

    if (filters.directions?.length) {
      params.directions = filters.directions.join(",")
    }

    return params
  }

  private transformCalls(ringbaCalls: any[]): CallRecord[] {
    return ringbaCalls.map((call) => ({
      id: `ringba_${call.id}`,
      integrationId: "ringba",
      externalId: call.id,
      direction: call.direction,
      fromNumber: call.caller_id,
      toNumber: call.called_number,
      duration: call.duration,
      startTime: call.start_time,
      endTime: call.end_time,
      recordingUrl: call.recording_url,
      campaignId: call.campaign_id,
      agentId: call.agent_id,
      customerId: call.customer_id,
      disposition: call.disposition,
      status: "pending",
      transcriptionStatus: "pending",
      analysisStatus: "pending",
      metadata: {
        ringbaData: call,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
}
