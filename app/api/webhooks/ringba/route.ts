import { type NextRequest, NextResponse } from "next/server"
import { RingBABackendService } from "@/lib/ringba-backend-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify the webhook is from RingBA
    const signature = request.headers.get("x-ringba-signature")

    if (body.event === "call.completed" && body.call) {
      const ringbaService = RingBABackendService.getInstance()

      // Process the call immediately
      await ringbaService.processWebhookCall(body.call)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, message: "No action needed" })
  } catch (error) {
    console.error("RingBA webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
