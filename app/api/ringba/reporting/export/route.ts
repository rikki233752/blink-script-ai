import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Mock CSV data for export
    const csvData = `Campaign,Publisher,Target,Buyer,Dialed #,Number Pool,Date,Duplicate,Revenue,Payout
ACA (2) - Tier 1,ACA (2) - Tier 1,,,83853,83852,2025,12923,$1216741.04,$930635.92
Medi (2) - Tier 2,Medi (2) - Tier 2,,,83106,83099,2025,38189,$311164.76,$224815.55
ACA (2) - Tier 2,ACA (2) - Tier 2,,,45941,45940,2025,8109,$445694.10,$347947.53
ACA (2) - Tier 1H,ACA (2) - Tier 1H,,,38839,38838,2025,4404,$586642.94,$436589.24
Medi (2) - Tier 1,Medi (2) - Tier 1,,,35479,35476,2025,24786,$106974.57,$81763.08
Medi - Internal,Medi - Internal,,,32326,28852,2025,6791,$188264.45,$164264.03`

    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", `attachment; filename="ringba-report.${format}"`)

    return new NextResponse(csvData, { headers })
  } catch (error) {
    console.error("Error in export endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
