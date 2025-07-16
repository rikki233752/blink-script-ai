"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mic,
  Brain,
  Target,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  BarChart3,
  Activity,
  Zap,
  Star,
  Filter,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface VocalyticsDashboardProps {
  reports?: any[]
}

export function EnhancedVocalyticsDashboard({ reports = [] }: VocalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")
  const [selectedAgent, setSelectedAgent] = useState("all")
  const [selectedMetric, setSelectedMetric] = useState("overall")

  // Mock data for demonstration
  const mockTrendData = [
    { date: "Mon", score: 75, clarity: 80, confidence: 72, energy: 78 },
    { date: "Tue", score: 78, clarity: 82, confidence: 76, energy: 80 },
    { date: "Wed", score: 82, clarity: 85, confidence: 80, energy: 84 },
    { date: "Thu", score: 79, clarity: 83, confidence: 78, energy: 81 },
    { date: "Fri", score: 85, clarity: 88, confidence: 84, energy: 87 },
    { date: "Sat", score: 88, clarity: 90, confidence: 87, energy: 89 },
    { date: "Sun", score: 86, clarity: 89, confidence: 85, energy: 88 },
  ]

  const performanceMetrics = [
    {
      title: "Voice Clarity",
      current: 87,
      previous: 82,
      trend: "up",
      benchmark: 85,
      color: "blue",
    },
    {
      title: "Speaking Confidence",
      current: 84,
      previous: 86,
      trend: "down",
      benchmark: 80,
      color: "green",
    },
    {
      title: "Energy Level",
      current: 89,
      previous: 89,
      trend: "stable",
      benchmark: 75,
      color: "purple",
    },
    {
      title: "Pace Consistency",
      current: 76,
      previous: 74,
      trend: "up",
      benchmark: 78,
      color: "orange",
    },
  ]

  const coachingInsights = [
    {
      category: "Strengths",
      items: [
        "Excellent articulation and pronunciation",
        "Consistent speaking pace throughout calls",
        "Strong emotional control and stability",
        "Professional tone and demeanor",
      ],
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      category: "Areas for Improvement",
      items: [
        "Reduce filler words during customer responses",
        "Improve volume consistency across different call types",
        "Work on breathing control during long explanations",
        "Enhance enthusiasm in product presentations",
      ],
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      category: "Recommended Training",
      items: [
        "Advanced Vocal Projection Workshop",
        "Confidence Building Masterclass",
        "Professional Communication Certification",
        "Breath Control and Pacing Training",
      ],
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getMetricColor = (value: number, benchmark: number) => {
    if (value >= benchmark + 5) return "text-green-600"
    if (value >= benchmark) return "text-blue-600"
    if (value >= benchmark - 5) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Vocalytics AI</h1>
                <p className="text-gray-600">Advanced Voice & Speech Pattern Analysis</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Brain className="h-3 w-3 mr-1" />
                    AI-Powered Analysis
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Target className="h-3 w-3 mr-1" />
                    Industry Benchmarked
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Award className="h-3 w-3 mr-1" />
                    Professional Grade
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-48 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="top-performers">Top Performers</SelectItem>
                  <SelectItem value="needs-coaching">Needs Coaching</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="bg-white border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {performanceMetrics.map((metric, index) => (
            <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                  {getTrendIcon(metric.trend)}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold ${getMetricColor(metric.current, metric.benchmark)}`}>
                        {metric.current}
                      </span>
                      <span className="text-sm text-gray-500">/ 100</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {metric.trend === "up" ? "+" : metric.trend === "down" ? "-" : ""}
                        {Math.abs(metric.current - metric.previous)}
                      </span>
                      <span className="text-xs text-gray-400">vs last period</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Performance</span>
                      <span>{metric.current}%</span>
                    </div>
                    <Progress value={metric.current} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Benchmark: {metric.benchmark}%</span>
                      <span className={metric.current >= metric.benchmark ? "text-green-600" : "text-orange-600"}>
                        {metric.current >= metric.benchmark ? "Above" : "Below"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm p-1">
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Analytics
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trend Analysis
            </TabsTrigger>
            <TabsTrigger value="coaching" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              AI Coaching
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Target className="h-4 w-4 mr-2" />
              Benchmarks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Real-time Voice Analysis */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Real-time Voice Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      score: { label: "Overall Score", color: "hsl(var(--chart-1))" },
                      clarity: { label: "Clarity", color: "hsl(var(--chart-2))" },
                      confidence: { label: "Confidence", color: "hsl(var(--chart-3))" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--color-score)"
                          strokeWidth={2}
                          name="Overall Score"
                        />
                        <Line
                          type="monotone"
                          dataKey="clarity"
                          stroke="var(--color-clarity)"
                          strokeWidth={2}
                          name="Clarity"
                        />
                        <Line
                          type="monotone"
                          dataKey="confidence"
                          stroke="var(--color-confidence)"
                          strokeWidth={2}
                          name="Confidence"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Quick Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Top Performance</span>
                    </div>
                    <p className="text-sm text-green-800">Voice clarity improved by 12% this week</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Goal Achievement</span>
                    </div>
                    <p className="text-sm text-blue-800">87% of quality targets met this period</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Focus Area</span>
                    </div>
                    <p className="text-sm text-orange-800">Reduce filler words by 15% for optimal performance</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Performance Trends Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    score: { label: "Score", color: "hsl(var(--chart-1))" },
                    energy: { label: "Energy", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" fill="var(--color-score)" name="Overall Score" />
                      <Bar dataKey="energy" fill="var(--color-energy)" name="Energy Level" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coaching" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {coachingInsights.map((insight, index) => (
                <Card key={index} className={`${insight.bgColor} border-0`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${insight.color}`}>
                      <insight.icon className="h-5 w-5" />
                      {insight.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insight.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Industry Benchmarks & Comparisons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Industry Average</h3>
                    <p className="text-2xl font-bold text-blue-600">76</p>
                    <p className="text-sm text-gray-500">Overall Score</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Star className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Top 10%</h3>
                    <p className="text-2xl font-bold text-green-600">92</p>
                    <p className="text-sm text-gray-500">Elite Performers</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Your Score</h3>
                    <p className="text-2xl font-bold text-purple-600">84</p>
                    <p className="text-sm text-gray-500">Current Performance</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Target Goal</h3>
                    <p className="text-2xl font-bold text-orange-600">88</p>
                    <p className="text-sm text-gray-500">Next Milestone</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
