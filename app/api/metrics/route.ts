import { type NextRequest, NextResponse } from "next/server"
import { format, subDays, addDays } from "date-fns"

export interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

export interface MetricsSummary {
  totalAverageScore: number
  totalCalls: number
  accountHours: number
  avgCallDuration: number
  commissionable: number
  cpa: number
  revenue: number
  skipped: number
  completed: number
  qcApproved: number
  qcRejected: number
}

// Update the GET function to return real data or zeros

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get("metric") || "avgScore"
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    // Generate empty chart data with zero values
    const chartData: ChartDataPoint[] = []
    const startDate = fromDate ? new Date(fromDate) : subDays(new Date(), 30)
    const endDate = toDate ? new Date(toDate) : new Date()

    // Campaign data with zero values
    const campaigns = [{ name: "No Data", color: "#6b7280" }]

    // Generate data points with zeros
    for (let d = new Date(startDate); d <= endDate; d = addDays(d, 7)) {
      const dataPoint: ChartDataPoint = {
        date: format(d, "MMM dd"),
        "No Data": 0,
      }
      chartData.push(dataPoint)
    }

    // Summary with zero values
    const summary: MetricsSummary = {
      totalAverageScore: 0,
      totalCalls: 0,
      accountHours: 0,
      avgCallDuration: 0,
      commissionable: 0,
      cpa: 0,
      revenue: 0,
      skipped: 0,
      completed: 0,
      qcApproved: 0,
      qcRejected: 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary,
        campaigns: campaigns.map((c) => ({ name: c.name, color: c.color })),
      },
    })
  } catch (error) {
    console.error("Error fetching metrics:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metrics",
      },
      { status: 500 },
    )
  }
}
