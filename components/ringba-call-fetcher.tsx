"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  AlertTriangle,
  Brain,
  Play,
  Eye,
  Loader2,
  FileAudio,
} from "lucide-react"
import { RingBAEnhancedService } from "@/lib/ringba-enhanced-service"

interface FetchedCall {
  id: string
  direction: string
  callerNumber: string
  calledNumber: string
  duration: number
  startTime: string
  endTime: string
  recordingUrl?: string
  campaignId?: string
  agentId?: string
  disposition?: string
  status: "pending" | "processing" | "completed" | "failed"
  transcriptionStatus?: "pending" | "processing" | "completed" | "failed"
  analysisStatus?: "pending" | "processing" | "completed" | "failed"
  analysis?: any
  transcript?: string
  error?: string
}

export function RingBACallFetcher() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchProgress, setFetchProgress] = useState(0)
  const [calls, setCalls] = useState<FetchedCall[]>([])
  const [filteredCalls, setFilteredCalls] = useState<FetchedCall[]>([])
  const [processingCall, setProcessingCall] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    days: 7,
    minDuration: 30,
    maxResults: 50,
    direction: "all" as "all" | "inbound" | "outbound",
    status: "all" as "all" | "pending" | "completed" | "failed",
  })
  const [stats, setStats] = useState({
    totalCalls: 0,
    pendingCalls: 0,
    processedCalls: 0,
    failedCalls: 0,
    lastFetch: "Never",
  })

  // Initialize RingBA service
  const ringbaService = RingBAEnhancedService.getInstance()

  useEffect(() => {
    // Check connection on load
    checkConnection()

    // Load any previously fetched calls
    loadCalls()

    // Set up sync status listener
    const unsubscribe = ringbaService.addSyncListener((status) => {
      setIsFetching(status.syncing)
      if (status.count !== undefined) {
        setFetchProgress((status.count / 50) * 100) // Assuming max 50 calls per sync
      }
      if (status.error) {
        setError(status.error)
        setIsFetching(false)
      }
      if (!status.syncing) {
        loadCalls()
        updateStats()
        setSuccessMessage("Calls fetched successfully!")
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    applyFilters()
  }, [calls, filters])

  const checkConnection = async () => {
    setIsLoading(true)
    setConnectionError(null)

    try {
      const result = await ringbaService.testConnection()
      setIsConnected(result.success)
      if (!result.success) {
        setConnectionError(result.error || "Failed to connect to RingBA API")
      }
    } catch (error) {
      setIsConnected(false)
      setConnectionError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCalls = () => {
    try {
      const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
      const ringbaCalls = uploadedCalls
        .filter((call: any) => call.integrationSource === "RingBA")
        .map((call: any) => ({
          id: call.externalId || call.id,
          direction: call.ringbaData?.direction || "inbound",
          callerNumber: call.ringbaData?.callerNumber || "Unknown",
          calledNumber: call.ringbaData?.calledNumber || "Unknown",
          duration: call.duration || 0,
          startTime: call.date,
          endTime: call.date,
          recordingUrl: call.recordingUrl,
          campaignId: call.ringbaData?.campaignId,
          agentId: call.ringbaData?.agentId,
          disposition: call.ringbaData?.disposition,
          status: call.analysis ? "completed" : call.error ? "failed" : "pending",
          transcriptionStatus: call.transcript ? "completed" : "pending",
          analysisStatus: call.analysis ? "completed" : "pending",
          analysis: call.analysis,
          transcript: call.transcript,
          error: call.error,
        }))

      setCalls(ringbaCalls)
      updateStats()
    } catch (error) {
      console.error("Error loading calls:", error)
      setError("Failed to load calls from storage")
    }
  }

  const updateStats = () => {
    const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
    const ringbaCalls = uploadedCalls.filter((call: any) => call.integrationSource === "RingBA")

    setStats({
      totalCalls: ringbaCalls.length,
      pendingCalls: ringbaCalls.filter((call: any) => !call.analysis && !call.error).length,
      processedCalls: ringbaCalls.filter((call: any) => call.analysis).length,
      failedCalls: ringbaCalls.filter((call: any) => call.error).length,
      lastFetch: localStorage.getItem("ringba_last_sync") || "Never",
    })
  }

  const applyFilters = () => {
    let filtered = [...calls]

    // Direction filter
    if (filters.direction !== "all") {
      filtered = filtered.filter((call) => call.direction === filters.direction)
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((call) => call.status === filters.status)
    }

    // Duration filter
    filtered = filtered.filter((call) => call.duration >= filters.minDuration)

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    // Limit results
    filtered = filtered.slice(0, filters.maxResults)

    setFilteredCalls(filtered)
  }

  const handleFetchCalls = async () => {
    setError(null)
    setIsFetching(true)
    setFetchProgress(0)

    try {
      const result = await ringbaService.manualSync(filters.days)
      if (result.success) {
        setSuccessMessage(`Successfully fetched ${result.count} calls from RingBA!`)
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError(result.error || "Failed to fetch calls")
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch calls")
    } finally {
      setIsFetching(false)
      setFetchProgress(0)
    }
  }

  const handleProcessCall = async (call: FetchedCall) => {
    if (!call.recordingUrl) {
      setError("No recording URL available for this call")
      return
    }

    setProcessingCall(call.id)
    setError(null)

    try {
      // Process the call using RingBA service
      const result = await ringbaService.processCallManually(call.id)

      if (result.success) {
        setSuccessMessage(`Successfully processed call ${call.id}!`)
        // Reload calls to show updated status
        loadCalls()
      } else {
        setError(result.error || "Failed to process call")
      }
    } catch (error: any) {
      setError(error.message || "Failed to process call")
    } finally {
      setProcessingCall(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-blue-500 text-white">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
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

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            RingBA Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isConnected === null ? (
                <Badge className="bg-gray-500 text-white">Checking...</Badge>
              ) : isConnected ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-red-500 text-white">
                  <XCircle className="h-4 w-4 mr-2" />
                  Not Connected
                </Badge>
              )}

              {connectionError && <span className="text-red-600 text-sm">{connectionError}</span>}
            </div>

            <Button onClick={checkConnection} disabled={isLoading} variant="outline">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Connection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCalls}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingCalls}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{stats.processedCalls}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedCalls}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Fetch</p>
                <p className="text-sm font-medium text-gray-900">
                  {stats.lastFetch === "Never" ? "Never" : new Date(stats.lastFetch).toLocaleString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fetch Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Fetch Calls from RingBA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Days:</label>
              <select
                value={filters.days}
                onChange={(e) => setFilters({ ...filters, days: Number(e.target.value) })}
                className="border rounded px-2 py-1 text-sm"
                disabled={isFetching}
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Min Duration:</label>
              <select
                value={filters.minDuration}
                onChange={(e) => setFilters({ ...filters, minDuration: Number(e.target.value) })}
                className="border rounded px-2 py-1 text-sm"
                disabled={isFetching}
              >
                <option value={0}>Any</option>
                <option value={30}>30s</option>
                <option value={60}>1 min</option>
                <option value={120}>2 min</option>
                <option value={300}>5 min</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Direction:</label>
              <select
                value={filters.direction}
                onChange={(e) => setFilters({ ...filters, direction: e.target.value as any })}
                className="border rounded px-2 py-1 text-sm"
                disabled={isFetching}
              >
                <option value="all">All</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>

            <Button onClick={handleFetchCalls} disabled={isFetching || isConnected === false} className="ml-auto">
              {isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Fetch Calls
                </>
              )}
            </Button>
          </div>

          {isFetching && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Fetching calls from RingBA...</span>
                <span>{Math.round(fetchProgress)}%</span>
              </div>
              <Progress value={fetchProgress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-200 bg-green-50 mt-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Calls List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              Fetched Calls ({filteredCalls.length})
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-gray-700">
                <Filter className="h-3 w-3 mr-1" />
                Filtered
              </Badge>
              <Button onClick={loadCalls} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All Calls</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value="all">{renderCallsList(filteredCalls)}</TabsContent>

            <TabsContent value="pending">
              {renderCallsList(filteredCalls.filter((call) => call.status === "pending"))}
            </TabsContent>

            <TabsContent value="completed">
              {renderCallsList(filteredCalls.filter((call) => call.status === "completed"))}
            </TabsContent>

            <TabsContent value="failed">
              {renderCallsList(filteredCalls.filter((call) => call.status === "failed"))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  function renderCallsList(calls: FetchedCall[]) {
    if (calls.length === 0) {
      return (
        <div className="text-center py-8">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Calls Found</h3>
          <p className="text-gray-600 mb-4">
            {filteredCalls.length === 0
              ? "No calls have been fetched from RingBA yet."
              : "No calls match your current filters."}
          </p>
          {filteredCalls.length === 0 && (
            <Button onClick={handleFetchCalls} disabled={isFetching || isConnected === false}>
              <Download className="h-4 w-4 mr-2" />
              Fetch Calls from RingBA
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {calls.map((call) => (
          <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {call.direction === "inbound" ? "📞 Inbound" : "📱 Outbound"}
                    </Badge>
                    {getStatusBadge(call.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {call.callerNumber} → {call.calledNumber}
                  </div>
                  <div className="text-sm text-gray-600">Duration: {formatDuration(call.duration)}</div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>📅 {formatDate(call.startTime)}</span>
                  {call.campaignId && <span>🎯 Campaign: {call.campaignId}</span>}
                  {call.agentId && <span>👤 Agent: {call.agentId}</span>}
                  {call.disposition && <span>📋 {call.disposition}</span>}
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
                {call.status === "pending" && call.recordingUrl && (
                  <Button size="sm" onClick={() => handleProcessCall(call)} disabled={processingCall === call.id}>
                    {processingCall === call.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                )}

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
                        detail: { callId: call.id, analysis: call.analysis, transcript: call.transcript },
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
    )
  }
}
