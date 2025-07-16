"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Phone,
  Clock,
  DollarSign,
  MapPin,
  User,
  FileText,
  PlayCircle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Tag,
  Headphones,
} from "lucide-react"
import { format } from "date-fns"

interface DetailedCallLog {
  id: string
  campaignId: string
  campaignName: string
  callerId: string
  calledNumber: string
  trackingNumber?: string
  startTime: string
  endTime?: string
  duration: number
  ringTime: number
  status: string
  disposition: string
  direction: string
  recordingUrl?: string
  hasRecording: boolean
  recordingDuration: number
  recordingSize: number
  agentName: string
  agentId?: string
  revenue: number
  cost: number
  profit: number
  quality?: string
  callerLocation: {
    city?: string
    state?: string
    country?: string
  }
  targetLocation: {
    city?: string
    state?: string
  }
  sourceId?: string
  keywordId?: string
  tags: string[]
  customFields: Record<string, any>
  notes?: string
  userAgent?: string
  ipAddress?: string
  referrer?: string
  isTranscribed: boolean
  transcriptionStatus: string
  transcript?: string
  analysis?: any
  aiInsights?: any
  metadata: any
}

export function DetailedCallLogsViewer() {
  const [callLogs, setCallLogs] = useState<DetailedCallLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<DetailedCallLog | null>(null)
  const [filters, setFilters] = useState({
    callId: "",
    campaignId: "",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    limit: "50",
  })
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean
    method: string
    dataSource: string
    endpoint: string
  }>({
    isConnected: false,
    method: "Unknown",
    dataSource: "Unknown",
    endpoint: "Unknown",
  })

  const fetchDetailedCallLogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.callId) params.append("callId", filters.callId)
      if (filters.campaignId) params.append("campaignId", filters.campaignId)
      params.append("startDate", filters.startDate)
      params.append("endDate", filters.endDate)
      params.append("limit", filters.limit)

      console.log("🔄 Fetching detailed call logs with params:", Object.fromEntries(params))

      const response = await fetch(`/api/ringba/calllogs/detail?${params}`)
      const result = await response.json()

      console.log("📡 Detailed call logs response:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch detailed call logs")
      }

      setCallLogs(result.data || [])
      setApiStatus({
        isConnected: result.dataSource === "REAL_RINGBA_DETAIL_API",
        method: result.method || "Unknown",
        dataSource: result.dataSource || "Unknown",
        endpoint: result.endpoint || "Unknown",
      })

      if (result.dataSource === "MOCK_DETAILED_DATA") {
        setError(`Using mock data - API connection failed. ${result.note || ""}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("❌ Detailed call logs fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetailedCallLogs()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-500 text-white",
      answered: "bg-green-500 text-white",
      busy: "bg-yellow-500 text-white",
      "no-answer": "bg-orange-500 text-white",
      failed: "bg-red-500 text-white",
    }

    return <Badge className={statusColors[status] || "bg-gray-500 text-white"}>{status.toUpperCase()}</Badge>
  }

  const getDispositionBadge = (disposition: string) => {
    const dispositionColors: Record<string, string> = {
      sale: "bg-green-500 text-white",
      qualified: "bg-blue-500 text-white",
      callback: "bg-yellow-500 text-white",
      "not-interested": "bg-red-500 text-white",
      "no-sale": "bg-gray-500 text-white",
    }

    return (
      <Badge className={dispositionColors[disposition] || "bg-gray-500 text-white"}>
        {disposition.replace("-", " ").toUpperCase()}
      </Badge>
    )
  }

  const getApiStatusBadge = () => {
    if (apiStatus.isConnected && apiStatus.dataSource === "REAL_RINGBA_DETAIL_API") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Live Detailed API
        </Badge>
      )
    } else if (apiStatus.dataSource === "MOCK_DETAILED_DATA") {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Info className="h-3 w-3 mr-1" />
          Mock Detailed Data
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          API Error
        </Badge>
      )
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Detailed Call Logs
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600">
              Endpoint: {apiStatus.endpoint} • Method: {apiStatus.method}
            </p>
            {getApiStatusBadge()}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDetailedCallLogs} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* API Status Alert */}
      {apiStatus.dataSource === "MOCK_DETAILED_DATA" && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Using Mock Detailed Data:</strong> The Ringba detailed API connection failed. Showing sample
            detailed data for development.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Call ID</label>
              <Input
                placeholder="Specific call ID..."
                value={filters.callId}
                onChange={(e) => setFilters({ ...filters, callId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Campaign ID</label>
              <Input
                placeholder="Campaign ID..."
                value={filters.campaignId}
                onChange={(e) => setFilters({ ...filters, campaignId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchDetailedCallLogs} disabled={isLoading} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert
          className={`${apiStatus.dataSource === "MOCK_DETAILED_DATA" ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50"}`}
        >
          <AlertCircle
            className={`h-4 w-4 ${apiStatus.dataSource === "MOCK_DETAILED_DATA" ? "text-yellow-600" : "text-red-600"}`}
          />
          <AlertDescription
            className={apiStatus.dataSource === "MOCK_DETAILED_DATA" ? "text-yellow-800" : "text-red-800"}
          >
            <strong>{apiStatus.dataSource === "MOCK_DETAILED_DATA" ? "API Notice:" : "Error:"}</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Call Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Detailed Call Logs ({callLogs.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingSkeleton />}

          {!isLoading && callLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No detailed call logs found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or check if the API connection is working properly.
              </p>
            </div>
          )}

          {!isLoading && callLogs.length > 0 && (
            <div className="space-y-4">
              {callLogs.map((call) => (
                <Card key={call.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {call.callerId} → {call.calledNumber}
                          </h3>
                          <Badge variant={call.direction === "inbound" ? "default" : "secondary"}>
                            {call.direction}
                          </Badge>
                          {getStatusBadge(call.status)}
                          {getDispositionBadge(call.disposition)}
                        </div>
                        <div className="flex items-center gap-2">
                          {call.hasRecording && (
                            <Button size="sm" variant="outline">
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Play Recording
                            </Button>
                          )}
                          <Button size="sm" onClick={() => setSelectedCall(call)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Quick Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Agent:</span>
                          <span>{call.agentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Duration:</span>
                          <span>{formatDuration(call.duration)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Revenue:</span>
                          <span className="text-green-600">${call.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Profit:</span>
                          <span className="text-blue-600">${call.profit.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Started:</span>
                          <span>{format(new Date(call.startTime), "MMM dd, HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Campaign:</span>
                          <span>{call.campaignName}</span>
                        </div>
                      </div>

                      {/* Location Info */}
                      {(call.callerLocation.city || call.targetLocation.city) && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {call.callerLocation.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                Caller: {call.callerLocation.city}, {call.callerLocation.state}
                              </span>
                            </div>
                          )}
                          {call.targetLocation.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                Target: {call.targetLocation.city}, {call.targetLocation.state}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Recording Info */}
                      {call.hasRecording && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-1">
                            <Headphones className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">Recording Available</span>
                          </div>
                          <span>Duration: {formatDuration(call.recordingDuration)}</span>
                          <span>Size: {formatFileSize(call.recordingSize)}</span>
                          {call.recordingUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {call.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Tags:</span>
                          {call.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Call Modal/Panel would go here */}
      {selectedCall && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detailed View: {selectedCall.id}</span>
              <Button variant="outline" onClick={() => setSelectedCall(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="metadata">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Call Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Call ID:</strong> {selectedCall.id}
                      </div>
                      <div>
                        <strong>Campaign:</strong> {selectedCall.campaignName}
                      </div>
                      <div>
                        <strong>Agent:</strong> {selectedCall.agentName}
                      </div>
                      <div>
                        <strong>Duration:</strong> {formatDuration(selectedCall.duration)}
                      </div>
                      <div>
                        <strong>Ring Time:</strong> {formatDuration(selectedCall.ringTime)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Location & Tracking</h4>
                    <div className="space-y-2 text-sm">
                      {selectedCall.trackingNumber && (
                        <div>
                          <strong>Tracking Number:</strong> {selectedCall.trackingNumber}
                        </div>
                      )}
                      {selectedCall.sourceId && (
                        <div>
                          <strong>Source ID:</strong> {selectedCall.sourceId}
                        </div>
                      )}
                      {selectedCall.keywordId && (
                        <div>
                          <strong>Keyword ID:</strong> {selectedCall.keywordId}
                        </div>
                      )}
                      {selectedCall.callerLocation.city && (
                        <div>
                          <strong>Caller Location:</strong> {selectedCall.callerLocation.city},{" "}
                          {selectedCall.callerLocation.state}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Technical Details</h4>
                    <div className="space-y-2 text-sm">
                      {selectedCall.userAgent && (
                        <div>
                          <strong>User Agent:</strong> {selectedCall.userAgent}
                        </div>
                      )}
                      {selectedCall.ipAddress && (
                        <div>
                          <strong>IP Address:</strong> {selectedCall.ipAddress}
                        </div>
                      )}
                      {selectedCall.referrer && (
                        <div>
                          <strong>Referrer:</strong> {selectedCall.referrer}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Custom Fields</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedCall.customFields).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">${selectedCall.revenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Revenue</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">${selectedCall.cost.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Cost</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">${selectedCall.profit.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Profit</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="metadata">
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(selectedCall.metadata, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
