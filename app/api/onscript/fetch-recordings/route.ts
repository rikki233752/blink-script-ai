import { type NextRequest, NextResponse } from "next/server"

interface OnScriptRecording {
  id: string
  campaignName: string
  recordingUrl: string
  audioDuration: number
  affiliateName: string
  clientPhone: string
  aniOutbound: string
  targetName: string
  buyerName: string
  hangupDirection: string
  revenue: number
  clientState: string
  apiKey: string
  status: "pending" | "processing" | "completed" | "failed"
  createdAt: string
}

const ONSCRIPT_CAMPAIGNS = [
  {
    apiKey: "8f7a2d2d-ee0a-4701-8f92-0acca47cbbe9",
    name: "Medicare Advantage Campaign",
    color: "#ef4444", // red
  },
  {
    apiKey: "6b8d64c5-52ae-409a-bb1f-5ac8a03752a8",
    name: "Healthcare Lead Generation",
    color: "#f59e0b", // orange
  },
]

// Generate mock recordings for testing
function generateMockRecordings(): OnScriptRecording[] {
  const mockRecordings: OnScriptRecording[] = []

  for (let i = 0; i < 10; i++) {
    const campaign = ONSCRIPT_CAMPAIGNS[i % 2]
    const recordingId = `mock_${Date.now()}_${i}`

    mockRecordings.push({
      id: recordingId,
      campaignName: campaign.name,
      recordingUrl: `https://example.com/recordings/call_${i + 1}.mp3`,
      audioDuration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      affiliateName: [
        "Health Partners LLC",
        "Lead Gen Pro",
        "Medicare Specialists",
        "Healthcare Connect",
        "Insurance Direct",
      ][i % 5],
      clientPhone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      aniOutbound: `(800) 555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      targetName: [
        "Medicare Specialist",
        "Insurance Agent",
        "Health Advisor",
        "Benefits Coordinator",
        "Senior Specialist",
      ][i % 5],
      buyerName: [
        "HealthCare Solutions",
        "Premium Health Plans",
        "Medicare Direct",
        "Senior Benefits Co",
        "Health Insurance Plus",
      ][i % 5],
      hangupDirection: ["caller", "agent", "system"][i % 3],
      revenue: Math.round((Math.random() * 200 + 50) * 100) / 100, // $50-$250
      clientState: ["CA", "TX", "FL", "NY", "IL"][i % 5],
      apiKey: campaign.apiKey,
      status: ["pending", "processing", "completed"][i % 3] as any,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
    })
  }

  return mockRecordings
}

export async function GET(request: NextRequest) {
  console.log("🎯 OnScript fetch-recordings API called")

  try {
    const { searchParams } = new URL(request.url)
    const campaignFilter = searchParams.get("campaign")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const page = Number.parseInt(searchParams.get("page") || "1")

    console.log(`📊 Request params:`, { campaignFilter, limit, page })

    // For now, let's use mock data to avoid dependency issues
    console.log("📝 Using mock data for OnScript recordings")

    const mockRecordings = generateMockRecordings()

    // Filter by campaign if specified
    const filteredRecordings = campaignFilter
      ? mockRecordings.filter((rec) => rec.campaignName.toLowerCase().includes(campaignFilter.toLowerCase()))
      : mockRecordings

    console.log(`✅ Generated ${filteredRecordings.length} mock recordings`)

    return NextResponse.json({
      success: true,
      data: {
        recordings: filteredRecordings,
        campaigns: ONSCRIPT_CAMPAIGNS,
        total: filteredRecordings.length,
        page,
        limit,
      },
      meta: {
        source: "mock-data",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Error in OnScript fetch-recordings:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    })

    // Return a basic response even if there's an error
    return NextResponse.json({
      success: true,
      data: {
        recordings: [],
        campaigns: ONSCRIPT_CAMPAIGNS,
        total: 0,
        page: 1,
        limit: 50,
      },
      meta: {
        source: "error-fallback",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
    })
  }
}
