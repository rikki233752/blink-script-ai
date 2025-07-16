export interface RingBAConfig {
  apiKey: string
  accountId: string
  baseUrl: string
}

export interface RingBAColumn {
  id: string
  title: string
  roles: string[]
  type: string
  isTag: boolean
  groupName: string
  filterGroupName?: string
  supportsFilter: boolean
  supportsSorting: boolean
  isComputed: boolean
}

export interface RingBACampaign {
  id: string
  name: string
  status: string
  type: string
  isActive: boolean
  totalCalls: number
  conversionRate: number
  metadata?: any
}

export interface RingBACallLog {
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
  metadata?: any
}

export interface CallLogsRequest {
  reportStart: string
  reportEnd: string
  offset: number
  size: number
  filters: Array<{
    anyConditionToMatch: Array<{
      column: string
      value: string
      isNegativeMatch: boolean
      comparisonType: string
    }>
  }>
  valueColumns: Array<{ column: string }>
}

export class RingBAApiClient {
  private config: RingBAConfig
  private baseUrl: string

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
      console.log("🔍 Testing RingBA connection...")

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
      console.log("✅ RingBA connection successful")

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
      console.log("📊 Fetching available columns...")

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
      console.log(`✅ Found ${columns.length} available columns`)

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
      console.log("🎯 Fetching campaigns...")

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
          metadata: campaign,
        }),
      )

      console.log(`✅ Found ${campaigns.length} campaigns`)

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
  ): Promise<{ success: boolean; callLogs?: RingBACallLog[]; error?: string; totalRecords?: number }> {
    try {
      console.log(`📞 Fetching call logs for campaign: ${campaignId}`)

      // Build the EXACT request body structure
      const requestBody: CallLogsRequest = {
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
          { column: "publisherName" },
          { column: "targetNumber" },
          { column: "payoutAmount" },
          { column: "conversionAmount" },
          { column: "connectedCallLengthInSeconds" },
          { column: "timeToConnectInSeconds" },
        ],
      }

      console.log("📋 Request body:", JSON.stringify(requestBody, null, 2))

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
      console.log("📡 Raw call logs response:", data)

      // Handle the exact API response structure
      let callLogsData = []
      let totalRecords = 0

      if (data.isSuccessful && data.report) {
        if (Array.isArray(data.report.records)) {
          callLogsData = data.report.records
          totalRecords = data.report.totalRecords || callLogsData.length
        } else if (Array.isArray(data.report)) {
          callLogsData = data.report
          totalRecords = callLogsData.length
        }
      } else if (Array.isArray(data.records)) {
        callLogsData = data.records
        totalRecords = data.totalRecords || callLogsData.length
      } else if (Array.isArray(data)) {
        callLogsData = data
        totalRecords = data.length
      }

      // Transform call logs to our format
      const callLogs: RingBACallLog[] = callLogsData.map((call: any) => ({
        inboundCallId: call.inboundCallId || call.callId || "",
        callDt: call.callDt || call.callStartTime || new Date().toISOString(),
        campaignId: call.campaignId || "",
        campaignName: call.campaignName || "Unknown Campaign",
        inboundPhoneNumber: call.inboundPhoneNumber || call.callerId || "",
        callLengthInSeconds: Number.parseInt(call.callLengthInSeconds || call.duration || "0"),
        hasConnected: Boolean(call.hasConnected),
        hasConverted: Boolean(call.hasConverted),
        recordingUrl: call.recordingUrl || null,
        hasRecording: Boolean(call.hasRecording),
        buyer: call.buyer || "Unknown",
        targetName: call.targetName || "Unknown",
        metadata: call,
      }))

      console.log(`✅ Found ${callLogs.length} call logs (${totalRecords} total)`)

      return {
        success: true,
        callLogs,
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
   * Get call logs with pagination
   */
  async getAllCallLogs(
    campaignId: string,
    options: {
      reportStart?: string
      reportEnd?: string
      pageSize?: number
      maxPages?: number
    } = {},
  ): Promise<{ success: boolean; callLogs?: RingBACallLog[]; error?: string; totalRecords?: number }> {
    const pageSize = options.pageSize || 100
    const maxPages = options.maxPages || 10
    let allCallLogs: RingBACallLog[] = []
    let totalRecords = 0
    let currentPage = 0

    while (currentPage < maxPages) {
      const result = await this.getCallLogs(campaignId, {
        ...options,
        offset: currentPage * pageSize,
        size: pageSize,
      })

      if (!result.success) {
        return result
      }

      if (!result.callLogs || result.callLogs.length === 0) {
        break
      }

      allCallLogs = [...allCallLogs, ...result.callLogs]
      totalRecords = result.totalRecords || allCallLogs.length

      // If we got fewer records than page size, we're done
      if (result.callLogs.length < pageSize) {
        break
      }

      currentPage++
    }

    return {
      success: true,
      callLogs: allCallLogs,
      totalRecords,
    }
  }
}
