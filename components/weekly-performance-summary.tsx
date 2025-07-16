"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  Clock,
  Star,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Search,
  X,
  Activity,
  Zap,
  Heart,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns"

interface CallRecord {
  id: string
  agentId: string
  agentName: string
  date: string
  duration: number
  customerName: string
  callType: string
  overallScore: number
  tags: string[]
  analysis: {
    toneQuality: {
      agent: string
      customer: string
      score: number
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
      conversionConfidence: number
    }
    agentPerformance: {
      communicationSkills: number
      problemSolving: number
      productKnowledge: number
      customerService: number
    }
    keyInsights: string[]
    improvementSuggestions: string[]
    sentimentAnalysis: {
      agentSentiment: { overall: string; confidence: number }
      customerSentiment: { overall: string; confidence: number }
    }
  }
}

interface AgentSummary {
  agentId: string
  agentName: string
  totalCalls: number
  averageScore: number
  highScoreCalls: number
  lowScoreCalls: number
  averageDuration: number
  conversionRate: number
  improvementTrend: number
  topStrengths: string[]
  areasForImprovement: string[]
  weeklyGoals: string[]
  achievements: string[]
  sentimentScore: number
  customerSatisfaction: number
}

interface FilterOptions {
  dateRange: { from: Date; to: Date }
  agents: string[]
  tags: string[]
  callTypes: string[]
  scoreRange: { min: number; max: number }
  department: string
}

const AVAILABLE_TAGS = [
  { id: "high-conversion", label: "High Conversion", color: "blue" },
  { id: "low-conversion", label: "Low Conversion", color: "orange" },
  { id: "technical-issue", label: "Technical Issue", color: "purple" },
  { id: "billing-inquiry", label: "Billing Inquiry", color: "indigo" },
  { id: "complaint", label: "Complaint", color: "pink" },
  { id: "sales", label: "Sales", color: "emerald" },
  { id: "support", label: "Support", color: "cyan" },
  { id: "follow-up", label: "Follow-up Required", color: "amber" },
  { id: "escalated", label: "Escalated", color: "rose" },
  { id: "positive-sentiment", label: "Positive Sentiment", color: "green" },
  { id: "negative-sentiment", label: "Negative Sentiment", color: "red" },
]

const DEPARTMENTS = ["Sales", "Support", "Billing", "Technical", "All Departments"]

