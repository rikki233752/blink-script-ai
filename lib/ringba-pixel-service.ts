import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface CallEventData {
  callId: string
  campaignId?: string
  eventType: string
  callerNumber?: string
  targetNumber?: string
  callDuration?: number
  conversionValue?: number
  rawData?: any
}

export interface CallEvent {
  id: string
  user_id: string
  call_id: string
  campaign_id: string | null
  event_type: string
  caller_number: string | null
  target_number: string | null
  call_duration: number
  conversion_value: number
  raw_data: any
  created_at: string
  updated_at: string
}

export interface CallEventStats {
  totalEvents: number
  eventsByType: Record<string, number>
  totalConversions: number
  totalRevenue: number
  averageCallDuration: number
}

export class RingbaPixelService {
  async processWebhook(userId: string, webhookData: any): Promise<CallEvent> {
    console.log("🎯 Processing Ringba pixel webhook:", webhookData)

    // Validate and transform webhook data
    const eventData = this.validateAndTransformWebhookData(webhookData)

    // Store in database
    const { data, error } = await supabase
      .from("ringba_call_events")
      .insert({
        user_id: userId,
        call_id: eventData.callId,
        campaign_id: eventData.campaignId,
        event_type: eventData.eventType,
        caller_number: eventData.callerNumber,
        target_number: eventData.targetNumber,
        call_duration: eventData.callDuration || 0,
        conversion_value: eventData.conversionValue || 0,
        raw_data: eventData.rawData || webhookData,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error storing call event:", error)
      throw new Error(`Failed to store call event: ${error.message}`)
    }

    console.log("✅ Call event stored successfully:", data.id)
    return data
  }

  private validateAndTransformWebhookData(webhookData: any): CallEventData {
    // Handle various possible field names from Ringba
    const callId =
      webhookData.call_id || webhookData.callId || webhookData.id || webhookData.call_uuid || `unknown_${Date.now()}`

    const campaignId = webhookData.campaign_id || webhookData.campaignId || webhookData.cid || null

    const eventType =
      webhookData.event_type || webhookData.eventType || webhookData.event || webhookData.trigger || "unknown_event"

    const callerNumber =
      webhookData.caller_number || webhookData.callerNumber || webhookData.caller_id || webhookData.from || null

    const targetNumber =
      webhookData.target_number || webhookData.targetNumber || webhookData.called_number || webhookData.to || null

    const callDuration = Number.parseInt(
      webhookData.call_duration || webhookData.callDuration || webhookData.duration || "0",
    )

    const conversionValue = Number.parseFloat(
      webhookData.conversion_value || webhookData.conversionValue || webhookData.value || webhookData.revenue || "0",
    )

    return {
      callId,
      campaignId,
      eventType: eventType.toLowerCase(),
      callerNumber,
      targetNumber,
      callDuration,
      conversionValue,
      rawData: webhookData,
    }
  }

  async getCallEvents(userId: string, limit = 50): Promise<CallEvent[]> {
    const { data, error } = await supabase
      .from("ringba_call_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Error fetching call events:", error)
      throw new Error(`Failed to fetch call events: ${error.message}`)
    }

    return data || []
  }

  async getCallEventStats(userId: string): Promise<CallEventStats> {
    const { data, error } = await supabase
      .from("ringba_call_events")
      .select("event_type, call_duration, conversion_value")
      .eq("user_id", userId)

    if (error) {
      console.error("❌ Error fetching call event stats:", error)
      throw new Error(`Failed to fetch call event stats: ${error.message}`)
    }

    const events = data || []

    // Calculate statistics
    const totalEvents = events.length
    const eventsByType: Record<string, number> = {}
    let totalConversions = 0
    let totalRevenue = 0
    let totalDuration = 0

    events.forEach((event) => {
      // Count events by type
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1

      // Count conversions
      if (event.event_type.includes("conversion") || event.event_type.includes("sale")) {
        totalConversions++
      }

      // Sum revenue
      totalRevenue += event.conversion_value || 0

      // Sum duration
      totalDuration += event.call_duration || 0
    })

    const averageCallDuration = totalEvents > 0 ? totalDuration / totalEvents : 0

    return {
      totalEvents,
      eventsByType,
      totalConversions,
      totalRevenue,
      averageCallDuration,
    }
  }
}

export const ringbaPixelService = new RingbaPixelService()
