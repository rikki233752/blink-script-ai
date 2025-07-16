import type { CallRecord, CallFilters } from "./types"

export class TwilioService {
  private accountSid: string
  private authToken: string
  private baseUrl: string

  constructor(config: { accountSid: string; authToken: string }) {
    this.accountSid = config.accountSid
    this.authToken = config.authToken
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}.json`, {
        headers: {
          Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`)
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
        PageSize: "100",
        ...this.buildFilters(filters),
      })

      const response = await fetch(`${this.baseUrl}/Calls.json?${params}`, {
        headers: {
          Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformCalls(data.calls || [])
    } catch (error) {
      console.error("Twilio fetch error:", error)
      return []
    }
  }

  async getRecordingUrl(callSid: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/Calls/${callSid}/Recordings.json`, {
        headers: {
          Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const recording = data.recordings?.[0]

      if (recording) {
        return `https://api.twilio.com${recording.uri.replace(".json", ".wav")}`
      }

      return null
    } catch (error) {
      console.error("Twilio recording fetch error:", error)
      return null
    }
  }

  private buildFilters(filters: CallFilters): Record<string, string> {
    const params: Record<string, string> = {}

    if (filters.dateRange) {
      params.StartTime = filters.dateRange.start
      params.EndTime = filters.dateRange.end
    }

    if (filters.directions?.length) {
      // Twilio doesn't have a direct direction filter, but we can filter by To/From
    }

    return params
  }

  private transformCalls(twilioCalls: any[]): CallRecord[] {
    return twilioCalls.map((call) => ({
      id: `twilio_${call.sid}`,
      integrationId: "twilio",
      externalId: call.sid,
      direction: call.direction,
      fromNumber: call.from,
      toNumber: call.to,
      duration: Number.parseInt(call.duration) || 0,
      startTime: call.start_time,
      endTime: call.end_time,
      recordingUrl: undefined, // Will be fetched separately
      campaignId: undefined,
      agentId: undefined,
      customerId: undefined,
      disposition: call.status,
      status: "pending",
      transcriptionStatus: "pending",
      analysisStatus: "pending",
      metadata: {
        twilioData: call,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
}
