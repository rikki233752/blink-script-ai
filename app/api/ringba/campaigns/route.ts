import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ringba API credentials not configured",
          details: "Please set RINGBA_API_KEY and RINGBA_ACCOUNT_ID environment variables",
        },
        { status: 400 },
      )
    }

    console.log(`🔍 Fetching campaigns for account: ${accountId}`)

    // Use the correct endpoint for campaigns
    const endpoint = `https://api.ringba.com/v2/${accountId}/campaigns`

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    console.log(`📡 Response status: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log(`📊 Raw API response structure:`, {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: typeof data === "object" && data !== null ? Object.keys(data) : "N/A",
        length: Array.isArray(data) ? data.length : "N/A",
      })

      // Handle different possible response structures
      let campaigns = []

      if (Array.isArray(data)) {
        // Direct array response
        campaigns = data
        console.log(`✅ Direct array response with ${campaigns.length} campaigns`)
      } else if (data && typeof data === "object") {
        // Object response - check common property names
        if (data.campaigns && Array.isArray(data.campaigns)) {
          campaigns = data.campaigns
          console.log(`✅ Found campaigns array with ${campaigns.length} items`)
        } else if (data.data && Array.isArray(data.data)) {
          campaigns = data.data
          console.log(`✅ Found data array with ${campaigns.length} items`)
        } else if (data.results && Array.isArray(data.results)) {
          campaigns = data.results
          console.log(`✅ Found results array with ${campaigns.length} items`)
        } else if (data.items && Array.isArray(data.items)) {
          campaigns = data.items
          console.log(`✅ Found items array with ${campaigns.length} items`)
        } else {
          // If it's a single object, wrap it in an array
          campaigns = [data]
          console.log(`✅ Single object response, wrapped in array`)
        }
      } else {
        console.log(`⚠️ Unexpected response format:`, data)
        campaigns = []
      }

      console.log(`📈 Processing ${campaigns.length} campaigns`)

      // Transform campaigns to our format with safe property access
      const transformedCampaigns = campaigns.map((campaign: any, index: number) => {
        // Log the structure of the first campaign for debugging
        if (index === 0) {
          console.log(`🔍 First campaign structure:`, {
            keys: Object.keys(campaign || {}),
            sample: campaign,
          })
        }

        return {
          id: campaign?.id || campaign?.campaignId || campaign?.campaign_id || `campaign_${index}`,
          name: campaign?.name || campaign?.campaignName || campaign?.campaign_name || `Campaign ${index + 1}`,
          status: campaign?.status || campaign?.state || "unknown",
          createdAt: campaign?.createdAt || campaign?.created_at || campaign?.dateCreated || new Date().toISOString(),
          updatedAt: campaign?.updatedAt || campaign?.updated_at || campaign?.dateModified || new Date().toISOString(),
          description: campaign?.description || campaign?.notes || "",
          type: campaign?.type || campaign?.campaignType || campaign?.campaign_type || "standard",
          totalCalls: Number.parseInt(campaign?.totalCalls || campaign?.total_calls || campaign?.callCount || "0"),
          totalRevenue: Number.parseFloat(
            campaign?.totalRevenue || campaign?.total_revenue || campaign?.revenue || "0",
          ),
          conversionRate: Number.parseFloat(
            campaign?.conversionRate || campaign?.conversion_rate || campaign?.conv_rate || "0",
          ),
          isActive: campaign?.status === "active" || campaign?.isActive === true || campaign?.active === true,
          tags: campaign?.tags || campaign?.labels || [],
          metadata: campaign,
        }
      })

      console.log(`✅ Successfully transformed ${transformedCampaigns.length} campaigns`)

      return NextResponse.json({
        success: true,
        data: transformedCampaigns,
        total: transformedCampaigns.length,
        accountId: accountId,
        method: "Real Ringba API v2",
        dataSource: "REAL_RINGBA_API",
        rawResponseStructure: {
          type: typeof data,
          isArray: Array.isArray(data),
          keys: typeof data === "object" && data !== null ? Object.keys(data) : null,
        },
      })
    } else {
      // Log the error for debugging
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status} - ${errorText}`)

      // Return error with detailed information
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch campaigns from RingBA API (${response.status})`,
          details: errorText,
          endpoint: endpoint,
          troubleshooting: {
            status422: "Check if API key format is correct (should be Token, not Bearer)",
            status401: "Verify RINGBA_API_KEY is correct and active",
            status403: "Ensure API key has campaigns permissions",
            status404: "Verify RINGBA_ACCOUNT_ID is correct",
          },
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("💥 Unexpected error in Ringba campaigns API:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
        troubleshooting: {
          checkConnection: "Verify internet connectivity",
          checkCredentials: "Verify RingBA API credentials are set correctly",
          checkEndpoint: "Verify RingBA API endpoint is accessible",
          checkResponseFormat: "The API response format may have changed",
        },
      },
      { status: 500 },
    )
  }
}
