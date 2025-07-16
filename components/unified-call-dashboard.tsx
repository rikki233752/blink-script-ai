"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Phone,
  Upload,
  Activity,
  BarChart3,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mic,
  Brain,
  Zap,
  Play,
  Eye,
} from "lucide-react"

interface UnifiedCall {
  id: string
  source: "manual" | "ringba" | "twilio"
  fileName: string
  date: string
  duration: number
  status: "pending" | "processing" | "completed" | "failed"
  analysis?: any
  transcript?: string
  provider?: string
  automated: boolean
  integrationSource?: string
  ringbaData?: any
  recordingUrl?: string
  error?: string
}

export function UnifiedCallDashboard() {
  const [calls, setCalls] = useState<UnifiedCall[]>([])
  const [filteredCalls, setFilteredCalls] = useState<UnifiedCall[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "ringba" | "twilio">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "failed">("all")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")

  useEffect(() => {
    loadAllCalls()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [calls, searchTerm, sourceFilter, statusFilter, dateFilter])

  const loadAllCalls = () => {
    try {
      const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")

      const unifiedCalls: UnifiedCall[] = uploadedCalls.map((call: any) => ({
        id: call.id,
        source:
          call.integrationSource === "RingBA" ? "ringba" : call.integrationSource === "Twilio" ? "twilio" : "manual",
        fileName: call.fileName,
        date: call.date,
        duration: call.duration || 0,
        status: call.analysis ? "completed" : call.error ? "failed" : "pending",
        analysis: call.analysis,
        transcript: call.transcript,
        provider: call.provider,
        automated: call.automated || false,
        integrationSource: call.integrationSource,
        ringbaData: call.ringbaData,
        recordingUrl: call.recordingUrl,
        error: call.error,
      }))

      setCalls(unifiedCalls)
    } catch (error) {
      console.error("Error loading calls:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...calls]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (call) =>
          call.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (call.ringbaData?.callerNumber && call.ringbaData.callerNumber.includes(searchTerm)),
      )
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((call) => call.source === sourceFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((call) => call.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((call) => new Date(call.date) >= filterDate)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredCalls(filtered)
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "ringba":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Phone className="h-3 w-3 mr-1" />
            RingBA
          </Badge>
        )
      case "twilio":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Phone className="h-3 w-3 mr-1" />
            Twilio
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Upload className="h-3 w-3 mr-1" />
            Manual
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Activity className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const getProviderBadge = (provider?: string) => {
    if (!provider) return null

    switch (provider) {
      case "deepgram":
      case "deepgram-enhanced":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Mic className="h-3 w-3 mr-1" />
            Deepgram AI
          </Badge>
        )
      case "demo":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Brain className="h-3 w-3 mr-1" />
            Demo Mode
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const calculateStats = () => {
    const total = calls.length
    const manual = calls.filter((c) => c.source === "manual").length
    const ringba = calls.filter((c) => c.source === "ringba").length
    const completed = calls.filter((c) => c.status === "completed").length
    const pending = calls.filter((c) => c.status === "pending").length
    const failed = calls.filter((c) => c.status === "failed").length

    const avgScore =
      completed > 0
        ? calls.filter((c) => c.analysis?.overallScore).reduce((sum, c) => sum + c.analysis.overallScore, 0) / completed
        : 0

    const conversionRate =
      completed > 0
        ? (calls.filter((c) => c.analysis?.businessConversion?.conversionAchieved).length / completed) * 100
        : 0

    return {
      total,
      manual,
      ringba,
      completed,
      pending,
      failed,
      avgScore: Math.round(avgScore * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
    }
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Unified Call Dashboard
          </h2>
          <p className="text-gray-600">All calls from manual uploads and integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Activity className="h-4 w-4 mr-1" />
            Live Updates
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Zap className="h-4 w-4 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Calls</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.manual}</p>
              <p className="text-sm text-gray-600">Manual</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.ringba}</p>
              <p className="text-sm text-gray-600">RingBA</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.avgScore}/10</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-600">Conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <select
                id="source"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Sources</option>
                <option value="manual">Manual Upload</option>
                <option value="ringba">RingBA</option>
                <option value="twilio">Twilio</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <Label htmlFor="date">Date Range</Label>
              <select
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSourceFilter("all")
                  setStatusFilter("all")
                  setDateFilter("all")
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calls List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              All Calls ({filteredCalls.length})
            </span>
            <Button onClick={loadAllCalls} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Calls Found</h3>
              <p className="text-gray-600 mb-4">
                {calls.length === 0
                  ? "No calls have been uploaded or synced yet."
                  : "No calls match your current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => (
                <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          {getSourceBadge(call.source)}
                          {getStatusBadge(call.status)}
                          {getProviderBadge(call.provider)}
                        </div>
                        <div className="text-sm text-gray-600">{call.fileName}</div>
                        <div className="text-sm text-gray-600">Duration: {formatDuration(call.duration)}</div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(call.date)}
                        </span>
                        {call.automated && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            Automated
                          </span>
                        )}
                        {call.ringbaData && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {call.ringbaData.callerNumber} → {call.ringbaData.calledNumber}
                          </span>
                        )}
                      </div>

                      {call.analysis && (
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <Badge className="bg-green-100 text-green-800">Score: {call.analysis.overallScore}/10</Badge>
                          <Badge className="bg-blue-100 text-blue-800">{call.analysis.overallRating}</Badge>
                          {call.analysis.businessConversion?.conversionAchieved && (
                            <Badge className="bg-purple-100 text-purple-800">
                              ✅ Conversion: {call.analysis.businessConversion.conversionType}
                            </Badge>
                          )}
                        </div>
                      )}

                      {call.error && (
                        <div className="mt-2">
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Error: {call.error}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {call.recordingUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </a>
                        </Button>
                      )}

                      {call.analysis && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Navigate to analysis view
                            const event = new CustomEvent("viewCallAnalysis", {
                              detail: {
                                callId: call.id,
                                analysis: call.analysis,
                                transcript: call.transcript,
                                source: call.source,
                              },
                            })
                            window.dispatchEvent(event)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Analysis
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
