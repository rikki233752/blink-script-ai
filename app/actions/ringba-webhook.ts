"use server"

import { RingBABackendService } from "@/lib/ringba-backend-service"

export async function handleRingBAWebhook(formData: FormData) {
  try {
    const webhookData = JSON.parse(formData.get("data") as string)

    // Verify webhook signature if needed
    const signature = formData.get("signature") as string

    if (webhookData.event === "call.completed" && webhookData.call) {
      const ringbaService = RingBABackendService.getInstance()

      // Process the call immediately when webhook is received
      await ringbaService.processWebhookCall(webhookData.call)

      return { success: true, message: "Webhook processed successfully" }
    }

    return { success: true, message: "Webhook received but no action needed" }
  } catch (error) {
    console.error("RingBA webhook error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
