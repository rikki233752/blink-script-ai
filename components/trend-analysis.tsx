"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3, LineChart, Activity, RefreshCw } from "lucide-react"
import { format, subDays, parseISO, isAfter } from "date-fns"

interface CallData {
  id: string
  fileName: string
  date: string
  duration: number
  analysis: {
    overallScore: number
    overallRating: string
    sentimentAnalysis: {
      agentSentiment: { overall: string; confidence: number }
      customerSentiment: { overall: string; confidence: number }
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
    }
    intentAnalysis?: {
      primaryIntent: string
    }
  }
}

interface TrendData {
  date: string
  value: number
  label: string
  category?: string
}

interface TrendChartProps {
  data: TrendData[]
  type?: "line" | "bar" | "area"
  height?: number
  color?: string
}

const TrendChart = ({ data, type = "line", height = 100, color = "#3b82f6" }: TrendChartProps) => {
  if (!data.length) return null

  // Filter out any invalid data points
  const validData = data.filter((d) => d.value !== null && d.value !== undefined && !isNaN(d.value))

  if (validData.length === 0) return null

  const values = validData.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min

  // Handle case where all values are the same (range = 0)
  const safeRange = range === 0 ? 1 : range
  const safeMin = range === 0 ? min - 0.5 : min
  const safeMax = range === 0 ? max + 0.5 : max * 1.1

  // Generate points for the SVG path with safe calculations
  const points = validData.map((d, i) => {
    const x = validData.length === 1 ? 50 : (i / (validData.length - 1)) * 100
    const normalizedValue = (d.value - safeMin) / (safeMax - safeMin)
    const y = 100 - normalizedValue * 80 // Use 80% of height for better padding

    // Ensure values are within bounds and not NaN
    const safeX = Math.max(0, Math.min(100, isNaN(x) ? 0 : x))
    const safeY = Math.max(10, Math.min(90, isNaN(y) ? 50 : y))

    return `${safeX},${safeY}`
  })

  // Create SVG path for line chart
  const linePath = validData.length > 1 ? `M ${points.join(" L ")}` : ""

  // Create SVG path for area chart (line + bottom)
  const areaPath = validData.length > 1 ? `${linePath} L 100,90 L 0,90 Z` : ""

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {type === "bar" ? (
          // Bar chart
          validData.map((d, i) => {
            const barWidth = Math.max(2, 80 / validData.length)
            const x = validData.length === 1 ? 50 - barWidth / 2 : (i / (validData.length - 1)) * (100 - barWidth)
            const normalizedValue = (d.value - safeMin) / (safeMax - safeMin)
            const barHeight = normalizedValue * 80
            const y = 90 - barHeight

            // Ensure safe values
            const safeX = Math.max(0, Math.min(100 - barWidth, isNaN(x) ? 0 : x))
            const safeY = Math.max(10, Math.min(90, isNaN(y) ? 50 : y))
            const safeHeight = Math.max(1, Math.min(80, isNaN(barHeight) ? 10 : barHeight))

            return (
              <rect
                key={i}
                x={safeX}
                y={safeY}
                width={barWidth}
                height={safeHeight}
                fill={color}
                opacity={0.8}
                rx={1}
                ry={1}
              />
            )
          })
        ) : type === "area" && validData.length > 1 ? (
          // Area chart
          <path d={areaPath} fill={color} opacity={0.2} />
        ) : null}

        {/* Line for both line and area charts */}
        {type !== "bar" && validData.length > 1 && <path d={linePath} fill="none" stroke={color} strokeWidth="2" />}

        {/* Data points */}
        {validData.map((d, i) => {
          const x = validData.length === 1 ? 50 : (i / (validData.length - 1)) * 100
          const normalizedValue = (d.value - safeMin) / (safeMax - safeMin)
          const y = 100 - normalizedValue * 80

          // Ensure safe values for circle positioning
          const safeX = Math.max(0, Math.min(100, isNaN(x) ? 50 : x))
          const safeY = Math.max(10, Math.min(90, isNaN(y) ? 50 : y))

          return <circle key={i} cx={safeX} cy={safeY} r="2" fill={color} />
        })}

        {/* Show single point for single data item */}
        {validData.length === 1 && <circle cx="50" cy="50" r="4" fill={color} />}
      </svg>
    </div>
  )
}

