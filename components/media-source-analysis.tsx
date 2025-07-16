"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp } from "lucide-react"

interface MediaSourceAnalysisProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
  selectedCampaign: string
}

interface MediaSource {
  name: string
  calls: number
  conversions: number
  conversionRate: number
  cost: number
  cpa: number
  roi: number
  change: number
}

export function MediaSourceAnalysis({
  dateRange,
  comparisonMode,
  comparisonDateRange,
  selectedCampaign,
}: MediaSourceAnalysisProps) {
  // Mock data - in a real implementation, this would come from an API call
  const mediaSources: MediaSource[] = [
    {
      name: "Facebook Ads",
      calls: 1250,
      conversions: 312,
      conversionRate: 25.0,
      cost: 18750,
      cpa: 60.1,
      roi: 210,
      change: 5.2,
    },
    {
      name: "Google Search",
      calls: 980,
      conversions: 245,
      conversionRate: 25.0,
      cost: 12250,
      cpa: 50.0,
      roi: 245,
      change: 8.7,
    },
    {
      name: "Display Network",
      calls: 720,
      conversions: 144,
      conversionRate: 20.0,
      cost: 8640,
      cpa: 60.0,
      roi: 180,
      change: -2.3,
    },
    {
      name: "Email Campaigns",
      calls: 580,
      conversions: 174,
      conversionRate: 30.0,
      cost: 5800,
      cpa: 33.3,
      roi: 320,
      change: 12.5,
    },
    {
      name: "Referral Partners",
      calls: 420,
      conversions: 126,
      conversionRate: 30.0,
      cost: 4200,
      cpa: 33.3,
      roi: 340,
      change: 7.8,
    },
    {
      name: "Direct Mail",
      calls: 350,
      conversions: 70,
      conversionRate: 20.0,
      cost: 10500,
      cpa: 150.0,
      roi: 80,
      change: -5.4,
    },
    {
      name: "TV Advertising",
      calls: 320,
      conversions: 64,
      conversionRate: 20.0,
      cost: 24000,
      cpa: 375.0,
      roi: 40,
      change: -8.2,
    },
    {
      name: "Radio Spots",
      calls: 272,
      conversions: 54,
      conversionRate: 20.0,
      cost: 13600,
      cpa: 250.0,
      roi: 60,
      change: -3.1,
    },
  ]

  // Data for pie charts
  const callsData = mediaSources.map((source) => ({
    name: source.name,
    value: source.calls,
  }))

  const conversionData = mediaSources.map((source) => ({
    name: source.name,
    value: source.conversions,
  }))

  const costData = mediaSources.map((source) => ({
    name: source.name,
    value: source.cost,
  }))

  // Colors for pie chart
  const COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f97316", // orange
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f59e0b", // amber
    "#6366f1", // indigo
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Source Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calls" className="space-y-4">
            <TabsList>
              <TabsTrigger value="calls">Call Volume</TabsTrigger>
              <TabsTrigger value="conversions">Conversions</TabsTrigger>
              <TabsTrigger value="cost">Ad Spend</TabsTrigger>
            </TabsList>

            <TabsContent value="calls" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={callsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {callsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} calls`, "Volume"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="conversions" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} conversions`, "Conversions"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="cost" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Ad Spend"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media Source Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Media Source</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Conv. Rate</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>CPA</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediaSources.map((source) => (
                  <TableRow key={source.name}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>{source.calls.toLocaleString()}</TableCell>
                    <TableCell>{source.conversions.toLocaleString()}</TableCell>
                    <TableCell>{source.conversionRate}%</TableCell>
                    <TableCell>${source.cost.toLocaleString()}</TableCell>
                    <TableCell>${source.cpa.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          source.roi > 200
                            ? "bg-green-100 text-green-800"
                            : source.roi > 100
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {source.roi}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center ${source.change > 0 ? "text-green-600" : "text-red-600"}`}>
                        {source.change > 0 ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        <span>{Math.abs(source.change)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
