import { transcribeCall } from "@/app/actions/transcribe-call"

interface RingBAConfig {
  apiKey: string
  accountId: string
  baseUrl: string
  syncInterval: number
  enabled: boolean
}

interface RingBACall {
  id: string
  direction: string
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
}

class RingBABackendService {
  private static instance: RingBABackendService
  private config: RingBAConfig | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private isProcessing = false
  private syncListeners: ((status: { syncing: boolean; count?: number; error?: string }) => void)[] = []

  static getInstance(): RingBABackendService {
    if (!RingBABackendService.instance) {
      RingBABackendService.instance = new RingBABackendService()
      // Only auto-initialize if we have valid credentials
      if (process.env.RINGBA_API_KEY && process.env.RINGBA_ACCOUNT_ID) {
        RingBABackendService.instance.initializeFromEnv().catch((error) => {
          console.warn("RingBA auto-initialization skipped:", error.message)
        })
      } else {
        console.log("RingBA credentials not found, skipping auto-initialization")
      }
    }
    return RingBABackendService.instance
  }

  private async initializeFromEnv(): Promise<void> {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      throw new Error("Missing RingBA credentials")
    }

    const config: RingBAConfig = {
      apiKey,
      accountId,
      baseUrl: "https://api.ringba.com/v2",
      syncInterval: 15,
      enabled: true,
    }

