"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface TrendAnalysisChartProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
}

export function TrendAnalysisChart({ dateRange, comparisonMode, comparisonDateRange }: TrendAnalysisChartProps) {
  // Mock data - in a real implementation, this would come from an API call
  const trendData = [
    { date: "Jun 1", calls: 180, conversions: 45, qualityScore: 82, sentimentScore: 78 },
    { date: "Jun 2", calls: 220, conversions: 55, qualityScore: 84, sentimentScore: 80 },
    { date: "Jun 3", calls: 250, conversions: 62, qualityScore: 85, sentimentScore: 81 },
    { date: "Jun 4", calls: 190, conversions: 48, qualityScore: 83, sentimentScore: 79 },
    { date: "Jun 5", calls: 210, conversions: 52, qualityScore: 86, sentimentScore: 82 },
    { date: "Jun 6", calls: 240, conversions: 60, qualityScore: 87, sentimentScore: 83 },
    { date: "Jun 7", calls: 280, conversions: 70, qualityScore: 88, sentimentScore: 84 },
    { date: "Jun 8", calls: 260, conversions: 65, qualityScore: 86, sentimentScore: 82 },
    { date: "Jun 9", calls: 230, conversions: 58, qualityScore: 85, sentimentScore: 81 },
    { date: "Jun 10", calls: 270, conversions: 67, qualityScore: 87, sentimentScore: 83 },
    { date: "Jun 11", calls: 290, conversions: 72, qualityScore: 88, sentimentScore: 84 },
    { date: "Jun 12", calls: 310, conversions: 78, qualityScore: 89, sentimentScore: 85 },
    { date: "Jun 13", calls: 320, conversions: 80, qualityScore: 90, sentimentScore: 86 },
    { date: "Jun 14", calls: 300, conversions: 75, qualityScore: 88, sentimentScore: 84 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calls" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calls">Call Volume</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
            <TabsTrigger value="quality">Quality Score</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          </TabsList>

          <TabsContent value="calls" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    name="Daily Calls"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="conversions" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    name="Daily Conversions"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="qualityScore"
                    name="Quality Score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sentimentScore"
                    name="Sentiment Score"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: "#ec4899", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
