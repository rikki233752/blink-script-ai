export interface RingBAConfig {
  apiKey: string
  accountId: string
  baseUrl: string
}

export interface RingBAColumn {
  id: string
  title: string
  type: string
  groupName: string
  supportsFilter: boolean
  supportsSorting: boolean
  isComputed: boolean
  roles: string[]
}

export interface RingBACampaign {
  id: string
  name: string
  status: string
  type: string
  isActive: boolean
  totalCalls: number
  conversionRate: number
}

export interface RingBACallLogRaw {
  inboundCallId: string
  callDt: string
  campaignId: string
  campaignName: string
  inboundPhoneNumber: string
  callLengthInSeconds: number
  hasConnected: boolean
  hasConverted: boolean
  recordingUrl: string | null
  hasRecording: boolean
  buyer: string
  targetName: string
}

export interface TransformedCallLog {
  id: string
  campaignId: string
  callerId: string
  startTime: string
  duration: number
  hasRecording: boolean
  recordingUrl: string | null
  agentName: string
  status: "connected" | "not-connected"
  disposition: "converted" | "not-converted"
}

export class RingBAComprehensiveClient {
  private config: RingBAConfig
  private baseUrl: string
  private availableColumns: RingBAColumn[] = []

  constructor(config: RingBAConfig) {
    this.config = config
    this.baseUrl = `${config.baseUrl}/${config.accountId}`
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Token ${this.config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }
  }

  /**
   * STEP 1: Test connection to RingBA API
   */
  async testConnection(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log("🔍 STEP 1: Testing RingBA connection...")

      const response = await fetch(`${this.baseUrl}/account`, {
        method: "GET",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Connection failed: ${response.status} - ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("✅ STEP 1 COMPLETE: RingBA connection successful")

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown connection error",
      }
    }
  }

  /**
   * STEP 2: Get available columns (REQUIRED FIRST)
   */
  async getAvailableColumns(): Promise<{ success: boolean; columns?: RingBAColumn[]; error?: string }> {
    try {
      console.log("📊 STEP 2: Fetching available columns...")

      const response = await fetch(`${this.baseUrl}/calllogs/columns`, {
        method: "GET",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to fetch columns: ${response.status} - ${errorText}`,
        }
      }

      const columns: RingBAColumn[] = await response.json()
      this.availableColumns = columns
      console.log(`✅ STEP 2 COMPLETE: Found ${columns.length} available columns`)

      return {
        success: true,
        columns,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error fetching columns",
      }
    }
  }

  /**
   * STEP 3: Fetch campaigns
   */
  async getCampaigns(): Promise<{ success: boolean; campaigns?: RingBACampaign[]; error?: string }> {
    try {
      console.log("🎯 STEP 3: Fetching campaigns...")

      const response = await fetch(`${this.baseUrl}/campaigns`, {
        method: "GET",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to fetch campaigns: ${response.status} - ${errorText}`,
        }
      }

      const rawCampaigns = await response.json()

      // Transform campaigns to our format
      const campaigns: RingBACampaign[] = (Array.isArray(rawCampaigns) ? rawCampaigns : [rawCampaigns]).map(
        (campaign: any) => ({
          id: campaign.id || campaign.campaignId || "",
          name: campaign.name || campaign.campaignName || "Unknown Campaign",
          status: campaign.status || "unknown",
          type: campaign.type || "standard",
          isActive: campaign.status === "active" || campaign.isActive === true,
          totalCalls: Number.parseInt(campaign.totalCalls || campaign.callCount || "0"),
          conversionRate: Number.parseFloat(campaign.conversionRate || campaign.conv_rate || "0"),
        }),
      )

      console.log(`✅ STEP 3 COMPLETE: Found ${campaigns.length} campaigns`)

      return {
        success: true,
        campaigns,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error fetching campaigns",
      }
    }
  }

