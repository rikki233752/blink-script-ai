import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json()
    const apiKey = process.env.RINGBA_API_KEY || ""

    if (!accountId) {
      return NextResponse.json({
        success: false,
        error: "Account ID is required",
      })
    }

    console.log(`🔍 Testing account ID: ${accountId}`)

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Try different account endpoint formats
    const accountFormats = [
      `https://api.ringba.com/v2/accounts/${accountId}`,
      `https://api.ringba.com/v2/account/${accountId}`,
      `https://api.ringba.com/v2/${accountId}`,
      `https://api.ringba.com/v2/organizations/${accountId}`,
      `https://api.ringba.com/v2/companies/${accountId}`,
    ]

    // Try different campaign endpoint formats
    const campaignFormats = [
      `https://api.ringba.com/v2/accounts/${accountId}/campaigns`,
      `https://api.ringba.com/v2/${accountId}/campaigns`,
      `https://api.ringba.com/v2/campaigns?accountId=${accountId}`,
      `https://api.ringba.com/v2/campaigns/${accountId}`,
    ]

    // Try different call log formats
    const callLogFormats = [
      `https://api.ringba.com/v2/accounts/${accountId}/calllogs`,
      `https://api.ringba.com/v2/${accountId}/calllogs`,
      `https://api.ringba.com/v2/calllogs?accountId=${accountId}`,
      `https://api.ringba.com/v2/calllogs/${accountId}`,
    ]

    const allFormats = [...accountFormats, ...campaignFormats, ...callLogFormats]
    const results = []

    for (const endpoint of allFormats) {
      try {
        console.log(`Testing: ${endpoint}`)
        const response = await fetch(endpoint, {
          method: "GET",
          headers,
        })

        let responseData
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = await response.text()
        }

        const result = {
          endpoint,
          status: response.status,
          success: response.ok,
          data: responseData,
          type: endpoint.includes("campaigns") ? "campaigns" : endpoint.includes("calllogs") ? "calllogs" : "account",
        }

        results.push(result)

        if (response.ok) {
          console.log(`✅ Success: ${endpoint}`)
        } else {
          console.log(`❌ Failed: ${endpoint} - ${response.status}`)
        }
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
          type: "error",
        })
      }
    }

    const workingEndpoints = results.filter((r) => r.success)

    return NextResponse.json({
      success: workingEndpoints.length > 0,
      accountId,
      results,
      workingEndpoints,
      summary: {
        totalTested: results.length,
        successful: workingEndpoints.length,
        failed: results.length - workingEndpoints.length,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to test account formats",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
