import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const { campaignId } = params
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search")

    console.log("🔍 Fetching call logs for campaign:", campaignId, {
      startDate,
      endDate,
      page,
      limit,
      search,
    })

    // Get environment variables
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    if (!apiKey || !accountId) {
      console.error("❌ Missing RingBA credentials")
      return NextResponse.json({ success: false, error: "RingBA API credentials not configured" }, { status: 500 })
    }

    // Build RingBA API URL
    const baseUrl = "https://api.ringba.com/v2"
    const url = new URL(`${baseUrl}/${accountId}/calllogs`)

    // Add query parameters
    url.searchParams.append("campaignId", campaignId)
    if (startDate) url.searchParams.append("startDate", startDate)
    if (endDate) url.searchParams.append("endDate", endDate)
    url.searchParams.append("page", page.toString())
    url.searchParams.append("limit", limit.toString())
    if (search) url.searchParams.append("search", search)

    console.log("📡 Making RingBA API request:", url.toString())

    // Make request to RingBA API
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ RingBA API error:", response.status, errorText)
      return NextResponse.json(
        { success: false, error: `RingBA API error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ RingBA API response received:", {
      totalRecords: data.data?.length || 0,
      hasData: !!data.data,
    })

    // Pre-built area code to state lookup table for instant access
    const areaCodeToState: { [key: string]: string } = {
      "205": "AL",
      "251": "AL",
      "256": "AL",
      "334": "AL",
      "659": "AL",
      "938": "AL",
      "907": "AK",
      "480": "AZ",
      "520": "AZ",
      "602": "AZ",
      "623": "AZ",
      "928": "AZ",
      "479": "AR",
      "501": "AR",
      "870": "AR",
      "209": "CA",
      "213": "CA",
      "279": "CA",
      "310": "CA",
      "323": "CA",
      "341": "CA",
      "369": "CA",
      "408": "CA",
      "415": "CA",
      "424": "CA",
      "442": "CA",
      "510": "CA",
      "530": "CA",
      "559": "CA",
      "562": "CA",
      "619": "CA",
      "626": "CA",
      "628": "CA",
      "650": "CA",
      "657": "CA",
      "661": "CA",
      "669": "CA",
      "707": "CA",
      "714": "CA",
      "747": "CA",
      "760": "CA",
      "805": "CA",
      "818": "CA",
      "820": "CA",
      "831": "CA",
      "840": "CA",
      "858": "CA",
      "909": "CA",
      "916": "CA",
      "925": "CA",
      "949": "CA",
      "951": "CA",
      "303": "CO",
      "719": "CO",
      "720": "CO",
      "970": "CO",
      "203": "CT",
      "475": "CT",
      "860": "CT",
      "959": "CT",
      "302": "DE",
      "202": "DC",
      "239": "FL",
      "305": "FL",
      "321": "FL",
      "352": "FL",
      "386": "FL",
      "407": "FL",
      "561": "FL",
      "689": "FL",
      "727": "FL",
      "754": "FL",
      "772": "FL",
      "786": "FL",
      "813": "FL",
      "850": "FL",
      "863": "FL",
      "904": "FL",
      "941": "FL",
      "954": "FL",
      "229": "GA",
      "404": "GA",
      "470": "GA",
      "478": "GA",
      "678": "GA",
      "706": "GA",
      "762": "GA",
      "770": "GA",
      "912": "GA",
      "808": "HI",
      "208": "ID",
      "986": "ID",
      "217": "IL",
      "224": "IL",
      "309": "IL",
      "312": "IL",
      "331": "IL",
      "618": "IL",
      "630": "IL",
      "708": "IL",
      "773": "IL",
      "779": "IL",
      "815": "IL",
      "847": "IL",
      "872": "IL",
      "219": "IN",
      "260": "IN",
      "317": "IN",
      "463": "IN",
      "574": "IN",
      "765": "IN",
      "812": "IN",
      "930": "IN",
      "319": "IA",
      "515": "IA",
      "563": "IA",
      "641": "IA",
      "712": "IA",
      "316": "KS",
      "620": "KS",
      "785": "KS",
      "913": "KS",
      "270": "KY",
      "364": "KY",
      "502": "KY",
      "606": "KY",
      "859": "KY",
      "225": "LA",
      "318": "LA",
      "337": "LA",
      "504": "LA",
      "985": "LA",
      "207": "ME",
      "240": "MD",
      "301": "MD",
      "410": "MD",
      "443": "MD",
      "667": "MD",
      "339": "MA",
      "351": "MA",
      "413": "MA",
      "508": "MA",
      "617": "MA",
      "774": "MA",
      "781": "MA",
      "857": "MA",
      "978": "MA",
      "231": "MI",
      "248": "MI",
      "269": "MI",
      "313": "MI",
      "517": "MI",
      "586": "MI",
      "616": "MI",
      "679": "MI",
      "734": "MI",
      "810": "MI",
      "906": "MI",
      "947": "MI",
      "989": "MI",
      "218": "MN",
      "320": "MN",
      "507": "MN",
      "612": "MN",
      "651": "MN",
      "763": "MN",
      "952": "MN",
      "228": "MS",
      "601": "MS",
      "662": "MS",
      "769": "MS",
      "314": "MO",
      "417": "MO",
      "573": "MO",
      "636": "MO",
      "660": "MO",
      "816": "MO",
      "406": "MT",
      "308": "NE",
      "402": "NE",
      "531": "NE",
      "702": "NV",
      "725": "NV",
      "775": "NV",
      "603": "NH",
      "201": "NJ",
      "551": "NJ",
      "609": "NJ",
      "640": "NJ",
      "732": "NJ",
      "848": "NJ",
      "856": "NJ",
      "862": "NJ",
      "908": "NJ",
      "973": "NJ",
      "505": "NM",
      "575": "NM",
      "212": "NY",
      "315": "NY",
      "332": "NY",
      "347": "NY",
      "516": "NY",
      "518": "NY",
      "585": "NY",
      "607": "NY",
      "631": "NY",
      "646": "NY",
      "680": "NY",
      "716": "NY",
      "718": "NY",
      "838": "NY",
      "845": "NY",
      "914": "NY",
      "917": "NY",
      "929": "NY",
      "934": "NY",
      "252": "NC",
      "336": "NC",
      "704": "NC",
      "743": "NC",
      "828": "NC",
      "910": "NC",
      "919": "NC",
      "980": "NC",
      "984": "NC",
      "701": "ND",
      "216": "OH",
      "220": "OH",
      "234": "OH",
      "330": "OH",
      "380": "OH",
      "419": "OH",
      "440": "OH",
      "513": "OH",
      "567": "OH",
      "614": "OH",
      "740": "OH",
      "937": "OH",
      "405": "OK",
      "539": "OK",
      "580": "OK",
      "918": "OK",
      "458": "OR",
      "503": "OR",
      "541": "OR",
      "971": "OR",
      "215": "PA",
      "267": "PA",
      "272": "PA",
      "412": "PA",
      "445": "PA",
      "484": "PA",
      "570": "PA",
      "610": "PA",
      "717": "PA",
      "724": "PA",
      "814": "PA",
      "878": "PA",
      "401": "RI",
      "803": "SC",
      "843": "SC",
      "854": "SC",
      "864": "SC",
      "605": "SD",
      "423": "TN",
      "615": "TN",
      "629": "TN",
      "731": "TN",
      "865": "TN",
      "901": "TN",
      "931": "TN",
      "214": "TX",
      "254": "TX",
      "281": "TX",
      "325": "TX",
      "346": "TX",
      "361": "TX",
      "409": "TX",
      "430": "TX",
      "432": "TX",
      "469": "TX",
      "512": "TX",
      "713": "TX",
      "726": "TX",
      "737": "TX",
      "806": "TX",
      "817": "TX",
      "832": "TX",
      "903": "TX",
      "915": "TX",
      "936": "TX",
      "940": "TX",
      "956": "TX",
      "972": "TX",
      "979": "TX",
      "385": "UT",
      "435": "UT",
      "801": "UT",
      "802": "VT",
      "276": "VA",
      "434": "VA",
      "540": "VA",
      "571": "VA",
      "703": "VA",
      "757": "VA",
      "804": "VA",
      "206": "WA",
      "253": "WA",
      "360": "WA",
      "425": "WA",
      "509": "WA",
      "564": "WA",
      "304": "WV",
      "681": "WV",
      "262": "WI",
      "414": "WI",
      "534": "WI",
      "608": "WI",
      "715": "WI",
      "920": "WI",
      "307": "WY",
    }

    // Silent state extraction function - no logging, instant lookup
    const extractStateFromPhone = (phone: string): string => {
      if (!phone) return ""
      const cleaned = phone.replace(/\D/g, "")
      if (cleaned.length >= 10) {
        const areaCode = cleaned.substring(cleaned.length - 10, cleaned.length - 7)
        return areaCodeToState[areaCode] || ""
      }
      return ""
    }

    // Transform the data with optimized processing
    const transformedData =
      data.data?.map((call: any) => ({
        ...call,
        // Add state extraction for phone numbers
        callerState: extractStateFromPhone(call.caller),
        targetState: extractStateFromPhone(call.target),
        // Ensure all existing fields are preserved
        id: call.id,
        campaignId: call.campaignId,
        callId: call.callId,
        caller: call.caller,
        target: call.target,
        startTime: call.startTime,
        endTime: call.endTime,
        duration: call.duration,
        status: call.status,
        disposition: call.disposition,
        recordingUrl: call.recordingUrl,
        // Preserve all other fields
        ...Object.keys(call).reduce((acc: any, key: string) => {
          if (!["callerState", "targetState"].includes(key)) {
            acc[key] = call[key]
          }
          return acc
        }, {}),
      })) || []

    console.log("✅ Call logs processed successfully:", {
      totalRecords: transformedData.length,
      withStates: transformedData.filter((call: any) => call.callerState || call.targetState).length,
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: data.pagination || {
        page,
        limit,
        total: transformedData.length,
        totalPages: Math.ceil(transformedData.length / limit),
      },
    })
  } catch (error: any) {
    console.error("💥 Unexpected error in call logs API:", error.message)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    console.log("🚀 Starting call logs API request")
    console.log("📍 Campaign ID:", params.campaignId)

    const campaignId = params.campaignId
    const apiKey = process.env.RINGBA_API_KEY
    const accountId = process.env.RINGBA_ACCOUNT_ID

    console.log("🔑 Environment check:", {
      hasApiKey: !!apiKey,
      hasAccountId: !!accountId,
      apiKeyLength: apiKey?.length || 0,
      accountId: accountId || "not set",
    })

    if (!apiKey || !accountId) {
      console.error("❌ Missing RingBA credentials")
      return NextResponse.json(
        {
          success: false,
          error: "RingBA API credentials not configured",
          details: {
            hasApiKey: !!apiKey,
            hasAccountId: !!accountId,
          },
        },
        { status: 400 },
      )
    }

    // Parse the request body
    let body
    try {
      body = await request.json()
      console.log("📦 Request body parsed:", body)
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
        { status: 400 },
      )
    }

    const {
      startDate,
      endDate,
      filters = {},
      columns = [],
      page = 1,
      pageSize = 500,
      sortColumn = "callStartTime",
      sortOrder = "desc",
    } = body

    console.log("📅 Date range:", { startDate, endDate })
    console.log("🎯 Campaign ID for filtering:", campaignId)

    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "startDate and endDate are required",
        },
        { status: 400 },
      )
    }

    // ✅ RingBA API endpoint
    const endpoint = `https://api.ringba.com/v2/${accountId}/calllogs`
    console.log("🌐 API endpoint:", endpoint)

    // ✅ Use ONLY validated RingBA API columns to avoid 422 errors
    const requestBody = {
      reportStart: startDate,
      reportEnd: endDate,
      offset: 0,
      size: 1000,
      filters: [
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
      ],
      valueColumns: [
        // ✅ Core fields that are guaranteed to exist
        { column: "inboundCallId" },
        { column: "callDt" },
        { column: "campaignId" },
        { column: "campaignName" },
        { column: "inboundPhoneNumber" },
        { column: "callLengthInSeconds" },
        { column: "connectedCallLengthInSeconds" },
        { column: "timeToConnectInSeconds" },
        { column: "hasConnected" },
        { column: "hasConverted" },
        { column: "hasRecording" },
        { column: "recordingUrl" },
        { column: "endCallSource" },

        // ✅ Publisher and Target fields
        { column: "publisherName" },
        { column: "targetName" },
        { column: "targetNumber" },

        // ✅ Financial fields
        { column: "conversionAmount" },
        { column: "payoutAmount" },
        { column: "totalCost" },
        { column: "profitNet" },

        // ✅ Additional timing fields
        { column: "callCompletedDt" },
        { column: "callConnectionDt" },

        // ✅ Try buyer field (common in RingBA)
        { column: "buyer" },
      ],
    }

    console.log("📊 RingBA request body:", JSON.stringify(requestBody, null, 2))

    // Make the API call to RingBA
    let response
    try {
      console.log("🔄 Making request to RingBA...")
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      console.log("📡 RingBA response status:", response.status)
    } catch (fetchError) {
      console.error("❌ Fetch error:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to RingBA API",
          details: fetchError instanceof Error ? fetchError.message : "Unknown fetch error",
          endpoint: endpoint,
        },
        { status: 500 },
      )
    }

    // Handle response
    if (response.ok) {
      let data
      try {
        data = await response.json()
        console.log("✅ RingBA response received:", {
          isSuccessful: data.isSuccessful,
          transactionId: data.transactionId,
          hasReport: !!data.report,
          recordCount: data.report?.records?.length || 0,
          totalCount: data.report?.totalCount || 0,
        })
      } catch (jsonError) {
        console.error("❌ Failed to parse RingBA response:", jsonError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to parse RingBA response",
            details: jsonError instanceof Error ? jsonError.message : "Unknown JSON parse error",
          },
          { status: 500 },
        )
      }

      console.log("📊 Detailed RingBA Response Structure:", {
        isSuccessful: data.isSuccessful,
        hasReport: !!data.report,
        reportKeys: data.report ? Object.keys(data.report) : [],
        recordCount: data.report?.records?.length || 0,
        totalRecords: data.report?.totalRecords || data.report?.totalCount || 0,
        partialResult: data.report?.partialResult,
        hasMoreData: data.report?.hasMoreData,
      })

      // Check if RingBA request was successful
      if (!data.isSuccessful) {
        console.error("❌ RingBA API returned unsuccessful:", data.message || data.error)
        return NextResponse.json(
          {
            success: false,
            error: data.message || data.error || "RingBA API request was not successful",
            ringbaResponse: data,
            troubleshooting: {
              message: "RingBA API returned isSuccessful: false",
              possibleCauses: [
                "Invalid campaign ID",
                "No data for the specified date range",
                "Campaign access permissions",
                "Invalid date format",
              ],
            },
          },
          { status: 400 },
        )
      }

      const records = data.report?.records || []
      console.log(`📞 Processing ${records.length} call records`)

      // ✅ FILTER OUT CALLS WITHOUT RECORDINGS: Apply server-side filtering
      const recordedCallsOnly = records.filter((record: any) => {
        return (
          record.recordingUrl &&
          typeof record.recordingUrl === "string" &&
          record.recordingUrl.trim() !== "" &&
          record.recordingUrl !== "null" &&
          record.recordingUrl !== "undefined" &&
          record.hasRecording === true
        )
      })

      console.log("🎵 Recording filter applied:", {
        originalCount: records.length,
        recordedCount: recordedCallsOnly.length,
        filteredOut: records.length - recordedCallsOnly.length,
      })

      // Log first record to see available fields (only once)
      if (recordedCallsOnly.length > 0) {
        console.log("🔍 First recorded call available fields:", Object.keys(recordedCallsOnly[0]))
        console.log("🔍 First recorded call sample data:", {
          inboundCallId: recordedCallsOnly[0].inboundCallId,
          campaignName: recordedCallsOnly[0].campaignName,
          callDt: recordedCallsOnly[0].callDt,
          inboundPhoneNumber: recordedCallsOnly[0].inboundPhoneNumber,
          hasRecording: recordedCallsOnly[0].hasRecording,
          recordingUrl: recordedCallsOnly[0].recordingUrl ? "Present" : "Missing",
          targetName: recordedCallsOnly[0].targetName,
          buyer: recordedCallsOnly[0].buyer,
          endCallSource: recordedCallsOnly[0].endCallSource,
        })
      }

      // ✅ ULTRA-FAST STATE EXTRACTION: Pre-built lookup table for instant access
      const AREA_CODE_TO_STATE: { [key: string]: string } = {
        "205": "AL",
        "251": "AL",
        "256": "AL",
        "334": "AL",
        "659": "AL",
        "907": "AK",
        "480": "AZ",
        "520": "AZ",
        "602": "AZ",
        "623": "AZ",
        "928": "AZ",
        "479": "AR",
        "501": "AR",
        "870": "AR",
        "209": "CA",
        "213": "CA",
        "279": "CA",
        "310": "CA",
        "323": "CA",
        "408": "CA",
        "415": "CA",
        "424": "CA",
        "442": "CA",
        "510": "CA",
        "530": "CA",
        "559": "CA",
        "562": "CA",
        "619": "CA",
        "626": "CA",
        "628": "CA",
        "650": "CA",
        "657": "CA",
        "661": "CA",
        "669": "CA",
        "707": "CA",
        "714": "CA",
        "747": "CA",
        "760": "CA",
        "805": "CA",
        "818": "CA",
        "820": "CA",
        "831": "CA",
        "840": "CA",
        "858": "CA",
        "909": "CA",
        "916": "CA",
        "925": "CA",
        "949": "CA",
        "951": "CA",
        "303": "CO",
        "719": "CO",
        "720": "CO",
        "970": "CO",
        "203": "CT",
        "475": "CT",
        "860": "CT",
        "959": "CT",
        "302": "DE",
        "239": "FL",
        "305": "FL",
        "321": "FL",
        "352": "FL",
        "386": "FL",
        "407": "FL",
        "561": "FL",
        "689": "FL",
        "727": "FL",
        "754": "FL",
        "772": "FL",
        "786": "FL",
        "813": "FL",
        "850": "FL",
        "863": "FL",
        "904": "FL",
        "941": "FL",
        "954": "FL",
        "229": "GA",
        "404": "GA",
        "470": "GA",
        "478": "GA",
        "678": "GA",
        "706": "GA",
        "762": "GA",
        "770": "GA",
        "912": "GA",
        "808": "HI",
        "208": "ID",
        "986": "ID",
        "217": "IL",
        "224": "IL",
        "309": "IL",
        "312": "IL",
        "331": "IL",
        "618": "IL",
        "630": "IL",
        "708": "IL",
        "773": "IL",
        "779": "IL",
        "815": "IL",
        "847": "IL",
        "872": "IL",
        "219": "IN",
        "260": "IN",
        "317": "IN",
        "463": "IN",
        "574": "IN",
        "765": "IN",
        "812": "IN",
        "930": "IN",
        "319": "IA",
        "515": "IA",
        "563": "IA",
        "641": "IA",
        "712": "IA",
        "316": "KS",
        "620": "KS",
        "785": "KS",
        "913": "KS",
        "270": "KY",
        "364": "KY",
        "502": "KY",
        "606": "KY",
        "859": "KY",
        "225": "LA",
        "318": "LA",
        "337": "LA",
        "504": "LA",
        "985": "LA",
        "207": "ME",
        "240": "MD",
        "301": "MD",
        "410": "MD",
        "443": "MD",
        "667": "MD",
        "339": "MA",
        "351": "MA",
        "413": "MA",
        "508": "MA",
        "617": "MA",
        "774": "MA",
        "781": "MA",
        "857": "MA",
        "978": "MA",
        "231": "MI",
        "248": "MI",
        "269": "MI",
        "313": "MI",
        "517": "MI",
        "586": "MI",
        "616": "MI",
        "679": "MI",
        "734": "MI",
        "810": "MI",
        "906": "MI",
        "947": "MI",
        "989": "MI",
        "218": "MN",
        "320": "MN",
        "507": "MN",
        "612": "MN",
        "651": "MN",
        "763": "MN",
        "952": "MN",
        "228": "MS",
        "601": "MS",
        "662": "MS",
        "769": "MS",
        "314": "MO",
        "417": "MO",
        "573": "MO",
        "636": "MO",
        "660": "MO",
        "816": "MO",
        "406": "MT",
        "308": "NE",
        "402": "NE",
        "531": "NE",
        "702": "NV",
        "725": "NV",
        "775": "NV",
        "603": "NH",
        "201": "NJ",
        "551": "NJ",
        "609": "NJ",
        "640": "NJ",
        "732": "NJ",
        "848": "NJ",
        "856": "NJ",
        "862": "NJ",
        "908": "NJ",
        "973": "NJ",
        "505": "NM",
        "575": "NM",
        "212": "NY",
        "315": "NY",
        "332": "NY",
        "347": "NY",
        "516": "NY",
        "518": "NY",
        "585": "NY",
        "607": "NY",
        "631": "NY",
        "646": "NY",
        "680": "NY",
        "716": "NY",
        "718": "NY",
        "838": "NY",
        "845": "NY",
        "914": "NY",
        "917": "NY",
        "929": "NY",
        "934": "NY",
        "252": "NC",
        "336": "NC",
        "704": "NC",
        "743": "NC",
        "828": "NC",
        "910": "NC",
        "919": "NC",
        "980": "NC",
        "984": "NC",
        "701": "ND",
        "216": "OH",
        "220": "OH",
        "234": "OH",
        "330": "OH",
        "380": "OH",
        "419": "OH",
        "440": "OH",
        "513": "OH",
        "567": "OH",
        "614": "OH",
        "740": "OH",
        "937": "OH",
        "405": "OK",
        "539": "OK",
        "580": "OK",
        "918": "OK",
        "458": "OR",
        "503": "OR",
        "541": "OR",
        "971": "OR",
        "215": "PA",
        "267": "PA",
        "272": "PA",
        "412": "PA",
        "484": "PA",
        "570": "PA",
        "610": "PA",
        "717": "PA",
        "724": "PA",
        "814": "PA",
        "878": "PA",
        "401": "RI",
        "803": "SC",
        "843": "SC",
        "854": "SC",
        "864": "SC",
        "605": "SD",
        "423": "TN",
        "615": "TN",
        "629": "TN",
        "731": "TN",
        "865": "TN",
        "901": "TN",
        "931": "TN",
        "214": "TX",
        "254": "TX",
        "281": "TX",
        "325": "TX",
        "346": "TX",
        "361": "TX",
        "409": "TX",
        "430": "TX",
        "432": "TX",
        "469": "TX",
        "512": "TX",
        "713": "TX",
        "726": "TX",
        "737": "TX",
        "806": "TX",
        "817": "TX",
        "830": "TX",
        "832": "TX",
        "903": "TX",
        "915": "TX",
        "936": "TX",
        "940": "TX",
        "956": "TX",
        "972": "TX",
        "979": "TX",
        "385": "UT",
        "435": "UT",
        "801": "UT",
        "802": "VT",
        "276": "VA",
        "434": "VA",
        "540": "VA",
        "571": "VA",
        "703": "VA",
        "757": "VA",
        "804": "VA",
        "206": "WA",
        "253": "WA",
        "360": "WA",
        "425": "WA",
        "509": "WA",
        "564": "WA",
        "304": "WV",
        "681": "WV",
        "262": "WI",
        "414": "WI",
        "534": "WI",
        "608": "WI",
        "715": "WI",
        "920": "WI",
        "307": "WY",
      }

      // ✅ SILENT STATE EXTRACTION: No logging, no caching overhead, just instant lookup
      const extractStateFromPhone = (phoneNumber: string): string => {
        if (!phoneNumber) return "Unknown State"

        // Extract digits only - fastest method
        const digits = phoneNumber.replace(/\D/g, "")
        if (digits.length < 10) return "Unknown State"

        // Get area code (handle both 10 and 11 digit numbers)
        const areaCode = digits.length === 11 ? digits.substring(1, 4) : digits.substring(0, 3)

        // Instant lookup - no logging, no caching, no overhead
        return AREA_CODE_TO_STATE[areaCode] || "Unknown State"
      }

      // ✅ OPTIMIZED PROCESSING: Process all records at once without batching overhead
      console.log(`📊 Processing ${recordedCallsOnly.length} recorded calls with optimized state extraction`)

      const transformedCallLogs = recordedCallsOnly.map((record: any, index: number) => {
        // Convert timestamp to ISO string
        const callStartTime = record.callDt ? new Date(record.callDt).toISOString() : new Date().toISOString()
        const callEndTime = record.callCompletedDt ? new Date(record.callCompletedDt).toISOString() : null

        return {
          id: record.inboundCallId || `call_${index}_${Date.now()}`,
          campaignId: record.campaignId || campaignId,
          campaignName: record.campaignName || "Unknown Campaign",
          callerId: record.inboundPhoneNumber || "Unknown",
          calledNumber: record.targetNumber || record.inboundPhoneNumber || "Unknown",
          startTime: callStartTime,
          endTime: callEndTime,
          duration: record.callLengthInSeconds || 0,
          connectedDuration: record.connectedCallLengthInSeconds || 0,
          timeToConnect: record.timeToConnectInSeconds || 0,
          status: record.hasConnected ? "connected" : "not-connected",
          disposition: record.hasConverted ? "converted" : "not-converted",
          direction: "inbound", // RingBA tracks inbound calls
          recordingUrl: record.recordingUrl || null,
          hasRecording: record.hasRecording || false,
          agentName: record.targetName || "Unknown Agent",
          publisherName: record.publisherName || "Unknown Publisher",
          revenue: record.conversionAmount || 0,
          payout: record.payoutAmount || 0,
          cost: record.totalCost || 0,
          profit: record.profitNet || 0,
          endCallSource: record.endCallSource || "Unknown",
          quality:
            record.callLengthInSeconds > 60
              ? "excellent"
              : record.callLengthInSeconds > 30
                ? "good"
                : record.callLengthInSeconds > 0
                  ? "fair"
                  : "poor",
          tags: [],
          isTranscribed: false,
          transcriptionStatus: "pending",
          transcript: null,
          analysis: null,
          metadata: {
            ...record,
            // Add formatted timestamps for easier reading
            callStartTimeFormatted: new Date(record.callDt).toLocaleString(),
            callEndTimeFormatted: record.callCompletedDt ? new Date(record.callCompletedDt).toLocaleString() : null,
            // Enhanced field mapping with better fallbacks
            buyerName: record.buyer || record.targetName || "Unknown Buyer",
            state: extractStateFromPhone(record.inboundPhoneNumber || record.targetNumber || ""), // ✅ SILENT STATE EXTRACTION
            hangupSource: record.endCallSource || "Unknown",
            targetName: record.targetName || "Unknown Target",
            // Additional RingBA specific fields
            originalBuyer: record.buyer,
            originalTarget: record.targetName,
            originalPublisher: record.publisherName,
          },
        }
      })

      console.log(`✅ Successfully transformed ${transformedCallLogs.length} recorded call logs`)

      return NextResponse.json({
        success: true,
        data: transformedCallLogs,
        total: transformedCallLogs.length,
        campaignId: campaignId,
        dateRange: {
          startDate,
          endDate,
        },
        filterInfo: {
          originalCount: records.length,
          recordedCount: recordedCallsOnly.length,
          filteredOut: records.length - recordedCallsOnly.length,
        },
        method: "RingBA API v2 - Recordings Only Filter",
        endpoint: endpoint,
        dataSource: "RINGBA_API",
        apiResponse: {
          isSuccessful: data.isSuccessful,
          transactionId: data.transactionId,
          partialResult: data.report?.partialResult,
          totalCount: data.report?.totalCount,
        },
        debug: {
          requestBody: requestBody,
          responseStructure: {
            isSuccessful: data.isSuccessful,
            hasReport: !!data.report,
            recordCount: records.length,
            recordedCallsCount: recordedCallsOnly.length,
            firstRecordKeys: recordedCallsOnly.length > 0 ? Object.keys(recordedCallsOnly[0]) : [],
            availableFields: {
              buyer: recordedCallsOnly.length > 0 ? !!recordedCallsOnly[0].buyer : false,
              targetName: recordedCallsOnly.length > 0 ? !!recordedCallsOnly[0].targetName : false,
              endCallSource: recordedCallsOnly.length > 0 ? !!recordedCallsOnly[0].endCallSource : false,
              publisherName: recordedCallsOnly.length > 0 ? !!recordedCallsOnly[0].publisherName : false,
            },
            stateExtractionStats: {
              method: "Silent lookup table - no logging, no batching",
              processingType: "Single pass transformation",
              totalRecords: recordedCallsOnly.length,
            },
          },
        },
      })
    } else {
      // Enhanced error handling for 422 and other errors
      let errorText
      let errorData
      try {
        errorText = await response.text()
        try {
          errorData = JSON.parse(errorText)
        } catch {
          // errorText is not JSON
        }
      } catch (textError) {
        errorText = "Could not read error response"
      }

      console.error(`❌ RingBA API Error: ${response.status} - ${errorText}`)

      // Special handling for 422 validation errors
      if (response.status === 422) {
        return NextResponse.json(
          {
            success: false,
            error: `RingBA API Validation Error (422)`,
            details: errorText,
            ringbaError: errorData,
            troubleshooting: {
              error422: "Validation error - one or more request parameters are invalid",
              commonCauses: [
                "Invalid column names in valueColumns array",
                "Invalid date format (should be ISO 8601)",
                "Invalid campaign ID",
                "Invalid filter values or comparison types",
                "Requesting columns that don't exist for your account",
              ],
              solution: "Check the request format and ensure all column names are valid for your RingBA account",
              requestSent: requestBody,
            },
            endpoint: endpoint,
            campaignId: campaignId,
            dateRange: { startDate, endDate },
          },
          { status: 422 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `RingBA API Error (${response.status})`,
          details: errorText,
          ringbaError: errorData,
          endpoint: endpoint,
          campaignId: campaignId,
          dateRange: { startDate, endDate },
          requestBody: requestBody,
          troubleshooting: {
            status400: "Bad request - check request format",
            status401: "Unauthorized - check API key",
            status403: "Forbidden - check permissions",
            status404: "Not found - check endpoint URL",
            status422: "Validation error - check data format and column names",
            status500: "Server error - try again later",
          },
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("💥 Unexpected error in call logs API:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        campaignId: params.campaignId,
        timestamp: new Date().toISOString(),
        troubleshooting: {
          checkLogs: "Check server logs for detailed error information",
          checkCredentials: "Verify RingBA API credentials are set",
          checkNetwork: "Verify network connectivity to RingBA API",
        },
      },
      { status: 500 },
    )
  }
}
