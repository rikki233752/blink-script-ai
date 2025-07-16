"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp } from "lucide-react"

interface BuyerPerformanceMetricsProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
  selectedCampaign: string
}

interface BuyerData {
  name: string
  calls: number
  conversions: number
  conversionRate: number
  revenue: number
  averageValue: number
  qualityScore: number
  change: number
}

export function BuyerPerformanceMetrics({
  dateRange,
  comparisonMode,
  comparisonDateRange,
  selectedCampaign,
}: BuyerPerformanceMetricsProps) {
  // Mock data - in a real implementation, this would come from an API call
  const buyersData: BuyerData[] = [
    {
      name: "Aetna Insurance",
      calls: 845,
      conversions: 211,
      conversionRate: 25.0,
      revenue: 105500,
      averageValue: 500,
      qualityScore: 92,
      change: 7.2,
    },
    {
      name: "Blue Cross",
      calls: 720,
      conversions: 180,
      conversionRate: 25.0,
      revenue: 81000,
      averageValue: 450,
      qualityScore: 88,
      change: 5.8,
    },
    {
      name: "UnitedHealth",
      calls: 680,
      conversions: 170,
      conversionRate: 25.0,
      revenue: 93500,
      averageValue: 550,
      qualityScore: 90,
      change: 4.3,
    },
    {
      name: "Cigna Health",
      calls: 580,
      conversions: 145,
      conversionRate: 25.0,
      revenue: 72500,
      averageValue: 500,
      qualityScore: 85,
      change: -2.1,
    },
    {
      name: "Humana",
      calls: 520,
      conversions: 130,
      conversionRate: 25.0,
      revenue: 58500,
      averageValue: 450,
      qualityScore: 87,
      change: 3.5,
    },
    {
      name: "Kaiser Permanente",
      calls: 480,
      conversions: 120,
      conversionRate: 25.0,
      revenue: 66000,
      averageValue: 550,
      qualityScore: 89,
      change: 6.2,
    },
    {
      name: "Anthem",
      calls: 420,
      conversions: 105,
      conversionRate: 25.0,
      revenue: 47250,
      averageValue: 450,
      qualityScore: 84,
      change: -1.8,
    },
    {
      name: "Centene",
      calls: 380,
      conversions: 95,
      conversionRate: 25.0,
      revenue: 42750,
      averageValue: 450,
      qualityScore: 82,
      change: -3.2,
    },
  ]

  // Data for charts
  const conversionData = buyersData.map((buyer) => ({
    name: buyer.name,
    conversions: buyer.conversions,
    conversionRate: buyer.conversionRate,
  }))

  const revenueData = buyersData.map((buyer) => ({
    name: buyer.name,
    revenue: buyer.revenue / 1000, // Convert to thousands for better display
    averageValue: buyer.averageValue,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buyer Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="conversions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversions">Conversions</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="conversions" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="conversions" name="Conversions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar
                      yAxisId="right"
                      dataKey="conversionRate"
                      name="Conversion Rate (%)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 1000]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue" ? `$${(value * 1000).toLocaleString()}` : `$${value}`,
                        name === "revenue" ? "Revenue" : "Avg. Value",
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue ($K)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar
                      yAxisId="right"
                      dataKey="averageValue"
                      name="Average Value ($)"
                      fill="#f97316"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buyer Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Conv. Rate</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg. Value</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyersData.map((buyer) => (
                  <TableRow key={buyer.name}>
                    <TableCell className="font-medium">{buyer.name}</TableCell>
                    <TableCell>{buyer.calls.toLocaleString()}</TableCell>
                    <TableCell>{buyer.conversions.toLocaleString()}</TableCell>
                    <TableCell>{buyer.conversionRate}%</TableCell>
                    <TableCell>${buyer.revenue.toLocaleString()}</TableCell>
                    <TableCell>${buyer.averageValue}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          buyer.qualityScore >= 90
                            ? "bg-green-100 text-green-800"
                            : buyer.qualityScore >= 80
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {buyer.qualityScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center ${buyer.change > 0 ? "text-green-600" : "text-red-600"}`}>
                        {buyer.change > 0 ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        <span>{Math.abs(buyer.change)}%</span>
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
