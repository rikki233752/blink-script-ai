export interface WebhookConfig {
  id: string
  name: string
  url: string
  method: "POST" | "PUT" | "PATCH"
  enabled: boolean
  events: string[]
  headers: Record<string, string>
  secret?: string
  retryAttempts: number
  timeout: number
  description?: string
  type: "crm" | "notification" | "analytics" | "custom"
  createdAt: string
  lastTriggered?: string
  successCount: number
  failureCount: number
}

export interface WebhookLog {
  id: string
  webhookId: string
  event: string
  status: "success" | "failed" | "pending" | "retrying"
  statusCode?: number
  responseTime: number
  payload: any
  response?: string
  error?: string
  timestamp: string
  attempt: number
}

export interface WebhookDeliveryResult {
  success: boolean
  statusCode: number
  responseTime: number
  response?: string
  error?: string
  payload: any
}

export interface WebhookEvent {
  id: string
  name: string
  description: string
  payload: any
}
