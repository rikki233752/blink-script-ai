import { NextResponse } from "next/server"

interface RetreaverCampaign {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
  description?: string
  phone_numbers?: string[]
  total_calls?: number
}

export async function GET() {
  try {
    console.log("=== FETCHING RETREAVER CAMPAIGNS ===")

    const apiKey = process.env.RETREAVER_API_KEY
    const companyId = process.env.RETREAVER_ACCOUNT_ID || "170308"

    console.log("Environment check:", {
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      companyId,
    })

    if (!apiKey) {
      console.error("RETREAVER_API_KEY is not configured")
      return NextResponse.json(
        {
          success: false,
          message: "Retreaver API key is not configured. Please set RETREAVER_API_KEY environment variable.",
          campaigns: [],
        },
        { status: 500 },
      )
    }

    // Use the standard campaigns endpoint (not V2 for campaigns)
    const campaignsUrl = `https://api.retreaver.com/campaigns.json?api_key=${apiKey}&company_id=${companyId}`

    console.log("Fetching campaigns from URL:", campaignsUrl)
    console.log("Curl equivalent:", `curl "${campaignsUrl}"`)

    const response = await fetch(campaignsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "OnScript-Retreaver-Campaigns/1.0",
      },
    })

    console.log(`Campaigns API Response Status: ${response.status} ${response.statusText}`)
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Campaigns API Error Response:", errorText)

      let errorMessage = `Retreaver Campaigns API error: ${response.status} - ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.message || errorJson.error) {
          errorMessage = errorJson.message || errorJson.error
        }
      } catch (e) {
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          campaigns: [],
          debug: {
            status: response.status,
            statusText: response.statusText,
            url: campaignsUrl,
            headers: Object.fromEntries(response.headers.entries()),
            errorBody: errorText,
          },
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Campaigns API Response Data Type:", typeof data)
    console.log("Campaigns API Response Keys:", data && typeof data === "object" ? Object.keys(data) : "Not an object")

    // Log first part of response for debugging
    const responsePreview = JSON.stringify(data).substring(0, 1000)
    console.log("Campaigns API Response Preview:", responsePreview)

    // Handle campaigns response structure
    let campaigns: any[] = []

    if (Array.isArray(data)) {
      campaigns = data.map((item: any) => item.campaign || item)
      console.log("Response is direct array with", data.length, "items")
    } else if (data && typeof data === "object") {
      if (data.campaigns && Array.isArray(data.campaigns)) {
        campaigns = data.campaigns
        console.log("Found campaigns in response.campaigns:", data.campaigns.length)
      } else if (data.data && Array.isArray(data.data)) {
        campaigns = data.data
        console.log("Found campaigns in response.data:", data.data.length)
      } else {
        console.log("Searching for arrays in campaigns response...")
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            campaigns = data[key]
            console.log(`Found campaigns array in response.${key}:`, data[key].length)
            break
          }
        }
      }
    }

    console.log(`Found ${campaigns.length} campaigns`)

    // If no campaigns found, log the full response for debugging
    if (campaigns.length === 0) {
      console.log("No campaigns found. Full response structure:")
      console.log(JSON.stringify(data, null, 2))
    } else {
      // Log sample campaign structure for debugging
      console.log("Sample campaign structure:")
      console.log(JSON.stringify(campaigns[0], null, 2))
    }

    // Transform campaigns response to our format
    const transformedCampaigns: RetreaverCampaign[] = campaigns.map((campaign: any, index: number) => {
      console.log(`Transforming campaign ${index} with keys:`, Object.keys(campaign))

      return {
        id: campaign.cid || campaign.id || campaign.campaign_id || String(index),
        name: campaign.name || campaign.campaign_name || campaign.title || `Campaign ${index + 1}`,
        status: campaign.status || campaign.state || (campaign.active ? "active" : "inactive") || "active",
        created_at: campaign.created_at || campaign.created || new Date().toISOString(),
        updated_at: campaign.updated_at || campaign.updated || new Date().toISOString(),
        description: campaign.description || campaign.notes || campaign.memo || "",
        phone_numbers: campaign.phone_numbers || campaign.numbers || campaign.tracking_numbers || [],
        total_calls: campaign.total_calls || campaign.call_count || campaign.calls || 0,
      }
    })

    console.log("Transformed campaigns:", transformedCampaigns.length)

    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${transformedCampaigns.length} campaigns from Retreaver API`,
      campaigns: transformedCampaigns,
      debug: {
        total_campaigns_found: campaigns.length,
        response_structure: data && typeof data === "object" ? Object.keys(data) : "Not an object",
        api_url: campaignsUrl,
        curl_equivalent: `curl "${campaignsUrl}"`,
        sample_campaign_keys: campaigns.length > 0 ? Object.keys(campaigns[0]) : [],
      },
    })
  } catch (error) {
    console.error("=== ERROR IN RETREAVER CAMPAIGNS API ===")
    console.error("Error details:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch campaigns from Retreaver API",
        campaigns: [],
        error: {
          name: error instanceof Error ? error.name : "Unknown Error",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 },
    )
  }
}
