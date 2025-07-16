import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate, campaignId, pageSize = 100, pageIndex = 0 } = body

    // Use the exact credentials from the user
    const apiKey =
      "09f0c9f0c033544593cea5409fad971c23237045c201c8278e3d3f78a1e66ff226a6ca85c08f2b1719700f5adc627ffa9d8d8960e7093be361f54a322389f95c2a4ead77ea532267976348f7396e1117363f50999ee067d9c254488bebdf081ed6453a28c19a9b1ad0dd67e3116c0a3b28c0776c"
    const accountId = "RA8e9b7b0388ea4968868bf2351b647158"

    console.log("🔄 Testing Ringba Calllogs API with recordings focus...")
    console.log("📅 Date range:", startDate, "to", endDate)
    console.log("🎯 Campaign ID:", campaignId)

    // Enhanced endpoints specifically for call logs with recordings
    const endpoints = [
      {
        name: "Call Logs API v2 - With Recordings Filter",
        url: `https://api.ringba.com/v2/${accountId}/calllogs`,
        method: "POST",
        body: {
          startDate,
          endDate,
          campaignId: campaignId || undefined,
          pageSize,
          pageIndex,
          includeRecordings: true,
          hasRecording: true,
          filters: {
            hasRecording: true,
            recordingAvailable: true,
          },
        },
      },
      {
        name: "Call Logs API v2 - Standard",
        url: `https://api.ringba.com/v2/${accountId}/calllogs`,
        method: "POST",
        body: {
          startDate,
          endDate,
          campaignId: campaignId || undefined,
          pageSize,
          pageIndex,
        },
      },
      {
        name: "Call Reports API - With Recordings",
        url: `https://api.ringba.com/v2/${accountId}/reports/calls`,
        method: "POST",
        body: {
          filters: {
            campaignId: campaignId ? [campaignId] : undefined,
            dateRange: {
              start: startDate,
              end: endDate,
            },
            hasRecording: true,
            recordingAvailable: true,
          },
          pagination: {
            limit: pageSize,
            offset: pageIndex * pageSize,
          },
          includeFields: ["recording_url", "recording", "audio_url", "recordingLink"],
        },
      },
      {
        name: "Analytics API - Calls with Recordings",
        url: `https://api.ringba.com/v2/${accountId}/analytics/calls`,
        method: "POST",
        body: {
          campaignId: campaignId || undefined,
          startDate,
          endDate,
          limit: pageSize,
          offset: pageIndex * pageSize,
          filters: {
            hasRecording: true,
          },
        },
      },
      {
        name: "Recordings API - Direct",
        url: `https://api.ringba.com/v2/${accountId}/recordings`,
        method: "POST",
        body: {
          startDate,
          endDate,
          campaignId: campaignId || undefined,
          limit: pageSize,
          offset: pageIndex * pageSize,
        },
      },
      {
        name: "Call Details API",
        url: `https://api.ringba.com/v2/${accountId}/call-details`,
        method: "POST",
        body: {
          startDate,
          endDate,
          campaignId: campaignId || undefined,
          includeRecordings: true,
          pageSize,
          pageIndex,
        },
      },
    ]

    // Authentication methods to try
    const authMethods = [
      {
        name: "Bearer Token",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "X-API-Key",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "API-Key Header",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      {
        name: "Authorization Header",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    ]

    const results = []
    let workingResult = null

    // Try each endpoint with each auth method
    for (const endpoint of endpoints) {
      for (const authMethod of authMethods) {
        try {
          console.log(`🔄 Trying ${endpoint.name} with ${authMethod.name}...`)

          const requestOptions: RequestInit = {
            method: endpoint.method,
            headers: authMethod.headers,
          }

          if (endpoint.method === "POST") {
            requestOptions.body = JSON.stringify(endpoint.body)
          }

          const response = await fetch(endpoint.url, requestOptions)
          const responseText = await response.text()

          console.log(`📡 ${endpoint.name} response status:`, response.status)

          const result = {
            endpoint: endpoint.name,
            authMethod: authMethod.name,
            status: response.status,
            success: response.ok,
            url: endpoint.url,
            requestBody: endpoint.body,
          }

          if (response.ok) {
            try {
              const data = JSON.parse(responseText)
              console.log(`✅ ${endpoint.name} with ${authMethod.name} succeeded!`)

              // Analyze the response structure
              const dataStructure = analyzeDataStructure(data)

              result.data = data
              result.dataStructure = dataStructure
              result.recordingsFound = countRecordings(data)

              if (!workingResult) {
                workingResult = {
                  workingEndpoint: endpoint.url,
                  workingAuth: authMethod.name,
                  requestBody: endpoint.body,
                  result: result,
                }
              }
            } catch (parseError) {
              result.error = "Failed to parse JSON response"
              result.rawResponse = responseText.substring(0, 500)
            }
          } else {
            result.error = responseText.substring(0, 500)
            console.log(
              `❌ ${endpoint.name} with ${authMethod.name} failed:`,
              response.status,
              responseText.substring(0, 200),
            )
          }

          results.push(result)

          // If we found a working endpoint, we can break early or continue testing all
          if (response.ok && workingResult) {
            // Continue testing to find the best endpoint for recordings
          }
        } catch (error) {
          console.error(`💥 ${endpoint.name} with ${authMethod.name} error:`, error)
          results.push({
            endpoint: endpoint.name,
            authMethod: authMethod.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            url: endpoint.url,
          })
        }
      }
    }

    if (workingResult) {
      return NextResponse.json({
        success: true,
        ...workingResult,
        allResults: results,
        summary: {
          totalTests: results.length,
          successfulTests: results.filter((r) => r.success).length,
          failedTests: results.filter((r) => !r.success).length,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "No working configuration found",
        requestBody: body,
        results,
        troubleshooting: {
          accountId,
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 10) + "...",
          possibleIssues: [
            "API key may be invalid or expired",
            "Account ID may be incorrect",
            "API endpoints may have changed",
            "Account may not have access to call logs API",
            "Date range may be invalid or too broad",
            "Campaign ID may not exist or be accessible",
          ],
        },
        summary: {
          totalTests: results.length,
          successfulTests: results.filter((r) => r.success).length,
          failedTests: results.filter((r) => !r.success).length,
        },
      })
    }
  } catch (error) {
    console.error("💥 Unexpected error in calllogs test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test calllogs API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function analyzeDataStructure(data: any): string[] {
  const structure = []

  if (Array.isArray(data)) {
    structure.push(`Array[${data.length}]`)
    if (data.length > 0) {
      structure.push(...Object.keys(data[0]).slice(0, 10))
    }
  } else if (typeof data === "object" && data !== null) {
    structure.push(...Object.keys(data).slice(0, 15))
  }

  return structure
}

function countRecordings(data: any): number {
  let count = 0

  const checkForRecordings = (obj: any) => {
    if (Array.isArray(obj)) {
      obj.forEach((item) => checkForRecordings(item))
    } else if (typeof obj === "object" && obj !== null) {
      // Check for recording-related fields
      const recordingFields = ["recording_url", "recordingUrl", "recording", "audio_url", "audioUrl", "recordingLink"]
      for (const field of recordingFields) {
        if (obj[field] && typeof obj[field] === "string" && obj[field].length > 0) {
          count++
          break // Only count once per object
        }
      }

      // Recursively check nested objects
      Object.values(obj).forEach((value) => checkForRecordings(value))
    }
  }

  checkForRecordings(data)
  return count
}
