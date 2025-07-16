import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { ringbaAccountId } = await request.json()

    if (!ringbaAccountId) {
      return NextResponse.json({ error: "Ringba Account ID is required" }, { status: 400 })
    }

    // Get Ringba account details
    const { data: ringbaAccount, error: accountError } = await supabase
      .from("ringba_accounts")
      .select("*")
      .eq("id", ringbaAccountId)
      .single()

    if (accountError || !ringbaAccount) {
      return NextResponse.json({ error: "Ringba account not found" }, { status: 404 })
    }

    // Fetch campaigns from Ringba API
    const response = await fetch(`https://api.ringba.com/v2/${ringbaAccount.account_id}/campaigns`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ringbaAccount.api_key}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Ringba API error: ${response.status}`)
    }

    const ringbaCampaigns = await response.json()
    const campaigns = []

    // Save campaigns to database
    for (const campaign of ringbaCampaigns) {
      const { data: savedCampaign, error: campaignError } = await supabase
        .from("campaigns")
        .upsert(
          {
            user_id: ringbaAccount.user_id,
            ringba_account_id: ringbaAccount.id,
            campaign_id: campaign.id.toString(),
            campaign_name: campaign.name,
            campaign_status: campaign.status || "active",
            campaign_type: campaign.type || "unknown",
            metadata: campaign,
            last_sync: new Date().toISOString(),
          },
          {
            onConflict: "user_id,campaign_id",
          },
        )
        .select()
        .single()

      if (!campaignError && savedCampaign) {
        campaigns.push(savedCampaign)
      }
    }

    // Update sync status
    await supabase
      .from("ringba_accounts")
      .update({
        sync_status: "completed",
        last_sync: new Date().toISOString(),
      })
      .eq("id", ringbaAccountId)

    return NextResponse.json({
      success: true,
      campaignCount: campaigns.length,
      campaigns,
    })
  } catch (error: any) {
    console.error("Campaign sync error:", error)

    // Update error status
    if (request.body) {
      const { ringbaAccountId } = await request.json()
      await supabase
        .from("ringba_accounts")
        .update({
          sync_status: "error",
          error_message: error.message,
        })
        .eq("id", ringbaAccountId)
    }

    return NextResponse.json({ error: error.message || "Campaign sync failed" }, { status: 500 })
  }
}
