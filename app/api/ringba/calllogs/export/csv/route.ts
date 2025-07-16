import { type NextRequest, NextResponse } from "next/server"

const RINGBA_ACCOUNT_ID = process.env.RINGBA_ACCOUNT_ID
const RINGBA_API_KEY = process.env.RINGBA_API_KEY

interface CSVExportParams {
  startDate?: string
  endDate?: string
  campaignId?: string
  columns?: string[]
  format?: string
  timezone?: string
  limit?: number
  offset?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract parameters
    const params: CSVExportParams = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      campaignId: searchParams.get("campaignId") || undefined,
      columns: searchParams.get("columns")?.split(",") || undefined,
      format: searchParams.get("format") || "csv",
      timezone: searchParams.get("timezone") || "UTC",
      limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? Number.parseInt(searchParams.get("offset")!) : undefined,
    }

    console.log("🔄 CSV Export request with params:", params)

    if (!RINGBA_ACCOUNT_ID || !RINGBA_API_KEY) {
      console.log("⚠️ Missing Ringba credentials, using mock CSV data")
      return generateMockCSVResponse(params)
    }

    const baseUrl = `https://api.ringba.com/v2/${RINGBA_ACCOUNT_ID}/calllogs/export/csv`

    // Try different authentication methods and request formats
    const authMethods = [
      {
        name: "Bearer Token",
        headers: {
          Authorization: `Bearer ${RINGBA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "text/csv, application/csv, */*",
        },
      },
      {
        name: "X-API-Key",
        headers: {
          "X-API-Key": RINGBA_API_KEY,
          "Content-Type": "application/json",
          Accept: "text/csv, application/csv, */*",
        },
      },
      {
        name: "API-Key Header",
        headers: {
          "API-Key": RINGBA_API_KEY,
          "Content-Type": "application/json",
          Accept: "text/csv, application/csv, */*",
        },
      },
    ]

    // Try GET request with query parameters
    for (const authMethod of authMethods) {
      try {
        const queryParams = new URLSearchParams()

        if (params.startDate) queryParams.append("startDate", params.startDate)
        if (params.endDate) queryParams.append("endDate", params.endDate)
        if (params.campaignId) queryParams.append("campaignId", params.campaignId)
        if (params.columns) queryParams.append("columns", params.columns.join(","))
        if (params.format) queryParams.append("format", params.format)
        if (params.timezone) queryParams.append("timezone", params.timezone)
        if (params.limit) queryParams.append("limit", params.limit.toString())
        if (params.offset) queryParams.append("offset", params.offset.toString())

        const getUrl = `${baseUrl}?${queryParams.toString()}`

        console.log(`🔄 Trying GET request with ${authMethod.name}:`, getUrl)

        const getResponse = await fetch(getUrl, {
          method: "GET",
          headers: authMethod.headers,
        })

        console.log(`📡 GET Response status: ${getResponse.status}`)
        console.log(`📡 GET Response headers:`, Object.fromEntries(getResponse.headers.entries()))

        if (getResponse.ok) {
          const csvData = await getResponse.text()
          console.log(`✅ CSV export successful with ${authMethod.name} (GET)`)
          console.log(`📊 CSV data preview:`, csvData.substring(0, 500))

          return new NextResponse(csvData, {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="ringba-calls-${new Date().toISOString().split("T")[0]}.csv"`,
              "X-Export-Method": `GET-${authMethod.name}`,
              "X-Data-Source": "REAL_RINGBA_CSV_API",
              "X-Export-Endpoint": getUrl,
            },
          })
        }
      } catch (error) {
        console.log(`❌ GET request failed with ${authMethod.name}:`, error)
      }
    }

    // Try POST request with JSON body
    for (const authMethod of authMethods) {
      try {
        const postBody = {
          ...params,
          accountId: RINGBA_ACCOUNT_ID,
        }

        console.log(`🔄 Trying POST request with ${authMethod.name}:`, baseUrl)
        console.log(`📤 POST body:`, postBody)

        const postResponse = await fetch(baseUrl, {
          method: "POST",
          headers: authMethod.headers,
          body: JSON.stringify(postBody),
        })

        console.log(`📡 POST Response status: ${postResponse.status}`)
        console.log(`📡 POST Response headers:`, Object.fromEntries(postResponse.headers.entries()))

        if (postResponse.ok) {
          const csvData = await postResponse.text()
          console.log(`✅ CSV export successful with ${authMethod.name} (POST)`)
          console.log(`📊 CSV data preview:`, csvData.substring(0, 500))

          return new NextResponse(csvData, {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="ringba-calls-${new Date().toISOString().split("T")[0]}.csv"`,
              "X-Export-Method": `POST-${authMethod.name}`,
              "X-Data-Source": "REAL_RINGBA_CSV_API",
              "X-Export-Endpoint": baseUrl,
            },
          })
        }
      } catch (error) {
        console.log(`❌ POST request failed with ${authMethod.name}:`, error)
      }
    }

    // If all methods fail, return mock data
    console.log("⚠️ All Ringba API methods failed, using mock CSV data")
    return generateMockCSVResponse(params)
  } catch (error) {
    console.error("❌ CSV export error:", error)
    return generateMockCSVResponse({})
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("🔄 CSV Export POST request with body:", body)

    if (!RINGBA_ACCOUNT_ID || !RINGBA_API_KEY) {
      console.log("⚠️ Missing Ringba credentials, using mock CSV data")
      return generateMockCSVResponse(body)
    }

    const baseUrl = `https://api.ringba.com/v2/${RINGBA_ACCOUNT_ID}/calllogs/export/csv`

    const authMethods = [
      {
        name: "Bearer Token",
        headers: {
          Authorization: `Bearer ${RINGBA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "text/csv, application/csv, */*",
        },
      },
      {
        name: "X-API-Key",
        headers: {
          "X-API-Key": RINGBA_API_KEY,
          "Content-Type": "application/json",
          Accept: "text/csv, application/csv, */*",
        },
      },
    ]

    for (const authMethod of authMethods) {
      try {
        const postBody = {
          ...body,
          accountId: RINGBA_ACCOUNT_ID,
        }

        console.log(`🔄 Trying POST request with ${authMethod.name}:`, baseUrl)

        const response = await fetch(baseUrl, {
          method: "POST",
          headers: authMethod.headers,
          body: JSON.stringify(postBody),
        })

        console.log(`📡 Response status: ${response.status}`)

        if (response.ok) {
          const csvData = await response.text()
          console.log(`✅ CSV export successful with ${authMethod.name}`)

          return new NextResponse(csvData, {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="ringba-calls-${new Date().toISOString().split("T")[0]}.csv"`,
              "X-Export-Method": `POST-${authMethod.name}`,
              "X-Data-Source": "REAL_RINGBA_CSV_API",
              "X-Export-Endpoint": baseUrl,
            },
          })
        }
      } catch (error) {
        console.log(`❌ POST request failed with ${authMethod.name}:`, error)
      }
    }

    return generateMockCSVResponse(body)
  } catch (error) {
    console.error("❌ CSV export POST error:", error)
    return generateMockCSVResponse({})
  }
}