  /**
   * STEP 4: Fetch call logs with EXACT POST request structure
   */
  async getCallLogs(
    campaignId: string,
    options: {
      reportStart?: string
      reportEnd?: string
      offset?: number
      size?: number
    } = {},
  ): Promise<{ success: boolean; callLogs?: TransformedCallLog[]; error?: string; totalRecords?: number }> {
    try {
      console.log(`📞 STEP 4: Fetching call logs for campaign: ${campaignId}`)

      // Build the EXACT request body structure
      const requestBody = {
        reportStart: options.reportStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        reportEnd: options.reportEnd || new Date().toISOString(),
        offset: options.offset || 0,
        size: options.size || 100,
        filters: [
          {
            anyConditionToMatch: [
              {
                column: "campaignId",
                value: campaignId,
                isNegativeMatch: false,
                comparisonType: "EQUALS",
              },
            ],
          },
        ],
        valueColumns: [
          { column: "inboundCallId" },
          { column: "callDt" },
          { column: "campaignId" },
          { column: "campaignName" },
          { column: "inboundPhoneNumber" },
          { column: "callLengthInSeconds" },
          { column: "hasConnected" },
          { column: "hasConverted" },
          { column: "recordingUrl" },
          { column: "hasRecording" },
          { column: "buyer" },
          { column: "targetName" },
        ],
      }

      console.log("📋 EXACT Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${this.baseUrl}/calllogs`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to fetch call logs: ${response.status} - ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("📡 Raw API response structure:", {
        isSuccessful: data.isSuccessful,
        hasReport: !!data.report,
        hasRecords: !!data.report?.records,
        recordCount: data.report?.records?.length || 0,
      })

      // STEP 5: Handle the response structure properly
      let rawCallLogs: RingBACallLogRaw[] = []
      let totalRecords = 0

      if (data.isSuccessful && data.report) {
        if (Array.isArray(data.report.records)) {
          rawCallLogs = data.report.records
          totalRecords = data.report.totalRecords || rawCallLogs.length
        } else if (Array.isArray(data.report)) {
          rawCallLogs = data.report
          totalRecords = rawCallLogs.length
        }
      } else if (Array.isArray(data.records)) {
        rawCallLogs = data.records
        totalRecords = data.totalRecords || rawCallLogs.length
      } else if (Array.isArray(data)) {
        rawCallLogs = data
        totalRecords = data.length
      }

      // STEP 6: Transform data to the app's format
      const transformedCallLogs: TransformedCallLog[] = rawCallLogs.map((record) => ({
        id: record.inboundCallId,
        campaignId: record.campaignId,
        callerId: record.inboundPhoneNumber,
        startTime: new Date(record.callDt).toISOString(),
        duration: Number.parseInt(record.callLengthInSeconds?.toString() || "0"),
        hasRecording: record.hasRecording,
        recordingUrl: record.recordingUrl,
        agentName: record.buyer || record.targetName,
        status: record.hasConnected ? "connected" : "not-connected",
        disposition: record.hasConverted ? "converted" : "not-converted",
      }))

      console.log(`✅ STEP 4-6 COMPLETE: Transformed ${transformedCallLogs.length} call logs`)

      return {
        success: true,
        callLogs: transformedCallLogs,
        totalRecords,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error fetching call logs",
      }
    }
  }

  /**
   * Get all available columns for reference
   */
  getRecommendedColumns(): string[] {
    return [
      "inboundCallId",
      "callDt",
      "campaignId",
      "campaignName",
      "inboundPhoneNumber",
      "callLengthInSeconds",
      "hasConnected",
      "hasConverted",
      "recordingUrl",
      "hasRecording",
      "buyer",
      "targetName",
    ]
  }

  /**
   * Get columns that are available and recommended
   */
  getValidColumns(): string[] {
    const recommended = this.getRecommendedColumns()
    const available = this.availableColumns.map((col) => col.id)
    return recommended.filter((col) => available.includes(col))
  }
}
