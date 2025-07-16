"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { format, subDays } from "date-fns"
import { CalendarIcon, Download, RefreshCw, Share2, ChevronDown } from "lucide-react"

import { PerformanceMetricsGrid } from "./performance-metrics-grid"
import { AgentPerformanceTable } from "./agent-performance-table"
import { TeamComparisonChart } from "./team-comparison-chart"
import { MediaSourceAnalysis } from "./media-source-analysis"
import { BuyerPerformanceMetrics } from "./buyer-performance-metrics"
import { ConversionFunnelChart } from "./conversion-funnel-chart"
import { TrendAnalysisChart } from "./trend-analysis-chart"
import { QualityScoreDistribution } from "./quality-score-distribution"

interface DateRange {
  from: Date
  to: Date
}

export function DataAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedCampaign, setSelectedCampaign] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonDateRange, setComparisonDateRange] = useState<DateRange>({
    from: subDays(new Date(), 60),
    to: subDays(new Date(), 31),
  })

  const refreshData = () => {
    setIsLoading(true)
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const exportData = () => {
    alert("Exporting data...")
  }

  const shareReport = () => {
    alert("Sharing report...")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Analysis</h1>
          <p className="text-muted-foreground">
            Advanced analytics and insights for calls, agents, teams, and campaigns
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to })
                  }
                }}
                initialFocus
              />
              <div className="p-3 border-t border-border">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: subDays(new Date(), 7),
                        to: new Date(),
                      })
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: subDays(new Date(), 30),
                        to: new Date(),
                      })
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: subDays(new Date(), 90),
                        to: new Date(),
                      })
                    }}
                  >
                    Last 90 days
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Team Selector */}
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="sales">Sales Team</SelectItem>
              <SelectItem value="support">Support Team</SelectItem>
              <SelectItem value="retention">Retention Team</SelectItem>
            </SelectContent>
          </Select>

          {/* Campaign Selector */}
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="medicare">Medicare Campaign</SelectItem>
              <SelectItem value="insurance">Insurance Sales</SelectItem>
              <SelectItem value="retention">Customer Retention</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <Button variant="outline" onClick={() => setComparisonMode(!comparisonMode)}>
            {comparisonMode ? "Hide Comparison" : "Compare Periods"}
          </Button>

          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" onClick={shareReport}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Comparison Period Selector (conditionally rendered) */}
      {comparisonMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Comparison Period</CardTitle>
            <CardDescription>Select a period to compare with your current selection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(comparisonDateRange.from, "MMM d, yyyy")} - {format(comparisonDateRange.to, "MMM d, yyyy")}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: comparisonDateRange.from,
                      to: comparisonDateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setComparisonDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setComparisonDateRange({
                            from: subDays(dateRange.from, 7),
                            to: subDays(dateRange.from, 1),
                          })
                        }}
                      >
                        Previous Period
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setComparisonDateRange({
                            from: subDays(new Date(), 365),
                            to: subDays(new Date(), 335),
                          })
                        }}
                      >
                        Year Ago
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Current: {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Comparison: {format(comparisonDateRange.from, "MMM d")} -{" "}
                  {format(comparisonDateRange.to, "MMM d, yyyy")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="teams">Team Analysis</TabsTrigger>
          <TabsTrigger value="buyers">Buyer Performance</TabsTrigger>
          <TabsTrigger value="media">Media Sources</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <PerformanceMetricsGrid
            dateRange={dateRange}
            comparisonMode={comparisonMode}
            comparisonDateRange={comparisonDateRange}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TrendAnalysisChart
              dateRange={dateRange}
              comparisonMode={comparisonMode}
              comparisonDateRange={comparisonDateRange}
            />
            <ConversionFunnelChart
              dateRange={dateRange}
              comparisonMode={comparisonMode}
              comparisonDateRange={comparisonDateRange}
            />
          </div>
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-6">
          <AgentPerformanceTable
            dateRange={dateRange}
            comparisonMode={comparisonMode}
            comparisonDateRange={comparisonDateRange}
            selectedTeam={selectedTeam}
          />
        </TabsContent>

        {/* Team Analysis Tab */}
        <TabsContent value="teams" className="space-y-6">
          <TeamComparisonChart
            dateRange={dateRange}
            comparisonMode={comparisonMode}
            comparisonDateRange={comparisonDateRange}
          />
        </TabsContent>

        {/* Buyer Performance Tab */}
        <TabsContent value="buyers" className="space-y-6">
          <BuyerPerformanceMetrics
            dateRange={dateRange}
            comparisonMode={comparisonMode}
            comparisonDateRange={comparisonDateRange}
            selectedCampaign={selectedCampaign}
          />
        </TabsContent>

        {/* Media Sources Tab */}
        <TabsContent value="media" className="space-y-6">
          <MediaSourceAnalysis
            dateRange={dateRange}
            comparisonMode={comparisonMode}
            comparisonDateRange={comparisonDateRange}
            selectedCampaign={selectedCampaign}
          />
        </TabsContent>

        {/* Quality Metrics Tab */}
        <TabsContent value="quality" className="space-y-6">
          <QualityScoreDistribution
            dateRange={dateRange}
            comparisonMode={comparisonMode}
            comparisonDateRange={comparisonDateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
