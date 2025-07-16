"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"

interface ConversionFunnelChartProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
}

export function ConversionFunnelChart({ dateRange, comparisonMode, comparisonDateRange }: ConversionFunnelChartProps) {
  // Mock data - in a real implementation, this would come from an API call
  const funnelData = [
    { stage: "Total Calls", count: 4892, percentage: 100, color: "#3b82f6" },
    { stage: "Qualified Leads", count: 3914, percentage: 80, color: "#10b981" },
    { stage: "Interested", count: 2935, percentage: 60, color: "#f97316" },
    { stage: "Proposal Sent", count: 1957, percentage: 40, color: "#8b5cf6" },
    { stage: "Converted", count: 1213, percentage: 24.8, color: "#ec4899" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 5000]} />
              <YAxis dataKey="stage" type="category" width={120} />
              <Tooltip
                formatter={(value, name) => [
                  `${value} (${funnelData.find((d) => d.count === value)?.percentage}%)`,
                  "Count",
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 text-sm">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="text-center">
              <div className="font-semibold">{stage.count.toLocaleString()}</div>
              <div className="text-muted-foreground">{stage.percentage}%</div>
              <div className="text-xs text-muted-foreground">{stage.stage}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
