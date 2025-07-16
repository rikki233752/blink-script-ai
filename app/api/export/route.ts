import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { format, dateRange, campaigns, metrics } = body

    // Simulate export processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const exportData = {
      exportId: `export_${Date.now()}`,
      format,
      dateRange,
      campaigns: campaigns || [],
      metrics: metrics || [],
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/export/download/${Date.now()}`,
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      message: `Export generated successfully in ${format.toUpperCase()} format`,
    })
  } catch (error) {
    console.error("Error generating export:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate export",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    // Generate mock CSV data
    const csvData = `Campaign Name,Average Score,Total Calls,QC Approved,QC Rejected,Completed CA,Revenue
Martell Group - ACA,4.2,1250,980,45,1025,$125000
Martell Group - Medicare,3.8,890,650,78,728,$89500
test,4.5,2100,1850,125,1975,$210000
TEST - ACA Camp,4.1,750,620,35,655,$67500`

    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", `attachment; filename="campaigns_export.${format}"`)

    return new NextResponse(csvData, { headers })
  } catch (error) {
    console.error("Error downloading export:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to download export",
      },
      { status: 500 },
    )
  }
}
