import { type NextRequest, NextResponse } from "next/server"

interface CreateCampaignRequest {
  name: string
  vertical: string
  questionScoreThreshold: number
  validationScoreThreshold: number
  isEnabled: boolean
  isArchived: boolean
  integrations: {
    ringba: {
      enabled: boolean
      syncCallLogs: boolean
      createPixel: boolean
    }
    deepgram: {
      enabled: boolean
      transcriptionModel: string
      features: string[]
    }
  }
}

interface RingBACampaignPayload {
  name: string
  vertical: string
  pixel_enabled: boolean
  tracking_enabled: boolean
  call_recording: boolean
  transcription_enabled: boolean
  ai_analysis: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Creating OnScript AI campaign with RingBA integration...")

    const body: CreateCampaignRequest = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: "Campaign name is required" }, { status: 400 })
    }

    if (!body.vertical) {
      return NextResponse.json({ success: false, error: "Vertical selection is required" }, { status: 400 })
    }

    // Step 1: Create campaign in OnScript AI system
    console.log("📝 Creating OnScript AI campaign...")
    const onscriptCampaign = {
      id: `onscript_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name.trim(),
      vertical: body.vertical,
      questionScoreThreshold: body.questionScoreThreshold,
      validationScoreThreshold: body.validationScoreThreshold,
      isEnabled: body.isEnabled,
      isArchived: body.isArchived,
      createdAt: new Date().toISOString(),
      integrations: body.integrations,
    }

    // Step 2: Create RingBA campaign with pixel if enabled
    let ringbaCampaign = null
    let pixelCode = null

    if (body.integrations.ringba.enabled) {
      console.log("🎯 Creating RingBA campaign...")

      const ringbaPayload: RingBACampaignPayload = {
        name: `${body.name} - BlinkScriptAI`,
        vertical: body.vertical,
        pixel_enabled: body.integrations.ringba.createPixel,
        tracking_enabled: true,
        call_recording: true,
        transcription_enabled: body.integrations.deepgram.enabled,
        ai_analysis: true,
      }

      try {
        const ringbaResponse = await fetch(`https://api.ringba.com/v2/${process.env.RINGBA_ACCOUNT_ID}/campaigns`, {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.RINGBA_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(ringbaPayload),
        })

        if (ringbaResponse.ok) {
          ringbaCampaign = await ringbaResponse.json()
          console.log("✅ RingBA campaign created successfully")

          // Generate pixel code if requested
          if (body.integrations.ringba.createPixel && ringbaCampaign?.id) {
            pixelCode = generatePixelCode(ringbaCampaign.id, onscriptCampaign.id)
            console.log("🎨 Pixel code generated for RingBA integration")
          }
        } else {
          const errorText = await ringbaResponse.text()
          console.warn("⚠️ RingBA campaign creation failed:", errorText)
          // Continue without RingBA integration
        }
      } catch (ringbaError) {
        console.warn("⚠️ RingBA integration failed:", ringbaError)
        // Continue without RingBA integration
      }
    }

    // Step 3: Store campaign data (in a real app, this would go to a database)
    const finalCampaign = {
      ...onscriptCampaign,
      ringba: {
        campaignId: ringbaCampaign?.id || null,
        pixelCode: pixelCode,
        integrated: !!ringbaCampaign,
      },
    }

    console.log("✅ Campaign creation completed successfully")

    return NextResponse.json({
      success: true,
      data: finalCampaign,
      message: `Campaign "${body.name}" created successfully${ringbaCampaign ? " with RingBA integration" : ""}`,
      pixel: pixelCode
        ? {
            code: pixelCode,
            instructions: "Add this pixel to your RingBA campaigns to enable BlinkScriptAI oversight",
          }
        : null,
    })
  } catch (error) {
    console.error("❌ Campaign creation failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

function generatePixelCode(ringbaCampaignId: string, onscriptCampaignId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com"

  return `<!-- BlinkScriptAI Tracking Pixel -->
<script>
(function() {
  var pixel = document.createElement('img');
  pixel.src = '${baseUrl}/api/pixel/track?ringba_campaign=${ringbaCampaignId}&onscript_campaign=${onscriptCampaignId}&event=page_view&t=' + Date.now();
  pixel.style.display = 'none';
  pixel.width = 1;
  pixel.height = 1;
  document.body.appendChild(pixel);
  
  // Track call events
  window.blinkscriptTrack = function(event, data) {
    var trackPixel = document.createElement('img');
    trackPixel.src = '${baseUrl}/api/pixel/track?ringba_campaign=${ringbaCampaignId}&onscript_campaign=${onscriptCampaignId}&event=' + event + '&data=' + encodeURIComponent(JSON.stringify(data || {})) + '&t=' + Date.now();
    trackPixel.style.display = 'none';
    trackPixel.width = 1;
    trackPixel.height = 1;
    document.body.appendChild(trackPixel);
  };
})();
</script>
<!-- End BlinkScriptAI Tracking Pixel -->`
}