export function TrendAnalysis() {
  const [activeTab, setActiveTab] = useState("performance")
  const [timeRange, setTimeRange] = useState("30")
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line")
  const [callData, setCallData] = useState<CallData[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load call data from localStorage
  useEffect(() => {
    loadCallData()
  }, [])

  // Generate trend data when call data or filters change
  useEffect(() => {
    if (callData.length > 0) {
      generateTrendData()
    }
  }, [callData, activeTab, timeRange])

  const loadCallData = () => {
    try {
      const storedCalls = localStorage.getItem("uploadedCalls")
      if (storedCalls) {
        const calls = JSON.parse(storedCalls)
        setCallData(calls)
      }
    } catch (error) {
      console.error("Error loading call data:", error)
    }
  }

  const generateTrendData = () => {
    setIsLoading(true)

    try {
      // Filter calls by time range
      const days = Number.parseInt(timeRange)
      const cutoffDate = subDays(new Date(), days)
      const filteredCalls = callData.filter((call) => {
        try {
          return call.date && isAfter(parseISO(call.date), cutoffDate)
        } catch {
          return false
        }
      })

      if (filteredCalls.length === 0) {
        setTrendData([])
        setIsLoading(false)
        return
      }

      // Group calls by date
      const callsByDate = filteredCalls.reduce(
        (acc, call) => {
          try {
            const dateKey = format(parseISO(call.date), "yyyy-MM-dd")
            if (!acc[dateKey]) {
              acc[dateKey] = []
            }
            acc[dateKey].push(call)
          } catch {
            // Skip invalid dates
          }
          return acc
        },
        {} as Record<string, CallData[]>,
      )

      // Generate trend data based on active tab
      const trends: TrendData[] = []

      Object.entries(callsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, calls]) => {
          let value = 0

          try {
            switch (activeTab) {
              case "performance":
                const validScores = calls
                  .map((call) => call.analysis?.overallScore)
                  .filter((score) => score !== null && score !== undefined && !isNaN(score))
                value =
                  validScores.length > 0 ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length : 0
                break
              case "sentiment":
                const positiveSentiment = calls.filter(
                  (call) => call.analysis?.sentimentAnalysis?.agentSentiment?.overall === "Positive",
                ).length
                value = calls.length > 0 ? (positiveSentiment / calls.length) * 100 : 0
                break
              case "volume":
                value = calls.length
                break
              case "conversion":
                const conversions = calls.filter((call) => call.analysis?.businessConversion?.conversionAchieved).length
                value = calls.length > 0 ? (conversions / calls.length) * 100 : 0
                break
            }

            // Ensure value is valid
            if (isNaN(value) || value === null || value === undefined) {
              value = 0
            }

            trends.push({
              date,
              value: Math.round(value * 100) / 100,
              label: format(parseISO(date), "MMM dd"),
              category: activeTab,
            })
          } catch (error) {
            console.error("Error processing date:", date, error)
          }
        })

      setTrendData(trends)
    } catch (error) {
      console.error("Error generating trend data:", error)
      setTrendData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate trend percentage (comparing first half to second half)
  const calculateTrend = (data: TrendData[]) => {
    if (data.length < 2) return { value: 0, direction: "neutral" }

    const midpoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, midpoint)
    const secondHalf = data.slice(midpoint)

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100

    return {
      value: Math.abs(Math.round(percentChange)),
      direction: percentChange >= 0 ? "up" : "down",
    }
  }

  const trend = calculateTrend(trendData)

  // Get chart color based on active tab
  const getChartColor = () => {
    switch (activeTab) {
      case "performance":
        return "#3b82f6" // blue
      case "sentiment":
        return "#ef4444" // red
      case "volume":
        return "#10b981" // green
      case "conversion":
        return "#8b5cf6" // purple
      default:
        return "#3b82f6" // blue
    }
  }

  // Get trend insights based on data
  const getTrendInsights = () => {
    if (trendData.length === 0) {
      return ["No data available for trend analysis.", "Upload and analyze calls to see trends."]
    }

    const insights = []
    const trendDirection = trend.direction
    const trendValue = trend.value
    const latestValue = trendData[trendData.length - 1]?.value || 0
    const avgValue = trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length

    switch (activeTab) {
      case "performance":
        insights.push(`Average performance score is ${Math.round(avgValue * 10) / 10}/10`)
        if (trendDirection === "up") {
          insights.push(`Performance has improved by ${trendValue}% over the selected period`)
        } else if (trendDirection === "down") {
          insights.push(`Performance has declined by ${trendValue}% - consider additional training`)
        }
        if (latestValue >= 8) {
          insights.push("Recent performance is excellent - maintain current practices")
        } else if (latestValue < 6) {
          insights.push("Recent performance needs improvement - review coaching materials")
        }
        break

      case "sentiment":
        insights.push(`${Math.round(avgValue)}% of calls have positive agent sentiment`)
        if (trendDirection === "up") {
          insights.push(`Agent sentiment has improved by ${trendValue}% - great progress!`)
        } else if (trendDirection === "down") {
          insights.push(`Agent sentiment has declined by ${trendValue}% - consider wellness check`)
        }
        if (avgValue >= 70) {
          insights.push("Overall sentiment is positive - team morale is good")
        } else {
          insights.push("Sentiment could be improved - consider team building activities")
        }
        break

      case "volume":
        insights.push(`Average of ${Math.round(avgValue)} calls per day`)
        if (trendDirection === "up") {
          insights.push(`Call volume has increased by ${trendValue}% - ensure adequate staffing`)
        } else if (trendDirection === "down") {
          insights.push(`Call volume has decreased by ${trendValue}% - monitor for trends`)
        }
        break

      case "conversion":
        insights.push(`Average conversion rate is ${Math.round(avgValue)}%`)
        if (trendDirection === "up") {
          insights.push(`Conversion rate has improved by ${trendValue}% - excellent work!`)
        } else if (trendDirection === "down") {
          insights.push(`Conversion rate has declined by ${trendValue}% - review sales techniques`)
        }
        if (avgValue >= 50) {
          insights.push("Conversion rate is strong - maintain current strategies")
        } else {
          insights.push("Conversion rate has room for improvement - consider additional training")
        }
        break
    }

    return insights
  }

  const insights = getTrendInsights()

  // Show empty state when no call data exists
  if (callData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trend Analysis</h2>
            <p className="text-gray-600">Analyze performance trends and patterns over time</p>
          </div>
          <Button onClick={loadCallData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Call Data Available</h3>
            <p className="text-gray-600 mb-6">Upload and analyze calls to generate trend analysis and insights.</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()}>Upload Calls</Button>
              <Button variant="outline" onClick={loadCallData}>
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trend Analysis</h2>
          <p className="text-gray-600">Analyze performance trends and patterns over time</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={chartType === "line" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setChartType("line")}
            >
              <LineChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "bar" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "area" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setChartType("area")}
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={loadCallData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{callData.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    (callData.reduce((sum, call) => sum + call.analysis.overallScore, 0) / callData.length) * 10,
                  ) / 10}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    (callData.filter((call) => call.analysis.businessConversion.conversionAchieved).length /
                      callData.length) *
                      100,
                  )}
                  %
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Points</p>
                <p className="text-2xl font-bold">{trendData.length}</p>
              </div>
              <LineChart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full flex flex-wrap gap-1 p-1 overflow-x-auto">
          <TabsTrigger value="performance" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Performance Score
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
            <TrendingUp className="h-4 w-4 text-red-600" />
            Sentiment Analysis
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Call Volume
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Conversion Rate
          </TabsTrigger>
        </TabsList>

        {/* Trend Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {activeTab === "performance"
                  ? "Performance Score Trend"
                  : activeTab === "sentiment"
                    ? "Sentiment Analysis Trend"
                    : activeTab === "volume"
                      ? "Call Volume Trend"
                      : "Conversion Rate Trend"}
              </span>
              {trendData.length > 0 && (
                <Badge
                  variant={trend.direction === "up" ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {trend.direction === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {trend.value}% {trend.direction === "up" ? "increase" : "decrease"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Generating trend analysis...</span>
              </div>
            ) : trendData.length > 0 ? (
              <>
                {/* Chart */}
                <div className="h-64 w-full">
                  <TrendChart data={trendData} type={chartType} height={250} color={getChartColor()} />
                </div>

                {/* Insights */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trend Insights
                  </h4>
                  <ul className="space-y-2">
                    {insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-2xl font-bold">
                      {Math.round((trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length) * 10) / 10}
                      {activeTab === "sentiment" || activeTab === "conversion" ? "%" : ""}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Highest</p>
                    <p className="text-2xl font-bold">
                      {Math.max(...trendData.map((d) => d.value))}
                      {activeTab === "sentiment" || activeTab === "conversion" ? "%" : ""}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Lowest</p>
                    <p className="text-2xl font-bold">
                      {Math.min(...trendData.map((d) => d.value))}
                      {activeTab === "sentiment" || activeTab === "conversion" ? "%" : ""}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Trend</p>
                    <p className="text-2xl font-bold flex items-center">
                      {trend.direction === "up" ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600 mr-1" />
                      )}
                      {trend.value}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trend Data</h3>
                  <p className="text-gray-600 mb-4">
                    No calls found in the selected time range. Try adjusting the time period or upload more calls.
                  </p>
                  <Button onClick={generateTrendData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