    try {
      await this.initialize(config)
      console.log("✅ RingBA auto-initialized from environment variables")
    } catch (error) {
      console.warn("❌ RingBA auto-initialization failed:", error)
      throw error
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

    console.log("✅ RingBA Backend Service initialized successfully")
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RINGBA_API_KEY || this.config?.apiKey
    const accountId = process.env.RINGBA_ACCOUNT_ID || this.config?.accountId

    if (!apiKey || !accountId) {
      return { success: false, error: "Missing API key or account ID" }
    }

    try {
      const response = await fetch(`https://api.ringba.com/v2/account/${accountId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    if (!this.config) return

    console.log(`🔄 Starting RingBA auto-sync every ${this.config.syncInterval} minutes`)

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncCalls()
      } catch (error) {
        console.error("RingBA auto-sync failed:", error)
      }
    }, this.config.syncInterval * 60000)

    // Run initial sync
    this.syncCalls()
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

  // Manual sync function that can be triggered by the user
  async manualSync(days = 7): Promise<{ success: boolean; count?: number; error?: string }> {
    if (this.isProcessing) {
      return { success: false, error: "Sync already in progress" }
    }

    try {
      this.notifySyncListeners({ syncing: true })

      // Calculate start date based on days parameter
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Fetch calls from the specified time period
      const calls = await this.fetchCalls({
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
        limit: "100", // Increase limit for manual sync
      })

      console.log(`📞 Found ${calls.length} calls to process in manual sync`)
      this.notifySyncListeners({ syncing: true, count: calls.length })

      let processed = 0
      let failed = 0

      for (const call of calls) {
        try {
          await this.processCall(call)
          processed++
          // Update listeners with progress
          this.notifySyncListeners({
            syncing: true,
            count: processed,
          })
          console.log(`✅ Processed call ${call.id} (${processed}/${calls.length})`)
        } catch (error) {
          failed++
          console.error(`❌ Failed to process call ${call.id}:`, error)
        }
      }

      // Update last sync time
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("ringba_last_sync", new Date().toISOString())
        localStorage.setItem("ringba_last_manual_sync", new Date().toISOString())
      }

      console.log(`🎯 RingBA manual sync complete: ${processed} processed, ${failed} failed`)

      this.notifySyncListeners({ syncing: false, count: processed })
      return { success: true, count: processed }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("RingBA manual sync error:", error)
      this.notifySyncListeners({ syncing: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  async syncCalls(): Promise<void> {
    if (!this.config || this.isProcessing) {
      return
    }

    this.isProcessing = true
    this.notifySyncListeners({ syncing: true })
    console.log("🔄 Starting RingBA call sync...")

    try {
      // Get last sync time from storage
      const lastSync =
        (typeof localStorage !== "undefined" ? localStorage.getItem("ringba_last_sync") : null) ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // Fetch new calls since last sync
      const calls = await this.fetchCalls({
        start_date: lastSync,
        end_date: new Date().toISOString(),
        limit: "50",
      })

      console.log(`📞 Found ${calls.length} new calls to process`)
      this.notifySyncListeners({ syncing: true, count: calls.length })

      let processed = 0
      let failed = 0

      for (const call of calls) {
        try {
          await this.processCall(call)
          processed++
          console.log(`✅ Processed call ${call.id}`)
        } catch (error) {
          failed++
          console.error(`❌ Failed to process call ${call.id}:`, error)
        }
      }

      // Update last sync time
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("ringba_last_sync", new Date().toISOString())
      }

      console.log(`🎯 RingBA sync complete: ${processed} processed, ${failed} failed`)
      this.notifySyncListeners({ syncing: false, count: processed })
    } catch (error) {
      console.error("RingBA sync error:", error)
      this.notifySyncListeners({
        syncing: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      this.isProcessing = false
    }
  }

  private async fetchCalls(params: Record<string, string>): Promise<RingBACall[]> {
    const apiKey = process.env.RINGBA_API_KEY || this.config?.apiKey
    const accountId = process.env.RINGBA_ACCOUNT_ID || this.config?.accountId
    const baseUrl = this.config?.baseUrl || "https://api.ringba.com/v2"

    if (!apiKey || !accountId) return []

    try {
      const queryParams = new URLSearchParams({
        account_id: accountId,
        ...params,
      })

      const response = await fetch(`${baseUrl}/calls?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`RingBA API error: ${response.status}`)
      }

      const data = await response.json()
      return data.calls || []
    } catch (error) {
      console.error("Failed to fetch calls from RingBA:", error)
      return []
    }
  }

  async processWebhookCall(call: RingBACall): Promise<void> {
    // Process a call that came from a webhook
    return this.processCall(call)
  }

  private async processCall(call: RingBACall): Promise<void> {
    try {
      // Check if call already processed
      const existingCalls =
        typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem("uploadedCalls") || "[]") : []
      const exists = existingCalls.find((c: any) => c.externalId === call.id)

      if (exists) {
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

      // Transcribe and analyze
      console.log(`🎯 Transcribing call ${call.id} with Deepgram`)
      const formData = new FormData()
      formData.append("audio", audioFile)

      const transcriptionResult = await transcribeCall(formData)

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
        }

        existingCalls.push(callData)
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))
        }

        console.log(`✅ Successfully processed RingBA call ${call.id}`)
      } else {
        throw new Error(transcriptionResult.error || "Transcription failed")
      }
    } catch (error) {
      console.error(`Failed to process call ${call.id}:`, error)
      throw error
    }
  }

  private async getRecordingUrl(callId: string): Promise<string | null> {
    const apiKey = process.env.RINGBA_API_KEY || this.config?.apiKey
    const baseUrl = this.config?.baseUrl || "https://api.ringba.com/v2"

    if (!apiKey) return null

    try {
      const response = await fetch(`${baseUrl}/calls/${callId}/recording`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.recording_url || null
    } catch (error) {
      console.error("Failed to get recording URL:", error)
      return null
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log("🛑 RingBA auto-sync stopped")
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

  getStats(): { totalCalls: number; lastSync: string; isActive: boolean } {
    const uploadedCalls =
      typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem("uploadedCalls") || "[]") : []
    const ringbaCalls = uploadedCalls.filter((call: any) => call.integrationSource === "RingBA")

    return {
      totalCalls: ringbaCalls.length,
      lastSync: (typeof localStorage !== "undefined" ? localStorage.getItem("ringba_last_sync") : null) || "Never",
      isActive: (this.config?.enabled && this.syncInterval !== null) || false,
    }
  }
}

export { RingBABackendService }
export type { RingBAConfig }
