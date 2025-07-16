"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface TeamComparisonChartProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
}

export function TeamComparisonChart({ dateRange, comparisonMode, comparisonDateRange }: TeamComparisonChartProps) {
  // Mock data - in a real implementation, this would come from an API call
  const teamPerformanceData = [
    {
      name: "Sales Team",
      calls: 2450,
      conversions: 612,
      conversionRate: 25.0,
      qualityScore: 87,
      avgCallDuration: 7.5,
      sentimentScore: 84,
    },
    {
      name: "Support Team",
      calls: 3120,
      conversions: 468,
      conversionRate: 15.0,
      qualityScore: 79,
      avgCallDuration: 9.8,
      sentimentScore: 73,
    },
    {
      name: "Retention Team",
      calls: 1680,
      conversions: 504,
      conversionRate: 30.0,
      qualityScore: 85,
      avgCallDuration: 11.2,
      sentimentScore: 82,
    },
  ]

  // Comparison data (if comparison mode is enabled)
  const comparisonData = [
    {
      name: "Sales Team",
      calls: 2280,
      conversions: 547,
      conversionRate: 24.0,
      qualityScore: 84,
      avgCallDuration: 7.8,
      sentimentScore: 81,
    },
    {
      name: "Support Team",
      calls: 2950,
      conversions: 413,
      conversionRate: 14.0,
      qualityScore: 81,
      avgCallDuration: 10.2,
      sentimentScore: 75,
    },
    {
      name: "Retention Team",
      calls: 1520,
      conversions: 425,
      conversionRate: 28.0,
      qualityScore: 83,
      avgCallDuration: 10.8,
      sentimentScore: 80,
    },
  ]

  // Combined data for comparison mode
  const combinedData = teamPerformanceData.map((team, index) => ({
    name: team.name,
    current: team.qualityScore,
    previous: comparisonData[index].qualityScore,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quality" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quality">Quality Score</TabsTrigger>
            <TabsTrigger value="conversion">Conversion Rate</TabsTrigger>
            <TabsTrigger value="calls">Call Volume</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment Score</TabsTrigger>
          </TabsList>

          <TabsContent value="quality" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonMode ? combinedData : teamPerformanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  {comparisonMode ? (
                    <>
                      <Bar dataKey="current" name="Current Period" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="previous" name="Previous Period" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="qualityScore" name="Quality Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 40]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversionRate" name="Conversion Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" name="Total Calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sentimentScore" name="Sentiment Score" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
