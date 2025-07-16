interface RingBAConfig {
  apiKey: string
  accountId: string
  baseUrl: string
  syncInterval: number
  enabled: boolean
  autoProcess: boolean
  webhookUrl?: string
}

interface RingBACall {
  id: string
  direction: "inbound" | "outbound"
  caller_id: string
  called_number: string
  duration: number
  start_time: string
  end_time: string
  recording_url?: string
  campaign_id?: string
  agent_id?: string
  customer_id?: string
  disposition?: string
  status?: string
}

interface CallFilters {
  dateRange?: {
    start: string
    end: string
  }
  minDuration?: number
  maxDuration?: number
  campaigns?: string[]
  directions?: string[]
  limit?: string
}

class RingBAEnhancedService {
  private static instance: RingBAEnhancedService
  private config: RingBAConfig | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private isProcessing = false
  private syncListeners: ((status: { syncing: boolean; count?: number; error?: string }) => void)[] = []
  private processQueue: RingBACall[] = []
  private isProcessingQueue = false

  static getInstance(): RingBAEnhancedService {
    if (!RingBAEnhancedService.instance) {
      RingBAEnhancedService.instance = new RingBAEnhancedService()
      // Auto-initialize with environment variables
      RingBAEnhancedService.instance.initializeFromEnv()
    }
    return RingBAEnhancedService.instance
  }

  private async initializeFromEnv(): Promise<void> {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (apiKey && accountId) {
      const config: RingBAConfig = {
        apiKey,
        accountId,
        baseUrl: "https://api.ringba.com/v2",
        syncInterval: 15,
        enabled: true,
        autoProcess: true,
      }

      try {
        await this.initialize(config)
        console.log("✅ RingBA Enhanced Service auto-initialized from environment variables")
      } catch (error) {
        console.error("❌ RingBA Enhanced Service auto-initialization failed:", error)
      }
    }
  }

  async initialize(config: RingBAConfig): Promise<void> {
    this.config = config

    // Test connection first
    const testResult = await this.testConnection()
    if (!testResult.success) {
      throw new Error(`RingBA connection failed: ${testResult.error}`)
    }

    // Start automatic syncing if enabled
    if (config.enabled) {
      this.startAutoSync()
    }

    // Start processing queue
    this.startProcessingQueue()

    console.log("✅ RingBA Enhanced Service initialized successfully")
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RINGBA_API_KEY || this.config?.apiKey
    const accountId = process.env.RINGBA_ACCOUNT_ID || this.config?.accountId

    if (!apiKey || !accountId) {
      return { success: false, error: "Missing API key or account ID" }
    }

    try {
      // Test with the accounts endpoint first
      const response = await fetch(`https://api.ringba.com/v2/accounts/${accountId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`RingBA connection test failed:`, errorText)
        throw new Error(`RingBA API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("RingBA connection test successful:", data)
      return { success: true }
    } catch (error) {
      console.error("RingBA connection test error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    if (!this.config) return

    console.log(`🔄 Starting RingBA enhanced auto-sync every ${this.config.syncInterval} minutes`)

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncRecentCalls()
      } catch (error) {
        console.error("RingBA enhanced auto-sync failed:", error)
      }
    }, this.config.syncInterval * 60000)

    // Run initial sync
    this.syncRecentCalls()
  }

