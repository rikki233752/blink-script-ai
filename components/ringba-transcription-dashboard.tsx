"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target,
  Phone,
  FileText,
  PlayCircle,
  Clock,
  User,
  Download,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  BarChart3,
  MessageSquare,
  Mic,
  Headphones,
  Search,
} from "lucide-react"
import { format } from "date-fns"

interface CallLog {
  id: string
  campaignId: string
  campaignName: string
  callerId: string
  calledNumber: string
  startTime: string
  endTime: string | null
  duration: number
  status: string
  disposition: string
  direction: string
  recordingUrl: string | null
  hasRecording: boolean
  agentName: string
  revenue: number
  cost: number
  processed?: boolean
  reason?: string
  transcript?: string
  analysis?: any
  onScriptSummary?: any
  vocalytics?: any
}

// Helper function to format camelCase strings
function formatCamelCase(str: string): string {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
}

// Helper function to get sentiment color
function getSentimentColor(sentiment: string): string {
  switch (sentiment?.toLowerCase()) {
    case "positive":
      return "bg-green-100 text-green-800"
    case "negative":
      return "bg-red-100 text-red-800"
    default:
      return "bg-blue-100 text-blue-800"
  }
}

export function RingbaTranscriptionDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calls, setCalls] = useState<CallLog[]>([])
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [activeTab, setActiveTab] = useState("calls")
  const [detailTab, setDetailTab] = useState("transcript")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [campaignFilter, setCampaignFilter] = useState<string>("all")
  const [limit, setLimit] = useState<number>(10)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
  const [apiStatus, setApiStatus] = useState<{
    endpoint: string
    method: string
    totalCalls: number
    processedCalls: number
    failedCalls: number
  }>({
    endpoint: "",
    method: "",
    totalCalls: 0,
    processedCalls: 0,
    failedCalls: 0,
  })

  // Fetch calls when filters change
  const fetchCalls = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ringba/fetch-and-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          campaignId: campaignFilter === "all" ? undefined : campaignFilter,
          limit,
          offset: 0,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || "Failed to fetch call logs")
        // If mock data is available, use it
        if (result.mockData) {
          setCalls(result.mockData)
        }
        return
      }

      setCalls(result.calls || [])
      setApiStatus({
        endpoint: result.endpoint || "",
        method: result.method || "",
        totalCalls: result.totalCalls || 0,
        processedCalls: result.processedCalls || 0,
        failedCalls: result.failedCalls || 0,
      })

      // Extract unique campaigns for the filter
      const uniqueCampaigns = Array.from(
        new Set(result.calls.map((call: CallLog) => JSON.stringify({ id: call.campaignId, name: call.campaignName }))),
      ).map((str) => JSON.parse(str))

      setCampaigns(uniqueCampaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCalls()
  }, [])

  // Filter calls based on search query
  const filteredCalls = calls.filter((call) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      call.id.toLowerCase().includes(query) ||
      call.callerId.toLowerCase().includes(query) ||
      call.calledNumber.toLowerCase().includes(query) ||
      call.agentName.toLowerCase().includes(query) ||
      call.campaignName.toLowerCase().includes(query) ||
      call.disposition.toLowerCase().includes(query)
    )
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusBadge = (call: CallLog) => {
    if (!call.hasRecording) {
      return <Badge variant="outline">No Recording</Badge>
    }

    if (call.processed === undefined) {
      return <Badge className="bg-gray-500 text-white">Not Processed</Badge>
    }

    if (call.processed) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Analyzed
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
  }

  const handleSelectCall = (call: CallLog) => {
    setSelectedCall(call)
    setActiveTab("details")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Headphones className="h-8 w-8 text-blue-600" />
            Ringba Call Transcription & Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            Fetch, transcribe, and analyze call recordings from Ringba with OnScript AI
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Call Filters</CardTitle>
          <CardDescription>Filter calls by date range, campaign, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Campaign</label>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Limit</label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 calls</SelectItem>
                  <SelectItem value="10">10 calls</SelectItem>
                  <SelectItem value="25">25 calls</SelectItem>
                  <SelectItem value="50">50 calls</SelectItem>
                  <SelectItem value="100">100 calls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search calls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchCalls} className="w-full" disabled={isLoading}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Status */}
      {apiStatus.endpoint && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>API Status:</strong> Connected to {apiStatus.endpoint} using {apiStatus.method} • Found{" "}
            {apiStatus.totalCalls} calls • Processed {apiStatus.processedCalls} successfully • Failed{" "}
            {apiStatus.failedCalls} calls
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call Logs
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedCall}>
            <FileText className="h-4 w-4" />
            Call Details {selectedCall && `(${selectedCall.id})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Logs
              </CardTitle>
              <CardDescription>{filteredCalls.length} calls found • Click on a call to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredCalls.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Phone className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">No calls found</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Try adjusting your filters or fetching more calls from Ringba.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredCalls.map((call) => (
                    <Card
                      key={call.id}
                      className={`border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer ${
                        selectedCall?.id === call.id ? "border-blue-500 ring-1 ring-blue-500" : ""
                      }`}
                      onClick={() => handleSelectCall(call)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {call.callerId} → {call.calledNumber}
                              </h4>
                              <Badge variant={call.direction === "inbound" ? "default" : "secondary"}>
                                {call.direction}
                              </Badge>
                              {call.hasRecording && (
                                <Badge className="bg-green-100 text-green-800">
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  Recording
                                </Badge>
                              )}
                              {getStatusBadge(call)}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{call.agentName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(call.duration)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                <span>{call.campaignName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(call.startTime), "MMM dd, HH:mm")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-6">
                            <Button variant="default" size="sm" onClick={() => handleSelectCall(call)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            {call.recordingUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          {selectedCall && (
            <div className="space-y-6">
              {/* Call Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Call Overview
                  </CardTitle>
                  <CardDescription>
                    {selectedCall.campaignName} • {format(new Date(selectedCall.startTime), "MMMM dd, yyyy HH:mm")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Call Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Call ID:</span>
                          <span className="text-sm font-medium">{selectedCall.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Direction:</span>
                          <span className="text-sm font-medium">{selectedCall.direction}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Duration:</span>
                          <span className="text-sm font-medium">{formatDuration(selectedCall.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Status:</span>
                          <span className="text-sm font-medium">{selectedCall.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Disposition:</span>
                          <span className="text-sm font-medium">{selectedCall.disposition}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Caller:</span>
                          <span className="text-sm font-medium">{selectedCall.callerId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Called:</span>
                          <span className="text-sm font-medium">{selectedCall.calledNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Agent:</span>
                          <span className="text-sm font-medium">{selectedCall.agentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Campaign:</span>
                          <span className="text-sm font-medium">{selectedCall.campaignName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Campaign ID:</span>
                          <span className="text-sm font-medium">{selectedCall.campaignId}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Financial</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Revenue:</span>
                          <span className="text-sm font-medium">${selectedCall.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Cost:</span>
                          <span className="text-sm font-medium">${selectedCall.cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Profit:</span>
                          <span className="text-sm font-medium">
                            ${(selectedCall.revenue - selectedCall.cost).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Recording</h4>
                        {selectedCall.hasRecording ? (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedCall.recordingUrl!} target="_blank" rel="noopener noreferrer">
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Play Recording
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedCall.recordingUrl!} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No recording available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Tabs */}
              {selectedCall.processed ? (
                <Card>
                  <CardHeader className="pb-0">
                    <Tabs value={detailTab} onValueChange={setDetailTab}>
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="transcript" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Transcript
                        </TabsTrigger>
                        <TabsTrigger value="onscript" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          OnScript AI
                        </TabsTrigger>
                        <TabsTrigger value="vocalytics" className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Vocalytics
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <TabsContent value="transcript" className="m-0">
                      <div className="bg-gray-50 p-4 rounded-md max-h-[500px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {selectedCall.transcript || "No transcript available"}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="onscript" className="m-0">
                      {selectedCall.onScriptSummary ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-medium mb-2">Summary</h3>
                            <p className="text-gray-700">{selectedCall.onScriptSummary.summary}</p>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium mb-2">Key Points</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {selectedCall.onScriptSummary.keyPoints?.map((point: string, index: number) => (
                                <li key={index} className="text-gray-700">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium mb-2">Action Items</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {selectedCall.onScriptSummary.actionItems?.map((item: string, index: number) => (
                                <li key={index} className="text-gray-700">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">OnScript AI Summary Not Available</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            The OnScript AI summary could not be generated for this call. This may be due to missing
                            integration or insufficient data.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="vocalytics" className="m-0">
                      {selectedCall.vocalytics ? (
                        <div className="space-y-6">
                          {/* Vocal Characteristics */}
                          <div>
                            <h3 className="text-lg font-medium mb-3">Vocal Characteristics</h3>
                            <div className="space-y-2">
                              {Object.entries(selectedCall.vocalytics.vocalCharacteristics || {}).map(
                                ([key, value]: [string, any]) => (
                                  <div key={key} className="bg-gray-50 p-3 rounded-md">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium">{formatCamelCase(key)}</h4>
                                      <div className="flex items-center gap-2">
                                        <span className="text-red-500 font-medium">{value.negative || 0}</span>
                                        <span className="text-blue-500 font-medium">{value.neutral || 0}</span>
                                        <span className="text-green-500 font-medium">{value.positive || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Vocalytics Not Available</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            Vocalytics analysis could not be generated for this call. This may be due to missing
                            integration or insufficient audio quality.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="analytics" className="m-0">
                      {selectedCall.analysis ? (
                        <div className="space-y-6">
                          {/* Sentiment Analysis */}
                          <div>
                            <h3 className="text-lg font-medium mb-3">Sentiment Analysis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card>
                                <CardContent className="p-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Agent Sentiment</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-medium">
                                      {selectedCall.analysis.sentiment?.agentSentiment?.overall || "Neutral"}
                                    </span>
                                    <Badge
                                      className={getSentimentColor(
                                        selectedCall.analysis.sentiment?.agentSentiment?.overall,
                                      )}
                                    >
                                      {selectedCall.analysis.sentiment?.agentSentiment?.confidence || 70}%
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardContent className="p-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Customer Sentiment</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-medium">
                                      {selectedCall.analysis.sentiment?.customerSentiment?.overall || "Neutral"}
                                    </span>
                                    <Badge
                                      className={getSentimentColor(
                                        selectedCall.analysis.sentiment?.customerSentiment?.overall,
                                      )}
                                    >
                                      {selectedCall.analysis.sentiment?.customerSentiment?.confidence || 70}%
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardContent className="p-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Overall Call Sentiment</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-medium">
                                      {selectedCall.analysis.sentiment?.overallCallSentiment?.overall || "Neutral"}
                                    </span>
                                    <Badge
                                      className={getSentimentColor(
                                        selectedCall.analysis.sentiment?.overallCallSentiment?.overall,
                                      )}
                                    >
                                      {selectedCall.analysis.sentiment?.overallCallSentiment?.confidence || 70}%
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Not Available</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            Call analytics could not be generated for this call. This may be due to missing data or
                            processing errors.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Call Not Processed</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      This call has not been processed yet. Analysis and transcription will be available once processing
                      is complete.
                    </p>
                    {selectedCall.reason && (
                      <p className="text-red-600 text-sm">
                        <strong>Reason:</strong> {selectedCall.reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
