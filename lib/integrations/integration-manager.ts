import type { Integration, CallRecord, SyncResult } from "./types"
import { RingBAService } from "./ringba-service"
import { TwilioService } from "./twilio-service"
import { transcribeCall } from "@/app/actions/transcribe-call"

export class IntegrationManager {
  private static instance: IntegrationManager
  private integrations: Map<string, Integration> = new Map()
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isProcessing = false

  static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager()
    }
    return IntegrationManager.instance
  }

  async addIntegration(integration: Integration): Promise<void> {
    // Test connection first
    const service = this.createService(integration)
    const testResult = await service.testConnection()

    if (!testResult.success) {
      throw new Error(`Integration test failed: ${testResult.error}`)
    }

    this.integrations.set(integration.id, {
      ...integration,
      status: "active",
      lastSync: new Date().toISOString(),
    })

    // Start automatic syncing
    this.startAutoSync(integration.id)

    // Save to localStorage
    this.saveIntegrations()
  }

  async removeIntegration(integrationId: string): Promise<void> {
    this.stopAutoSync(integrationId)
    this.integrations.delete(integrationId)
    this.saveIntegrations()
  }

  async syncIntegration(integrationId: string): Promise<SyncResult> {
    const integration = this.integrations.get(integrationId)
    if (!integration) {
      throw new Error("Integration not found")
    }

    try {
      integration.status = "active"
      const service = this.createService(integration)

      // Fetch calls from the last sync
      const calls = await service.fetchCalls({
        dateRange: {
          start: integration.lastSync,
          end: new Date().toISOString(),
        },
        ...integration.config.filters,
      })

      let processed = 0
      let failed = 0
      const errors: string[] = []

      // Process each call
      for (const call of calls) {
        try {
          await this.processCall(call, integration)
          processed++
        } catch (error) {
          failed++
          errors.push(`Call ${call.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      // Update integration stats
      integration.lastSync = new Date().toISOString()
      integration.totalCalls += processed
      integration.successRate = ((integration.totalCalls - integration.errorCount) / integration.totalCalls) * 100

      this.saveIntegrations()

      return {
        success: true,
        callsFound: calls.length,
        callsProcessed: processed,
        callsFailed: failed,
        errors,
        nextSyncTime: new Date(Date.now() + integration.config.syncInterval * 60000).toISOString(),
      }
    } catch (error) {
      integration.status = "error"
      integration.errorCount++
      this.saveIntegrations()

      return {
        success: false,
        callsFound: 0,
        callsProcessed: 0,
        callsFailed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        nextSyncTime: new Date(Date.now() + integration.config.syncInterval * 60000).toISOString(),
      }
    }
  }

  private async processCall(call: CallRecord, integration: Integration): Promise<void> {
    try {
      // Check if call already exists
      const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
      const exists = existingCalls.find((c: any) => c.externalId === call.externalId)

      if (exists) {
        console.log(`Call ${call.id} already processed, skipping`)
        return
      }

      // Get recording URL if not present
      if (!call.recordingUrl) {
        const service = this.createService(integration)
        call.recordingUrl = await service.getRecordingUrl(call.externalId)
      }

      if (!call.recordingUrl) {
        throw new Error("No recording URL available")
      }

      // Download and transcribe the recording
      if (integration.config.autoTranscribe) {
        call.transcriptionStatus = "processing"

        const audioResponse = await fetch(call.recordingUrl)
        if (!audioResponse.ok) {
          throw new Error("Failed to download recording")
        }

        const audioBlob = await audioResponse.blob()
        const audioFile = new File([audioBlob], `${call.id}.wav`, { type: "audio/wav" })

        const formData = new FormData()
        formData.append("audio", audioFile)

        const transcriptionResult = await transcribeCall(formData)

        if (transcriptionResult.success && transcriptionResult.data) {
          call.transcriptionStatus = "completed"
          call.analysisStatus = "completed"
          call.status = "completed"

          // Save the processed call
          const callData = {
            ...call,
            transcript: transcriptionResult.data.transcript,
            analysis: transcriptionResult.data.analysis,
            fileName: audioFile.name,
            fileSize: audioFile.size,
            duration: transcriptionResult.data.duration,
            provider: transcriptionResult.data.provider,
            automated: true,
            integrationSource: integration.name,
          }

          existingCalls.push(callData)
          localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))

          console.log(`✅ Successfully processed call ${call.id} from ${integration.name}`)
        } else {
          throw new Error(transcriptionResult.error || "Transcription failed")
        }
      }
    } catch (error) {
      call.status = "failed"
      call.transcriptionStatus = "failed"
      call.analysisStatus = "failed"
      throw error
    }
  }

  private createService(integration: Integration): any {
    switch (integration.type) {
      case "ringba":
        return new RingBAService({
          apiKey: integration.config.apiKey!,
          accountId: integration.config.accountId!,
        })
      case "twilio":
        return new TwilioService({
          accountSid: integration.config.accountId!,
          authToken: integration.config.apiSecret!,
        })
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`)
    }
  }

  private startAutoSync(integrationId: string): void {
    const integration = this.integrations.get(integrationId)
    if (!integration) return

    const interval = setInterval(async () => {
      try {
        await this.syncIntegration(integrationId)
      } catch (error) {
        console.error(`Auto-sync failed for ${integrationId}:`, error)
      }
    }, integration.config.syncInterval * 60000)

    this.syncIntervals.set(integrationId, interval)
  }

  private stopAutoSync(integrationId: string): void {
    const interval = this.syncIntervals.get(integrationId)
    if (interval) {
      clearInterval(interval)
      this.syncIntervals.delete(integrationId)
    }
  }

  private saveIntegrations(): void {
    const integrationsArray = Array.from(this.integrations.values())
    localStorage.setItem("integrations", JSON.stringify(integrationsArray))
  }

  loadIntegrations(): void {
    try {
      const saved = localStorage.getItem("integrations")
      if (saved) {
        const integrations: Integration[] = JSON.parse(saved)
        integrations.forEach((integration) => {
          this.integrations.set(integration.id, integration)
          if (integration.status === "active") {
            this.startAutoSync(integration.id)
          }
        })
      }
    } catch (error) {
      console.error("Failed to load integrations:", error)
    }
  }

  getIntegrations(): Integration[] {
    return Array.from(this.integrations.values())
  }

  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id)
  }

  async syncAllIntegrations(): Promise<void> {
    const activeIntegrations = Array.from(this.integrations.values()).filter((i) => i.status === "active")

    for (const integration of activeIntegrations) {
      try {
        await this.syncIntegration(integration.id)
      } catch (error) {
        console.error(`Failed to sync ${integration.name}:`, error)
      }
    }
  }
}
