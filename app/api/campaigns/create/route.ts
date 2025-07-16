import { type NextRequest, NextResponse } from "next/server"
import { campaignService } from "@/lib/database/campaign-service"

export async function POST(request: NextRequest) {
  try {
    console.log("=== CREATE CAMPAIGN API CALLED ===")

    const body = await request.json()
    console.log("Campaign creation data:", body)

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: "Campaign name is required" }, { status: 400 })
    }

    if (!body.vertical) {
      return NextResponse.json({ success: false, error: "Vertical selection is required" }, { status: 400 })
    }

    if (body.name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Campaign name must be at least 3 characters long" },
        { status: 400 },
      )
    }

    if (body.targetCalls && (typeof body.targetCalls !== "number" || body.targetCalls <= 0)) {
      return NextResponse.json({ success: false, error: "Target calls must be a positive number" }, { status: 400 })
    }

    if (body.budget && (typeof body.budget !== "number" || body.budget <= 0)) {
      return NextResponse.json({ success: false, error: "Budget must be a positive number" }, { status: 400 })
    }

    // Initialize sample data first
    await campaignService.initializeSampleData()

    const campaignData = {
      name: body.name.trim(),
      description: body.description?.trim() || `${body.vertical.toUpperCase()} campaign for call center analytics`,
      status: body.status || "draft",
      type: body.type || "lead-generation",
      targetCalls: body.targetCalls || 1000,
      budget: body.budget || 10000,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      createdBy: body.createdBy || "system",
      settings: {
        qualityThreshold: body.qualityThreshold || 4.0,
        autoApproval: body.autoApproval || false,
        recordingEnabled: body.recordingEnabled !== false,
        transcriptionEnabled: body.transcriptionEnabled !== false,
        vertical: body.vertical,
        pixelEnabled: body.createPixel || false,
        integrations: body.integrations || {
          ringba: {
            enabled: true,
            syncCallLogs: true,
          },
          deepgram: {
            enabled: true,
            transcriptionModel: "nova-2",
            features: ["punctuation", "diarization", "sentiment"],
          },
        },
      },
    }

    const newCampaign = await campaignService.createCampaign(campaignData)
    console.log("Created campaign:", newCampaign.name, "with vertical:", body.vertical)

    // Create RingBA campaign if pixel is requested
    let ringbaCampaignId = null
    let pixelUrl = null

    if (body.createPixel) {
      try {
        console.log("🎯 Creating RingBA campaign...")

        const ringbaPayload = {
          name: `${body.name.trim()} - BlinkScriptAI`,
          vertical: body.vertical,
          pixel_enabled: true,
          tracking_enabled: true,
          call_recording: true,
          transcription_enabled: true,
          ai_analysis: true,
        }

        const ringbaResponse = await fetch(`https://api.ringba.com/v2/RA8e9b7b0388ea4968868bf2351b647158/campaigns`, {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.RINGBA_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(ringbaPayload),
        })

        if (ringbaResponse.ok) {
          const ringbaCampaign = await ringbaResponse.json()
          ringbaCampaignId = ringbaCampaign.id
          console.log("✅ RingBA campaign created:", ringbaCampaignId)
        } else {
          const errorText = await ringbaResponse.text()
          console.warn("⚠️ RingBA campaign creation failed:", errorText)
        }
      } catch (ringbaError) {
        console.warn("⚠️ RingBA integration failed:", ringbaError)
      }

      // Generate pixel URL regardless of RingBA campaign creation success
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com"
      pixelUrl = `${baseUrl}/api/ringba/pixel?campaign_id=${newCampaign.id}&ringba_campaign=${ringbaCampaignId || "pending"}&user_id=current_user`
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newCampaign,
        createdAt: newCampaign.createdAt.toISOString(),
        updatedAt: newCampaign.updatedAt.toISOString(),
        startDate: newCampaign.startDate.toISOString(),
        endDate: newCampaign.endDate?.toISOString(),
        vertical: body.vertical,
        pixelUrl,
        ringbaCampaignId,
      },
      message: "Campaign created successfully" + (pixelUrl ? " with RingBA pixel integration" : ""),
      integrations: {
        ringba: {
          campaignId: ringbaCampaignId,
          pixelUrl,
          instructions: pixelUrl
            ? "Add this pixel URL to your RingBA campaigns to enable BlinkScriptAI oversight"
            : null,
        },
      },
    })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
