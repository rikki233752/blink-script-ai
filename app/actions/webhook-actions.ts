"use server"

import type { WebhookConfig, WebhookLog, WebhookDeliveryResult } from "@/lib/webhook-types"
import { WebhookStorage } from "@/lib/webhook-storage"

export async function createWebhook(webhookData: Partial<WebhookConfig>): Promise<WebhookConfig> {
  // In a real implementation, this would save to database
  const webhook: WebhookConfig = {
    id: `webhook-${Date.now()}`,
    name: webhookData.name || "",
    url: webhookData.url || "",
    method: webhookData.method || "POST",
    enabled: webhookData.enabled ?? true,
    events: webhookData.events || [],
    headers: webhookData.headers || {},
    secret: webhookData.secret,
    retryAttempts: webhookData.retryAttempts || 3,
    timeout: webhookData.timeout || 30,
    description: webhookData.description,
    type: webhookData.type || "custom",
    createdAt: new Date().toISOString(),
    successCount: 0,
    failureCount: 0,
  }

  console.log("Created webhook:", webhook)
  return webhook
}

export async function updateWebhook(webhook: WebhookConfig): Promise<WebhookConfig> {
  // In a real implementation, this would update in database
  console.log("Updated webhook:", webhook)
  return webhook
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  // In a real implementation, this would delete from database
  console.log("Deleted webhook:", webhookId)
}

export async function testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
  // Simulate webhook test with more realistic timing
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const testPayload = {
    event: "webhook.test",
    timestamp: new Date().toISOString(),
    data: {
      message: "This is a test webhook delivery from Call Center Analytics",
      callId: `test-call-${Date.now()}`,
      score: 8.5,
      rating: "GOOD",
      testMode: true,
    },
  }

  // Simulate more realistic success/failure rates
  const success = Math.random() > 0.15 // 85% success rate

  return {
    success,
    statusCode: success ? 200 : Math.random() > 0.5 ? 404 : 500,
    responseTime: Math.floor(Math.random() * 800) + 200, // 200-1000ms
    response: success ? '{"status": "received", "message": "Test webhook processed successfully"}' : undefined,
    error: success ? undefined : Math.random() > 0.5 ? "Connection timeout" : "Endpoint not found",
    payload: testPayload,
  }
}

export async function getWebhookLogs(webhookId?: string): Promise<WebhookLog[]> {
  // In a real implementation, this would fetch from database
  // For now, return empty array to start fresh without mock data
  return []
}

export async function getWebhooks(): Promise<WebhookConfig[]> {
  // In a real implementation, this would fetch from database
  // For now, return empty array to start fresh without mock data
  return []
}

export async function saveWebhook(webhook: WebhookConfig): Promise<{ success: boolean; error?: string }> {
  try {
    WebhookStorage.addWebhook(webhook)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save webhook",
    }
  }
}

export async function deliverWebhook(
  webhook: WebhookConfig,
  event: string,
  payload: any,
): Promise<WebhookDeliveryResult> {
  const startTime = Date.now()

  try {
    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "CallCenter-Webhook/1.0",
      "X-Webhook-Event": event,
      "X-Webhook-Timestamp": new Date().toISOString(),
      ...webhook.headers,
    }

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = await generateWebhookSignature(payload, webhook.secret)
      headers["X-Webhook-Signature"] = signature
    }

    // Make the HTTP request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), webhook.timeout * 1000)

    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseTime = Date.now() - startTime
    const responseText = await response.text()

    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      response: responseText,
      payload,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    return {
      success: false,
      statusCode: 0,
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
      payload,
    }
  }
}

async function generateWebhookSignature(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(payload))
  const key = encoder.encode(secret)

  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return `sha256=${hashHex}`
}

export interface WebhookConfig {
  id: string
  name?: string
  url: string
  method?: string
  enabled?: boolean
  events: string[]
  headers?: Record<string, string>
  secret?: string
  retryAttempts?: number
  timeout?: number
  description?: string
  type?: string
  createdAt?: string
  successCount?: number
  failureCount?: number
}
