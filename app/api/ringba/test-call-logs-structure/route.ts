import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId } = body

    console.log(`🔍 Testing call logs structure for campaign: ${campaignId}`)

    // Get environment variables
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "RingBA API credentials not configured",
        },
        { status: 500 },
      )
    }

    // Simple request to get any call logs (last 7 days, small sample)
    const endDate = new Date().toISOString()
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const requestBody = {
      reportStart: startDate,
      reportEnd: endDate,
      size: 5, // Just get a few records to see structure
    }

    // Add campaign filter if provided
    if (campaignId) {
      requestBody.filters = [
        {
          anyConditionToMatch: [
            {
              column: "campaignId",
              value: campaignId,
              isNegativeMatch: false,
              comparisonType: "EQUALS",
            },
          ],
        },
      ]
    }

    console.log("📋 Test Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`https://api.ringba.com/v2/${accountId}/calllogs`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log("📡 Raw Response:", responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: "Failed to parse JSON response",
        rawResponse: responseText,
        status: response.status,
      })
    }

    // Analyze the structure
    let sampleRecord = null
    let availableColumns = []

    if (data.report && Array.isArray(data.report.records) && data.report.records.length > 0) {
      sampleRecord = data.report.records[0]
      availableColumns = Object.keys(sampleRecord)
    } else if (data.report && Array.isArray(data.report) && data.report.length > 0) {
      sampleRecord = data.report[0]
      availableColumns = Object.keys(sampleRecord)
    } else if (Array.isArray(data.records) && data.records.length > 0) {
      sampleRecord = data.records[0]
      availableColumns = Object.keys(sampleRecord)
    } else if (Array.isArray(data) && data.length > 0) {
      sampleRecord = data[0]
      availableColumns = Object.keys(sampleRecord)
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      isSuccessful: data.isSuccessful,
      message: data.message,
      transactionId: data.transactionId,
      sampleRecord,
      availableColumns,
      totalRecords: data.report?.totalRecords || data.totalRecords || 0,
      rawResponse: data,
      endpoint: `https://api.ringba.com/v2/${accountId}/calllogs`,
    })
  } catch (error) {
    console.error("❌ Error testing call logs structure:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