function generateMockCSVResponse(params: any) {
  const mockCSV = `Call ID,Campaign ID,Campaign Name,Caller ID,Called Number,Tracking Number,Start Time,End Time,Duration,Ring Time,Status,Disposition,Direction,Agent Name,Agent ID,Revenue,Cost,Profit,Caller City,Caller State,Target City,Target State,Recording URL,Recording Duration,Has Recording,Source ID,Keyword ID,Tags,Custom Field 1,Custom Field 2,Notes
CL001,CP001,Test Campaign 1,+15551234567,+15559876543,+15551111111,2024-01-15T10:30:00Z,2024-01-15T10:35:30Z,330,15,completed,sale,inbound,John Smith,AG001,150.00,25.00,125.00,New York,NY,Los Angeles,CA,https://recordings.example.com/rec1.mp3,325,true,SRC001,KW001,"lead,qualified",Value1,Value2,Great call with conversion
CL002,CP001,Test Campaign 1,+15552345678,+15559876543,+15551111111,2024-01-15T11:15:00Z,2024-01-15T11:18:45Z,225,8,completed,qualified,inbound,Jane Doe,AG002,0.00,15.00,-15.00,Chicago,IL,Los Angeles,CA,https://recordings.example.com/rec2.mp3,220,true,SRC002,KW002,"lead,follow-up",Value3,Value4,Needs follow-up call
CL003,CP002,Test Campaign 2,+15553456789,+15559876544,+15551111112,2024-01-15T12:00:00Z,2024-01-15T12:02:30Z,150,5,completed,no-sale,inbound,Bob Johnson,AG003,0.00,10.00,-10.00,Miami,FL,Dallas,TX,,0,false,SRC003,KW003,"lead,not-interested",Value5,Value6,Not interested in service
CL004,CP002,Test Campaign 2,+15554567890,+15559876544,+15551111112,2024-01-15T13:30:00Z,2024-01-15T13:38:15Z,495,12,completed,callback,inbound,Alice Brown,AG004,0.00,20.00,-20.00,Seattle,WA,Dallas,TX,https://recordings.example.com/rec4.mp3,490,true,SRC004,KW004,"lead,callback",Value7,Value8,Scheduled callback for tomorrow
CL005,CP003,Test Campaign 3,+15555678901,+15559876545,+15551111113,2024-01-15T14:45:00Z,2024-01-15T14:52:20Z,440,18,completed,sale,inbound,Mike Wilson,AG005,275.00,30.00,245.00,Boston,MA,Phoenix,AZ,https://recordings.example.com/rec5.mp3,435,true,SRC005,KW005,"lead,qualified,premium",Value9,Value10,High-value customer conversion`

  return new NextResponse(mockCSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ringba-calls-mock-${new Date().toISOString().split("T")[0]}.csv"`,
      "X-Export-Method": "MOCK_DATA",
      "X-Data-Source": "MOCK_CSV_DATA",
      "X-Export-Endpoint": "Mock CSV Generator",
      "X-Export-Note": "Ringba API connection failed - using sample data",
    },
  })
}