  private startProcessingQueue(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.processQueue.length > 0) {
        await this.processQueuedCalls()
      }
    }, 5000) // Check every 5 seconds
  }

  // Add a listener for sync status updates
  addSyncListener(listener: (status: { syncing: boolean; count?: number; error?: string }) => void): () => void {
    this.syncListeners.push(listener)
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener)
    }
  }

  // Notify all listeners of sync status
  private notifySyncListeners(status: { syncing: boolean; count?: number; error?: string }): void {
    this.syncListeners.forEach((listener) => listener(status))
  }

  // Enhanced manual sync with better filtering
  async manualSync(
    days = 7,
    options: { autoProcess?: boolean } = {},
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    if (this.isProcessing) {
      return { success: false, error: "Sync already in progress" }
    }

    try {
      this.isProcessing = true
      this.notifySyncListeners({ syncing: true })

      // Calculate start date based on days parameter
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Fetch calls from the specified time period
      const calls = await this.fetchCalls({
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
        limit: "100", // Increase limit for manual sync
        minDuration: 30, // Only calls longer than 30 seconds
      })

      console.log(`📞 Found ${calls.length} calls to process in enhanced manual sync`)
      this.notifySyncListeners({ syncing: true, count: calls.length })

      let processed = 0
      let queued = 0

      for (const call of calls) {
        try {
          // Check if call already exists
          const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
          const exists = existingCalls.find((c: any) => c.externalId === call.id)

          if (exists) {
            console.log(`Call ${call.id} already processed, skipping`)
            continue
          }

          if (options.autoProcess !== false && this.config?.autoProcess) {
            // Add to processing queue
            this.processQueue.push(call)
            queued++
          } else {
            // Just save the call metadata
            await this.saveCallMetadata(call)
            processed++
          }

          // Update listeners with progress
          this.notifySyncListeners({
            syncing: true,
            count: processed + queued,
          })
        } catch (error) {
          console.error(`❌ Failed to handle call ${call.id}:`, error)
        }
      }

      // Update last sync time
      localStorage.setItem("ringba_last_sync", new Date().toISOString())
      localStorage.setItem("ringba_last_manual_sync", new Date().toISOString())

      console.log(`🎯 RingBA enhanced manual sync complete: ${processed} processed, ${queued} queued`)

      this.notifySyncListeners({ syncing: false, count: processed + queued })
      return { success: true, count: processed + queued }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("RingBA enhanced manual sync error:", error)
      this.notifySyncListeners({ syncing: false, error: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      this.isProcessing = false
    }
  }

  async syncRecentCalls(): Promise<void> {
    if (!this.config || this.isProcessing) {
      return
    }

    this.isProcessing = true
    this.notifySyncListeners({ syncing: true })
    console.log("🔄 Starting RingBA enhanced call sync...")

    try {
      // Get last sync time from storage
      const lastSync =
        localStorage.getItem("ringba_last_sync") || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // Fetch new calls since last sync
      const calls = await this.fetchCalls({
        dateRange: {
          start: lastSync,
          end: new Date().toISOString(),
        },
        limit: "50",
        minDuration: 30,
      })

      console.log(`📞 Found ${calls.length} new calls to process`)
      this.notifySyncListeners({ syncing: true, count: calls.length })

      let processed = 0
      let queued = 0

      for (const call of calls) {
        try {
          // Check if call already exists
          const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
          const exists = existingCalls.find((c: any) => c.externalId === call.id)

          if (exists) {
            console.log(`Call ${call.id} already processed, skipping`)
            continue
          }

          if (this.config.autoProcess) {
            // Add to processing queue for automatic processing
            this.processQueue.push(call)
            queued++
          } else {
            // Just save the call metadata
            await this.saveCallMetadata(call)
            processed++
          }

          console.log(`✅ Handled call ${call.id}`)
        } catch (error) {
          console.error(`❌ Failed to handle call ${call.id}:`, error)
        }
      }

      // Update last sync time
      localStorage.setItem("ringba_last_sync", new Date().toISOString())

      console.log(`🎯 RingBA enhanced sync complete: ${processed} processed, ${queued} queued`)
      this.notifySyncListeners({ syncing: false, count: processed + queued })
    } catch (error) {
      console.error("RingBA enhanced sync error:", error)
      this.notifySyncListeners({
        syncing: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      this.isProcessing = false
    }
  }

  private async processQueuedCalls(): Promise<void> {
    if (this.isProcessingQueue || this.processQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log(`🎯 Processing ${this.processQueue.length} queued calls...`)

    while (this.processQueue.length > 0) {
      const call = this.processQueue.shift()
      if (call) {
        try {
          await this.processCall(call)
          console.log(`✅ Processed queued call ${call.id}`)
          // Small delay to prevent overwhelming the system
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (error) {
          console.error(`❌ Failed to process queued call ${call.id}:`, error)
          // Save call with error status
          await this.saveCallMetadata(call, error instanceof Error ? error.message : "Processing failed")
        }
      }
    }

    this.isProcessingQueue = false
    console.log("🎯 Finished processing queued calls")
  }

  private async fetchCalls(filters: CallFilters): Promise<RingBACall[]> {
    const apiKey = process.env.RINGBA_API_KEY || this.config?.apiKey
    const accountId = process.env.RINGBA_ACCOUNT_ID || this.config?.accountId
    const baseUrl = this.config?.baseUrl || "https://api.ringba.com/v2"

    if (!apiKey || !accountId) return []

    try {
      // RingBA v2 API uses different endpoint structure
      const queryParams = new URLSearchParams({
        account_id: accountId,
        ...this.buildFilterParams(filters),
      })

      // Use the correct v2 endpoint for calls
      const response = await fetch(`${baseUrl}/accounts/${accountId}/calls?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`RingBA API error ${response.status}:`, errorText)
        throw new Error(`RingBA API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("RingBA API response:", data)

      // Handle different response structures
      const calls = data.data || data.calls || data || []
      return Array.isArray(calls) ? calls : []
    } catch (error) {
      console.error("Failed to fetch calls from RingBA:", error)
      return []
    }
  }

  private buildFilterParams(filters: CallFilters): Record<string, string> {
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

    if (filters.limit) {
      params.limit = filters.limit
    }

    return params
  }

  private async saveCallMetadata(call: RingBACall, error?: string): Promise<void> {
    const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")

    const callData = {
      id: `ringba_${call.id}`,
      externalId: call.id,
      fileName: `ringba_${call.id}.wav`,
      date: call.start_time,
      duration: call.duration,
      integrationSource: "RingBA",
      automated: true,
      status: error ? "failed" : "pending",
      error,
      ringbaData: {
        direction: call.direction,
        callerNumber: call.caller_id,
        calledNumber: call.called_number,
        campaignId: call.campaign_id,
        agentId: call.agent_id,
        disposition: call.disposition,
      },
      recordingUrl: call.recording_url,
    }

    existingCalls.push(callData)
    localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))
  }

  async processCall(call: RingBACall): Promise<void> {
    try {
      // Check if call already processed
      const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
      const exists = existingCalls.find((c: any) => c.externalId === call.id)

      if (exists && exists.analysis) {
        console.log(`Call ${call.id} already processed, skipping`)
        return
      }

      // Get recording URL if not present
      let recordingUrl = call.recording_url
      if (!recordingUrl) {
        recordingUrl = await this.getRecordingUrl(call.id)
      }

      if (!recordingUrl) {
        throw new Error("No recording URL available")
      }

      // Download and process the recording
      console.log(`📥 Downloading recording for call ${call.id}`)
      const audioResponse = await fetch(recordingUrl)
      if (!audioResponse.ok) {
        throw new Error("Failed to download recording")
      }

      const audioBlob = await audioResponse.blob()
      const audioFile = new File([audioBlob], `ringba_${call.id}.wav`, { type: "audio/wav" })

      // Transcribe and analyze using our enhanced API
      console.log(`🎯 Transcribing call ${call.id} with enhanced Deepgram`)
      const formData = new FormData()
      formData.append("audio", audioFile)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const transcriptionResult = await response.json()

      if (transcriptionResult.success && transcriptionResult.data) {
        // Save the processed call
        const callData = {
          id: `ringba_${call.id}`,
          externalId: call.id,
          fileName: audioFile.name,
          date: call.start_time,
          duration: transcriptionResult.data.duration,
          analysis: transcriptionResult.data.analysis,
          transcript: transcriptionResult.data.transcript,
          provider: transcriptionResult.data.provider,
          automated: true,
          integrationSource: "RingBA",
          ringbaData: {
            direction: call.direction,
            callerNumber: call.caller_id,
            calledNumber: call.called_number,
            campaignId: call.campaign_id,
            agentId: call.agent_id,
            disposition: call.disposition,
          },
          recordingUrl,
        }

        const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
        const existingIndex = existingCalls.findIndex((c: any) => c.externalId === call.id)

        if (existingIndex >= 0) {
          existingCalls[existingIndex] = callData
        } else {
          existingCalls.push(callData)
        }

        localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))

        console.log(`✅ Successfully processed RingBA call ${call.id}`)
      } else {
        throw new Error(transcriptionResult.error || "Transcription failed")
      }
    } catch (error) {
      console.error(`Failed to process call ${call.id}:`, error)
      // Save call with error status
      await this.saveCallMetadata(call, error instanceof Error ? error.message : "Processing failed")
      throw error
    }
  }

  private async getRecordingUrl(callId: string): Promise<string | null> {
    const apiKey = process.env.RINGBA_API_KEY || this.config?.apiKey
    const accountId = process.env.RINGBA_ACCOUNT_ID || this.config?.accountId
    const baseUrl = this.config?.baseUrl || "https://api.ringba.com/v2"

    if (!apiKey || !accountId) return null

    try {
      const response = await fetch(`${baseUrl}/accounts/${accountId}/calls/${callId}/recording`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        console.error(`Failed to get recording URL for call ${callId}: ${response.status}`)
        return null
      }

      const data = await response.json()
      return data.recording_url || data.url || null
    } catch (error) {
      console.error("Failed to get recording URL:", error)
      return null
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log("🛑 RingBA enhanced auto-sync stopped")
    }
  }

  updateConfig(config: Partial<RingBAConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...config }

      // Restart sync if interval changed
      if (config.syncInterval && this.config.enabled) {
        this.startAutoSync()
      }
    }
  }

  getStats(): { totalCalls: number; lastSync: string; isActive: boolean; queueLength: number } {
    const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
    const ringbaCalls = uploadedCalls.filter((call: any) => call.integrationSource === "RingBA")

    return {
      totalCalls: ringbaCalls.length,
      lastSync: localStorage.getItem("ringba_last_sync") || "Never",
      isActive: (this.config?.enabled && this.syncInterval !== null) || false,
      queueLength: this.processQueue.length,
    }
  }

  // Manual processing method for individual calls
  async processCallManually(callId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
      const call = uploadedCalls.find((c: any) => c.externalId === callId)

      if (!call) {
        return { success: false, error: "Call not found" }
      }

      if (!call.recordingUrl) {
        return { success: false, error: "No recording URL available" }
      }

      // Create a RingBACall object from stored data
      const ringbaCall: RingBACall = {
        id: call.externalId,
        direction: call.ringbaData?.direction || "inbound",
        caller_id: call.ringbaData?.callerNumber || "",
        called_number: call.ringbaData?.calledNumber || "",
        duration: call.duration || 0,
        start_time: call.date,
        end_time: call.date,
        recording_url: call.recordingUrl,
        campaign_id: call.ringbaData?.campaignId,
        agent_id: call.ringbaData?.agentId,
        disposition: call.ringbaData?.disposition,
      }

      await this.processCall(ringbaCall)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export { RingBAEnhancedService }
export type { RingBAConfig, RingBACall, CallFilters }
