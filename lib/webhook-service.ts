import type { WebhookConfig, WebhookDeliveryResult } from "./webhook-types"
import { deliverWebhook } from "@/app/actions/webhook-actions"
// import { getWebhooks } from "@/app/api/webhook-api" // Declare the getWebhooks function

export class WebhookService {
  private static instance: WebhookService
  private webhooks: WebhookConfig[] = []
  private deliveryQueue: Array<{ webhook: WebhookConfig; event: string; payload: any }> = []
  private isProcessing = false

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService()
    }
    return WebhookService.instance
  }

  // Update the setWebhooks method to handle empty arrays properly
  setWebhooks(webhooks: WebhookConfig[] = []) {
    this.webhooks = webhooks || []
    console.log(`Webhook service initialized with ${this.webhooks.length} webhooks`)
  }

  getWebhooks(): WebhookConfig[] {
    return this.webhooks
  }

  async triggerEvent(event: string, payload: any) {
    if (!this.webhooks || this.webhooks.length === 0) {
      console.log(`No webhooks configured for event: ${event}. Configure webhooks in the Webhooks tab.`)
      return
    }

    const activeWebhooks = this.webhooks.filter((webhook) => webhook.enabled && webhook.events.includes(event))

    if (activeWebhooks.length === 0) {
      console.log(`No active webhooks found for event: ${event}. Check webhook configuration.`)
      return
    }

    console.log(`Triggering ${activeWebhooks.length} webhooks for event: ${event}`)

    for (const webhook of activeWebhooks) {
      this.deliveryQueue.push({ webhook, event, payload })
    }

    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  private async processQueue() {
    this.isProcessing = true

    while (this.deliveryQueue.length > 0) {
      const item = this.deliveryQueue.shift()
      if (!item) continue

      await this.deliverWithRetry(item.webhook, item.event, item.payload)
    }

    this.isProcessing = false
  }

  private async deliverWithRetry(webhook: WebhookConfig, event: string, payload: any, attempt = 1): Promise<void> {
    try {
      const result = await deliverWebhook(webhook, event, payload)

      if (result.success) {
        console.log(`Webhook ${webhook.name} delivered successfully`)
        // Log success
        this.logDelivery(webhook, event, payload, result, attempt)
      } else {
        throw new Error(result.error || `HTTP ${result.statusCode}`)
      }
    } catch (error) {
      console.error(`Webhook ${webhook.name} delivery failed (attempt ${attempt}):`, error)

      if (attempt < webhook.retryAttempts) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        setTimeout(() => {
          this.deliverWithRetry(webhook, event, payload, attempt + 1)
        }, delay)
      } else {
        // Log final failure
        this.logDelivery(
          webhook,
          event,
          payload,
          {
            success: false,
            statusCode: 0,
            responseTime: 0,
            error: error instanceof Error ? error.message : "Unknown error",
            payload,
          },
          attempt,
        )
      }
    }
  }

  private logDelivery(
    webhook: WebhookConfig,
    event: string,
    payload: any,
    result: WebhookDeliveryResult,
    attempt: number,
  ) {
    // In a real implementation, this would save to database
    console.log("Webhook delivery log:", {
      webhookId: webhook.id,
      event,
      status: result.success ? "success" : "failed",
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      payload,
      response: result.response,
      error: result.error,
      timestamp: new Date().toISOString(),
      attempt,
    })
  }

  // Campaign-specific webhook methods
  setCampaignWebhook(campaignId: string, webhookConfig: any) {
    if (typeof window !== "undefined") {
      try {
        const campaignWebhooks = this.getCampaignWebhooks()
        campaignWebhooks[campaignId] = webhookConfig
        localStorage.setItem("campaign_webhooks", JSON.stringify(campaignWebhooks))
        console.log(`Webhook configuration saved for campaign: ${campaignId}`)
      } catch (error) {
        console.error("Failed to save campaign webhook:", error)
      }
    }
  }

  getCampaignWebhooks(): Record<string, any> {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("campaign_webhooks")
        return saved ? JSON.parse(saved) : {}
      } catch (error) {
        console.error("Failed to load campaign webhooks:", error)
        return {}
      }
    }
    return {}
  }

  getCampaignWebhook(campaignId: string): any | null {
    const campaignWebhooks = this.getCampaignWebhooks()
    return campaignWebhooks[campaignId] || null
  }

  async triggerCampaignWebhook(campaignId: string, callData: any) {
    const webhookConfig = this.getCampaignWebhook(campaignId)

    if (!webhookConfig || !webhookConfig.active || !webhookConfig.webhookUrl) {
      console.log(`No active webhook configured for campaign: ${campaignId}`)
      return
    }

    const payload = this.buildWebhookPayload(callData, webhookConfig.payloadConfig, campaignId)

    try {
      const response = await fetch(webhookConfig.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "OnScript-AI-Webhook/1.0",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log(`Webhook delivered successfully to campaign ${campaignId}`)
        this.logWebhookDelivery(campaignId, webhookConfig.webhookUrl, payload, true, response.status)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Webhook delivery failed for campaign ${campaignId}:`, error)
      this.logWebhookDelivery(campaignId, webhookConfig.webhookUrl, payload, false, 0, error.message)

      // Retry logic
      setTimeout(() => {
        this.retryWebhook(campaignId, callData, 1)
      }, 2000)
    }
  }

  private buildWebhookPayload(callData: any, payloadConfig: any, campaignId: string) {
    const payload: any = {
      event: "call.processed",
      timestamp: new Date().toISOString(),
      campaignId: campaignId,
      callId: callData.id || `call-${Date.now()}`,
    }

    // Core Data
    if (payloadConfig.metadata) {
      payload.metadata = {
        sessionId: callData.sessionId || payload.callId,
        source: "OnScript-AI",
        version: "1.0",
        processingTime: new Date().toISOString(),
      }
    }

    if (payloadConfig.callDetails) {
      payload.callDetails = {
        duration: callData.duration || 0,
        startTime: callData.startTime || new Date().toISOString(),
        endTime: callData.endTime || new Date().toISOString(),
        participants: {
          agent: callData.agentName || "Unknown Agent",
          customer: callData.customerName || callData.fileName?.replace(/\.[^/.]+$/, "") || "Unknown Customer",
        },
        phoneNumber: callData.phoneNumber || "Unknown",
        status: callData.status || "completed",
      }
    }

    if (payloadConfig.disposition) {
      payload.disposition = {
        outcome: callData.disposition || "unknown",
        classification: callData.analysis?.businessConversion || "not_classified",
        notes: callData.analysis?.keyInsights?.[0] || "",
      }
    }

    // Analysis & Insights
    if (payloadConfig.scorecard && callData.analysis) {
      payload.scorecard = {
        overallScore: callData.analysis.overallScore || 0,
        rating: callData.analysis.overallRating || "Unknown",
        breakdown: {
          toneQuality: callData.analysis.toneQuality || 0,
          businessConversion: callData.analysis.businessConversion || "unknown",
          agentPerformance: callData.analysis.agentPerformance || 0,
        },
      }
    }

    if (payloadConfig.callSummary && callData.analysis) {
      payload.callSummary = {
        summary: callData.analysis.summary || "",
        keyPoints: callData.analysis.keyInsights || [],
        outcome: callData.analysis.businessConversion || "unknown",
      }
    }

    if (payloadConfig.callFacts && callData.analysis) {
      payload.callFacts = {
        extractedFacts: callData.analysis.extractedFacts || {},
        customerInfo: {
          name: callData.customerName || "Unknown",
          demographics: callData.analysis.demographics || {},
        },
      }
    }

    if (payloadConfig.intent && callData.analysis) {
      payload.intent = {
        primary: callData.analysis.intent || "unknown",
        confidence: callData.analysis.intentConfidence || 0,
        classification: callData.analysis.businessConversion || "not_classified",
      }
    }

    // Content & Transcription
    if (payloadConfig.transcript) {
      payload.transcript = {
        fullText: callData.transcript || "",
        segments: callData.transcriptSegments || [],
        language: "en-US",
        confidence: callData.transcriptConfidence || 0.95,
      }
    }

    if (payloadConfig.markers && callData.analysis) {
      payload.markers = {
        keyMoments: callData.analysis.keyMoments || [],
        highlights: callData.analysis.highlights || [],
        concerns: callData.analysis.concerns || [],
      }
    }

    if (payloadConfig.questions && callData.analysis) {
      payload.questions = {
        agentQuestions: callData.analysis.agentQuestions || [],
        customerQuestions: callData.analysis.customerQuestions || [],
        unansweredQuestions: callData.analysis.unansweredQuestions || [],
      }
    }

    if (payloadConfig.vocalytics && callData.analysis) {
      payload.vocalytics = {
        sentiment: callData.analysis.sentiment || "neutral",
        toneAnalysis: callData.analysis.toneQuality || 0,
        speechMetrics: {
          speakingRate: callData.analysis.speakingRate || 0,
          silenceGaps: callData.analysis.silenceGaps || 0,
          interruptions: callData.analysis.interruptions || 0,
        },
      }
    }

    return payload
  }

  private async retryWebhook(campaignId: string, callData: any, attempt: number) {
    if (attempt > 3) {
      console.log(`Max retry attempts reached for campaign ${campaignId}`)
      return
    }

    console.log(`Retrying webhook for campaign ${campaignId}, attempt ${attempt}`)

    // Exponential backoff
    const delay = Math.pow(2, attempt) * 1000
    setTimeout(() => {
      this.triggerCampaignWebhook(campaignId, callData)
    }, delay)
  }

  private logWebhookDelivery(
    campaignId: string,
    url: string,
    payload: any,
    success: boolean,
    statusCode: number,
    error?: string,
  ) {
    const logEntry = {
      campaignId,
      url,
      timestamp: new Date().toISOString(),
      success,
      statusCode,
      payloadSize: JSON.stringify(payload).length,
      error: error || null,
    }

    console.log("Webhook delivery log:", logEntry)

    // Store in localStorage for debugging
    if (typeof window !== "undefined") {
      try {
        const logs = JSON.parse(localStorage.getItem("webhook_logs") || "[]")
        logs.unshift(logEntry)
        // Keep only last 100 logs
        if (logs.length > 100) logs.splice(100)
        localStorage.setItem("webhook_logs", JSON.stringify(logs))
      } catch (error) {
        console.error("Failed to store webhook log:", error)
      }
    }
  }

  async testCampaignWebhook(campaignId: string): Promise<{ success: boolean; message: string; statusCode?: number }> {
    const webhookConfig = this.getCampaignWebhook(campaignId)

    if (!webhookConfig || !webhookConfig.webhookUrl) {
      return { success: false, message: "No webhook URL configured" }
    }

    // Generate test payload
    const testPayload = this.generateSamplePayload(campaignId, webhookConfig.payloadConfig)

    try {
      const response = await fetch(webhookConfig.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "OnScript-AI-Webhook-Test/1.0",
          "X-OnScript-Test": "true",
        },
        body: JSON.stringify(testPayload),
      })

      if (response.ok) {
        return {
          success: true,
          message: "Test webhook delivered successfully",
          statusCode: response.status,
        }
      } else {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error.message}`,
      }
    }
  }

  generateSamplePayload(campaignId: string, payloadConfig: any) {
    const sampleCallData = {
      id: "sample-call-123",
      duration: 432,
      startTime: new Date(Date.now() - 432000).toISOString(),
      endTime: new Date().toISOString(),
      agentName: "John Smith",
      customerName: "Jane Doe",
      phoneNumber: "+1-555-0123",
      status: "completed",
      disposition: "interested",
      transcript:
        "Agent: Hello, this is John from ABC Insurance. How are you today?\nCustomer: I'm doing well, thank you. I received your call about Medicare plans.\nAgent: Great! I'd love to help you understand your options...",
      analysis: {
        overallScore: 8.5,
        overallRating: "Excellent",
        toneQuality: 9.0,
        businessConversion: "interested",
        agentPerformance: 8.8,
        summary:
          "Customer showed strong interest in Medicare Advantage plans. Agent provided clear information and scheduled follow-up.",
        keyInsights: [
          "Customer is turning 65 next month",
          "Currently has employer insurance ending soon",
          "Interested in prescription drug coverage",
        ],
        intent: "purchase_intent",
        sentiment: "positive",
        extractedFacts: {
          age: "64",
          zipCode: "90210",
          currentInsurance: "employer_plan",
        },
      },
    }

    return this.buildWebhookPayload(sampleCallData, payloadConfig, campaignId)
  }
}

