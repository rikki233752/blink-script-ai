"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface QualityScoreDistributionProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
}

export function QualityScoreDistribution({
  dateRange,
  comparisonMode,
  comparisonDateRange,
}: QualityScoreDistributionProps) {
  // Mock data - in a real implementation, this would come from an API call
  const distributionData = [
    { range: "90-100", count: 1250, percentage: 25.5, label: "Excellent" },
    { range: "80-89", count: 1710, percentage: 35.0, label: "Good" },
    { range: "70-79", count: 1467, percentage: 30.0, label: "Average" },
    { range: "60-69", count: 342, percentage: 7.0, label: "Below Average" },
    { range: "0-59", count: 123, percentage: 2.5, label: "Poor" },
  ]

  const qualityMetrics = [
    { metric: "Average Quality Score", value: "86.3", change: "+2.1" },
    { metric: "Median Quality Score", value: "84.0", change: "+1.8" },
    { metric: "Top Performers (90+)", value: "25.5%", change: "+3.2%" },
    { metric: "Needs Improvement (<70)", value: "9.5%", change: "-1.5%" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quality Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "count" ? `${value} calls` : `${value}%`,
                    name === "count" ? "Call Count" : "Percentage",
                  ]}
                />
                <Legend />
                <Bar dataKey="count" name="Call Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{metric.value}</span>
                    <Badge
                      variant="outline"
                      className={
                        metric.change.startsWith("+")
                          ? "text-green-600 border-green-200"
                          : "text-red-600 border-red-200"
                      }
                    >
                      {metric.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Range Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Score Range</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributionData.map((item) => (
                    <TableRow key={item.range}>
                      <TableCell className="font-medium">{item.range}</TableCell>
                      <TableCell>{item.count.toLocaleString()}</TableCell>
                      <TableCell>{item.percentage}%</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.label === "Excellent"
                              ? "bg-green-100 text-green-800"
                              : item.label === "Good"
                                ? "bg-blue-100 text-blue-800"
                                : item.label === "Average"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }
                        >
                          {item.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