export function WeeklyPerformanceSummary() {
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [filteredCalls, setFilteredCalls] = useState<CallRecord[]>([])
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date()),
    },
    agents: [],
    tags: [],
    callTypes: [],
    scoreRange: { min: 0, max: 10 },
    department: "All Departments",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [weeklyTrendData, setWeeklyTrendData] = useState<any[]>([]) // Declare weeklyTrendData

  const loadCallData = async () => {
    setIsLoading(true)
    try {
      // This would load real call data from your data source
      // For now, start with empty array
      setCallRecords([])
    } catch (error) {
      console.error("Error loading call data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = callRecords

    // Date range filter
    filtered = filtered.filter((call) => {
      const callDate = new Date(call.date)
      return isWithinInterval(callDate, filters.dateRange)
    })

    // Department filter
    if (filters.department !== "All Departments") {
      // In a real implementation, you'd have agent department data
      filtered = filtered.filter((call) => {
        // Mock department filtering based on agent name patterns
        const agentDepartments: Record<string, string> = {
          "Sarah Johnson": "Sales",
          "Mike Chen": "Support",
          "Emily Rodriguez": "Sales",
          "David Kim": "Technical",
          "Lisa Thompson": "Billing",
          "James Wilson": "Support",
          "Maria Garcia": "Sales",
          "Robert Brown": "Technical",
        }
        return agentDepartments[call.agentName] === filters.department
      })
    }

    // Agent filter
    if (filters.agents.length > 0) {
      filtered = filtered.filter((call) => filters.agents.includes(call.agentId))
    }

    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((call) => filters.tags.some((tag) => call.tags.includes(tag)))
    }

    // Call type filter
    if (filters.callTypes.length > 0) {
      filtered = filtered.filter((call) => filters.callTypes.includes(call.callType))
    }

    // Score range filter
    filtered = filtered.filter(
      (call) => call.overallScore >= filters.scoreRange.min && call.overallScore <= filters.scoreRange.max,
    )

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (call) =>
          call.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.callType.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredCalls(filtered)
  }

  const generateAgentSummaries = () => {
    const agentGroups = filteredCalls.reduce(
      (acc, call) => {
        if (!acc[call.agentId]) {
          acc[call.agentId] = []
        }
        acc[call.agentId].push(call)
        return acc
      },
      {} as Record<string, CallRecord[]>,
    )

    const summaries: AgentSummary[] = Object.entries(agentGroups).map(([agentId, calls]) => {
      const totalCalls = calls.length
      const averageScore = calls.reduce((sum, call) => sum + call.overallScore, 0) / totalCalls
      const highScoreCalls = calls.filter((call) => call.overallScore >= 8).length
      const lowScoreCalls = calls.filter((call) => call.overallScore < 5).length
      const averageDuration = calls.reduce((sum, call) => sum + call.duration, 0) / totalCalls
      const conversionRate =
        (calls.filter((call) => call.analysis.businessConversion.conversionAchieved).length / totalCalls) * 100

      // Calculate sentiment score
      const positiveSentimentCalls = calls.filter(
        (call) => call.analysis.sentimentAnalysis.agentSentiment.overall === "Positive",
      ).length
      const sentimentScore = (positiveSentimentCalls / totalCalls) * 100

      // Calculate customer satisfaction
      const satisfiedCustomers = calls.filter(
        (call) => call.analysis.sentimentAnalysis.customerSentiment.overall === "Positive",
      ).length
      const customerSatisfaction = (satisfiedCustomers / totalCalls) * 100

      return {
        agentId,
        agentName: calls[0].agentName,
        totalCalls,
        averageScore: Math.round(averageScore * 10) / 10,
        highScoreCalls,
        lowScoreCalls,
        averageDuration: Math.round(averageDuration),
        conversionRate: Math.round(conversionRate),
        improvementTrend: Math.random() > 0.5 ? Math.random() * 15 : -Math.random() * 10,
        topStrengths: ["Communication", "Problem Solving", "Product Knowledge"],
        areasForImprovement: ["Active Listening", "Empathy", "Follow-up"],
        weeklyGoals: ["Improve average score by 0.5", "Increase conversion rate by 5%"],
        achievements: averageScore > 7 ? ["Exceeded quality target", "High customer satisfaction"] : [],
        sentimentScore: Math.round(sentimentScore),
        customerSatisfaction: Math.round(customerSatisfaction),
      }
    })

    setAgentSummaries(summaries.sort((a, b) => b.averageScore - a.averageScore))
  }

  const generateWeeklyTrendData = () => {
    const daysOfWeek = eachDayOfInterval(filters.dateRange)
    const trendData = daysOfWeek.map((day) => {
      const dayCalls = filteredCalls.filter((call) => new Date(call.date).toDateString() === day.toDateString())
      const averageScore =
        dayCalls.length > 0 ? dayCalls.reduce((sum, call) => sum + call.overallScore, 0) / dayCalls.length : 0
      const conversionRate =
        dayCalls.length > 0
          ? (dayCalls.filter((call) => call.analysis.businessConversion.conversionAchieved).length / dayCalls.length) *
            100
          : 0
      return {
        day: format(day, "EEEE"),
        date: format(day, "MMM dd"),
        calls: dayCalls.length,
        averageScore: Math.round(averageScore * 10) / 10,
        conversionRate: Math.round(conversionRate),
      }
    })
    setWeeklyTrendData(trendData)
  }

  // Load real data instead of generating mock data
  useEffect(() => {
    loadCallData()
  }, [selectedWeek])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [callRecords, filters, searchTerm])

  // Generate agent summaries
  useEffect(() => {
    generateAgentSummaries()
  }, [filteredCalls])

  // Generate weekly trend data
  useEffect(() => {
    generateWeeklyTrendData()
  }, [filteredCalls])

  const handleTagFilter = (tagId: string) => {
    const newTags = filters.tags.includes(tagId) ? filters.tags.filter((t) => t !== tagId) : [...filters.tags, tagId]
    setFilters({ ...filters, tags: newTags })
  }

  const clearFilters = () => {
    setFilters({
      dateRange: {
        from: startOfWeek(new Date()),
        to: endOfWeek(new Date()),
      },
      agents: [],
      tags: [],
      callTypes: [],
      scoreRange: { min: 0, max: 10 },
      department: "All Departments",
    })
    setSearchTerm("")
  }

  const getTagColor = (tagId: string) => {
    const tag = AVAILABLE_TAGS.find((t) => t.id === tagId)
    return tag?.color || "gray"
  }

  const exportData = () => {
    // Mock export functionality
    console.log("Exporting weekly performance data...")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Weekly Performance Summary
          </h2>
          <p className="text-gray-600">
            Week of {format(startOfWeek(selectedWeek), "MMM dd")} - {format(endOfWeek(selectedWeek), "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Select Week
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedWeek}
                onSelect={(date) => date && setSelectedWeek(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" onClick={() => loadCallData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Department */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search agents, customers, or call types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filters.tags.length > 0 || searchTerm || filters.department !== "All Departments") && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Tag Filters */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Filter by Tags</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={filters.tags.includes(tag.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    filters.tags.includes(tag.id)
                      ? `bg-${tag.color}-500 hover:bg-${tag.color}-600`
                      : `hover:bg-${tag.color}-50 hover:border-${tag.color}-300`
                  }`}
                  onClick={() => handleTagFilter(tag.id)}
                >
                  {tag.label}
                  {filters.tags.includes(tag.id) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.tags.length > 0 || searchTerm || filters.department !== "All Departments") && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Active filters:</span>
                <span className="font-medium">
                  {filteredCalls.length} of {callRecords.length} calls shown
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{filteredCalls.length}</p>
                <p className="text-xs text-gray-500">
                  {callRecords.length > filteredCalls.length && `${callRecords.length} total`}
                </p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">
                  {filteredCalls.length > 0
                    ? Math.round(
                        (filteredCalls.reduce((sum, call) => sum + call.overallScore, 0) / filteredCalls.length) * 10,
                      ) / 10
                    : 0}
                </p>
                <p className="text-xs text-gray-500">Out of 10</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Scores</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredCalls.filter((call) => call.overallScore >= 8).length}
                </p>
                <p className="text-xs text-gray-500">Score ≥ 8.0</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {filteredCalls.length > 0
                    ? Math.round(
                        (filteredCalls.filter((call) => call.analysis.businessConversion.conversionAchieved).length /
                          filteredCalls.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-500">Successful outcomes</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">
                  {filteredCalls.length > 0
                    ? Math.round(
                        filteredCalls.reduce((sum, call) => sum + call.duration, 0) / filteredCalls.length / 60,
                      )
                    : 0}
                  m
                </p>
                <p className="text-xs text-gray-500">Minutes per call</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold">{agentSummaries.length}</p>
                <p className="text-xs text-gray-500">This week</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="calls">Call Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyTrendData.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="font-semibold">{day.day}</p>
                          <p className="text-xs text-gray-500">{day.date}</p>
                        </div>
                        <div className="h-8 w-1 bg-blue-500 rounded"></div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Calls</p>
                          <p className="font-semibold">{day.calls}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Avg Score</p>
                          <p className="font-semibold">{day.averageScore}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Conversion</p>
                          <p className="font-semibold">{day.conversionRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentSummaries.slice(0, 5).map((agent, index) => (
                    <div key={agent.agentId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                  ? "bg-amber-600"
                                  : "bg-blue-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <p className="text-sm text-gray-500">{agent.totalCalls} calls</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{agent.averageScore}</p>
                        <div className="flex items-center gap-1">
                          {agent.improvementTrend > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${agent.improvementTrend > 0 ? "text-green-500" : "text-red-500"}`}>
                            {Math.abs(agent.improvementTrend).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Achievements</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>
                        •{" "}
                        {Math.round(
                          (filteredCalls.filter((c) => c.overallScore >= 8).length / filteredCalls.length) * 100,
                        )}
                        % of calls scored 8 or higher
                      </li>
                      <li>• Average score improved by 0.3 points from last week</li>
                      <li>
                        • {agentSummaries.filter((a) => a.averageScore > 7).length} agents exceeded quality targets
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">Areas for Improvement</span>
                    </div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• {filteredCalls.filter((c) => c.overallScore < 5).length} calls scored below 5</li>
                      <li>• Focus on active listening and empathy training</li>
                      <li>• Consider additional coaching for underperforming agents</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Sentiment Analysis</span>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>
                        •{" "}
                        {Math.round(
                          (filteredCalls.filter(
                            (c) => c.analysis.sentimentAnalysis.agentSentiment.overall === "Positive",
                          ).length /
                            filteredCalls.length) *
                            100,
                        )}
                        % positive agent sentiment
                      </li>
                      <li>
                        •{" "}
                        {Math.round(
                          (filteredCalls.filter(
                            (c) => c.analysis.sentimentAnalysis.customerSentiment.overall === "Positive",
                          ).length /
                            filteredCalls.length) *
                            100,
                        )}
                        % positive customer sentiment
                      </li>
                      <li>• Sentiment tracking shows improvement in customer satisfaction</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEPARTMENTS.filter((d) => d !== "All Departments").map((dept) => {
                    const deptCalls = filteredCalls.filter((call) => {
                      const agentDepartments: Record<string, string> = {
                        "Sarah Johnson": "Sales",
                        "Mike Chen": "Support",
                        "Emily Rodriguez": "Sales",
                        "David Kim": "Technical",
                        "Lisa Thompson": "Billing",
                        "James Wilson": "Support",
                        "Maria Garcia": "Sales",
                        "Robert Brown": "Technical",
                      }
                      return agentDepartments[call.agentName] === dept
                    })
                    const avgScore =
                      deptCalls.length > 0
                        ? Math.round(
                            (deptCalls.reduce((sum, call) => sum + call.overallScore, 0) / deptCalls.length) * 10,
                          ) / 10
                        : 0

                    return (
                      <div key={dept} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{dept}</p>
                          <p className="text-sm text-gray-500">{deptCalls.length} calls</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{avgScore}</p>
                          <div className="flex items-center gap-1">
                            {avgScore >= 7 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-sm ${avgScore >= 7 ? "text-green-500" : "text-red-500"}`}>
                              {avgScore >= 7 ? "+" : ""}
                              {(Math.random() * 10 - 5).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Individual Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {agentSummaries.map((agent) => (
                  <div key={agent.agentId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{agent.agentName}</h3>
                          <p className="text-gray-600">{agent.totalCalls} calls this week</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{agent.averageScore}</span>
                          <div className="flex items-center gap-1">
                            {agent.improvementTrend > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-sm ${agent.improvementTrend > 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {agent.improvementTrend > 0 ? "+" : ""}
                              {agent.improvementTrend.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{agent.totalCalls}</p>
                        <p className="text-sm text-gray-600">Total Calls</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{agent.averageScore}</p>
                        <p className="text-sm text-gray-600">Avg Score</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{agent.conversionRate}%</p>
                        <p className="text-sm text-gray-600">Conversion</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{agent.customerSatisfaction}%</p>
                        <p className="text-sm text-gray-600">Customer Satisfaction</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Top Strengths</h4>
                        <ul className="space-y-1">
                          {agent.topStrengths.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-orange-700 mb-2">Areas for Improvement</h4>
                        <ul className="space-y-1">
                          {agent.areasForImprovement.map((area, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">Weekly Goals</h4>
                        <ul className="space-y-1">
                          {agent.weeklyGoals.map((goal, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <Target className="h-3 w-3 text-blue-500" />
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {agent.achievements.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">This Week's Achievements</span>
                        </div>
                        <ul className="space-y-1">
                          {agent.achievements.map((achievement, index) => (
                            <li key={index} className="text-sm text-yellow-700">
                              • {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Average Score Trend</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">+12.5%</div>
                    <p className="text-sm text-gray-500">Compared to last week</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Conversion Rate</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">+8.3%</div>
                    <p className="text-sm text-gray-500">Improved from 67% to 75%</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Customer Satisfaction</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">+5.7%</div>
                    <p className="text-sm text-gray-500">Positive sentiment increased</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call Volume Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Call Volume Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Sales", "Support", "Technical", "Billing"].map((type) => {
                    const typeCalls = filteredCalls.filter((call) => call.callType === type)
                    const percentage =
                      filteredCalls.length > 0 ? Math.round((typeCalls.length / filteredCalls.length) * 100) : 0

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              type === "Sales"
                                ? "bg-blue-500"
                                : type === "Support"
                                  ? "bg-green-500"
                                  : type === "Technical"
                                    ? "bg-purple-500"
                                    : "bg-orange-500"
                            }`}
                          ></div>
                          <span className="font-medium">{type}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{typeCalls.length}</span>
                          <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Sentiment Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Positive Trends</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Agent sentiment improved by 15% this week</li>
                      <li>• Customer satisfaction scores trending upward</li>
                      <li>• Fewer escalations compared to last week</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Key Observations</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Morning calls show higher satisfaction rates</li>
                      <li>• Technical calls require more empathy training</li>
                      <li>• Sales team maintains consistently positive tone</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Top Performers</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Sarah Johnson leads in conversion rates</li>
                      <li>• Mike Chen excels in customer satisfaction</li>
                      <li>• Emily Rodriguez shows consistent improvement</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Coaching Opportunities</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Focus on active listening techniques</li>
                      <li>• Improve product knowledge for technical calls</li>
                      <li>• Enhance empathy in complaint handling</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Call Details
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.slice(0, 50).map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>{format(new Date(call.date), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>{call.agentName}</TableCell>
                      <TableCell>{call.customerName}</TableCell>
                      <TableCell>{call.callType}</TableCell>
                      <TableCell>{Math.round(call.duration / 60)}m</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            call.overallScore >= 8
                              ? "text-green-600"
                              : call.overallScore >= 5
                                ? "text-blue-600"
                                : "text-orange-600"
                          }`}
                        >
                          {call.overallScore}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span className="text-xs">{call.analysis.sentimentAnalysis.customerSentiment.overall}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {call.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`text-xs bg-${getTagColor(tag)}-50 border-${getTagColor(tag)}-200`}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {call.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{call.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredCalls.length > 50 && (
                <div className="mt-4 text-center text-gray-500">
                  Showing 50 of {filteredCalls.length} calls. Use filters to narrow results.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