// Webhook event triggers for call analysis
export async function triggerCallAnalyzedWebhook(callData: any) {
  const webhookService = WebhookService.getInstance()

  const payload = {
    event: "call.analyzed",
    timestamp: new Date().toISOString(),
    data: {
      callId: callData.id || `call-${Date.now()}`,
      fileName: callData.fileName,
      duration: callData.duration,
      customerName: callData.fileName?.replace(/\.[^/.]+$/, "") || "Unknown",
      analysis: {
        overallScore: callData.analysis.overallScore,
        rating: callData.analysis.overallRating,
        toneQuality: callData.analysis.toneQuality,
        businessConversion: callData.analysis.businessConversion,
        agentPerformance: callData.analysis.agentPerformance,
        keyInsights: callData.analysis.keyInsights,
        improvementSuggestions: callData.analysis.improvementSuggestions,
      },
      transcript: callData.transcript,
      provider: callData.provider,
    },
  }

  await webhookService.triggerEvent("call.analyzed", payload)
}

export async function triggerQualityAlertWebhook(callData: any) {
  if (callData.analysis.overallScore < 5) {
    const webhookService = WebhookService.getInstance()

    const payload = {
      event: "quality.alert",
      timestamp: new Date().toISOString(),
      data: {
        callId: callData.id || `call-${Date.now()}`,
        alertType: "low_quality_score",
        severity: callData.analysis.overallScore < 3 ? "high" : "medium",
        score: callData.analysis.overallScore,
        rating: callData.analysis.overallRating,
        customerName: callData.fileName?.replace(/\.[^/.]+$/, "") || "Unknown",
        issues: callData.analysis.improvementSuggestions,
      },
    }

    await webhookService.triggerEvent("quality.alert", payload)
  }
}

export async function triggerCoachingInsightWebhook(callData: any, coachingInsights: any) {
  const webhookService = WebhookService.getInstance()

  const payload = {
    event: "coaching.insight",
    timestamp: new Date().toISOString(),
    data: {
      callId: callData.id || `call-${Date.now()}`,
      agentId: "current-agent", // In real implementation, this would be actual agent ID
      coachingScore: coachingInsights.coachingScore,
      positivePoints: coachingInsights.positivePoints,
      improvementAreas: coachingInsights.improvementAreas,
      actionableTips: coachingInsights.actionableTips,
      learningResources: coachingInsights.learningResources,
    },
  }

  await webhookService.triggerEvent("coaching.insight", payload)
}

// Auto-initialize webhook service when module loads
if (typeof window !== "undefined") {
  const webhookService = WebhookService.getInstance()

  // Load webhooks from localStorage
  const loadWebhooks = () => {
    try {
      const savedWebhooks = localStorage.getItem("webhooks")
      if (savedWebhooks) {
        const webhooks = JSON.parse(savedWebhooks)
        webhookService.setWebhooks(webhooks)
      }
    } catch (error) {
      console.error("Failed to load webhooks:", error)
    }
  }

  loadWebhooks()
}
