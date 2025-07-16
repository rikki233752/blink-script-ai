import type { WebhookConfig } from "./webhook-types"

export class WebhookStorage {
  private static STORAGE_KEY = "webhooks"

  static getWebhooks(): WebhookConfig[] {
    if (typeof window === "undefined") return []

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("Failed to load webhooks:", error)
      return []
    }
  }

  static saveWebhooks(webhooks: WebhookConfig[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(webhooks))
    } catch (error) {
      console.error("Failed to save webhooks:", error)
    }
  }

  static addWebhook(webhook: WebhookConfig): void {
    const webhooks = this.getWebhooks()
    webhooks.push(webhook)
    this.saveWebhooks(webhooks)
  }

  static updateWebhook(id: string, updates: Partial<WebhookConfig>): void {
    const webhooks = this.getWebhooks()
    const index = webhooks.findIndex((w) => w.id === id)

    if (index !== -1) {
      webhooks[index] = { ...webhooks[index], ...updates }
      this.saveWebhooks(webhooks)
    }
  }

  static deleteWebhook(id: string): void {
    const webhooks = this.getWebhooks()
    const filtered = webhooks.filter((w) => w.id !== id)
    this.saveWebhooks(filtered)
  }

  static getActiveWebhooks(): WebhookConfig[] {
    return this.getWebhooks().filter((webhook) => webhook.enabled)
  }
}
