"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Phone,
  Download,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Zap,
  Filter,
  BarChart3,
  AlertTriangle,
  Mic,
  Brain,
} from "lucide-react"
import { RingBABackendService } from "@/lib/ringba-backend-service"

interface RingBACall {
  id: string
  direction: "inbound" | "outbound"
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
  transcriptionStatus: "pending" | "processing" | "completed" | "failed"
  analysisStatus: "pending" | "processing" | "completed" | "failed"
  analysis?: any
  transcript?: string
  error?: string
}

export function RingBAIntegrationDashboard() {
  const [calls, setCalls] = useState<RingBACall[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [processingCall, setProcessingCall] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalCalls: 0,
    pendingCalls: 0,
    processedCalls: 0,
    failedCalls: 0,
    lastSync: "Never",
  })
  const [filters, setFilters] = useState({
    days: 7,
    minDuration: 30,
    maxResults: 50,
    direction: "all" as "all" | "inbound" | "outbound",
    status: "all" as "all" | "pending" | "completed" | "failed",
  })

  const ringbaService = RingBABackendService.getInstance()

  useEffect(() => {
    loadCalls()
    updateStats()

    // Set up sync status listener
    const unsubscribe = ringbaService.addSyncListener((status) => {
      setIsSyncing(status.syncing)
      if (status.count !== undefined) {
        setSyncProgress((status.count / 50) * 100) // Assuming max 50 calls per sync
      }
      if (status.error) {
        setError(status.error)
        setIsSyncing(false)
      }
      if (!status.syncing) {
        loadCalls()
        updateStats()
      }
    })

    return unsubscribe
  }, [])

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
          status: call.analysis ? "completed" : "pending",
          transcriptionStatus: call.transcript ? "completed" : "pending",
          analysisStatus: call.analysis ? "completed" : "pending",
          analysis: call.analysis,
          transcript: call.transcript,
        }))

      setCalls(ringbaCalls)
    } catch (error) {
      console.error("Error loading calls:", error)
    }
  }

  const updateStats = () => {
    const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
    const ringbaCalls = uploadedCalls.filter((call: any) => call.integrationSource === "RingBA")

    setStats({
      totalCalls: ringbaCalls.length,
      pendingCalls: ringbaCalls.filter((call: any) => !call.analysis).length,
      processedCalls: ringbaCalls.filter((call: any) => call.analysis).length,
      failedCalls: ringbaCalls.filter((call: any) => call.error).length,
      lastSync: localStorage.getItem("ringba_last_sync") || "Never",
    })
  }

  const handleManualSync = async () => {
    setError(null)
    setIsSyncing(true)
    setSyncProgress(0)

    try {
      const result = await ringbaService.manualSync(filters.days)
      if (result.success) {
        console.log(`✅ Manual sync completed: ${result.count} calls processed`)
      } else {
        setError(result.error || "Sync failed")
      }
    } catch (error: any) {
      setError(error.message || "Sync failed")
    } finally {
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }

  const handleProcessCall = async (call: RingBACall) => {
    if (!call.recordingUrl) {
      setError("No recording URL available for this call")
      return
    }

    setProcessingCall(call.id)
    setError(null)

    try {
      console.log(`🎯 Processing call ${call.id}...`)

      // Download the recording
      const response = await fetch(call.recordingUrl)
      if (!response.ok) {
        throw new Error("Failed to download recording")
      }

      const audioBlob = await response.blob()
      const audioFile = new File([audioBlob], `ringba_${call.id}.wav`, { type: "audio/wav" })

      // Create FormData for transcription
      const formData = new FormData()
      formData.append("audio", audioFile)

      // Send to our transcription API
      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const result = await transcriptionResponse.json()

      if (result.success && result.data) {
        // Update the call in localStorage
        const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
        const existingCallIndex = uploadedCalls.findIndex((c: any) => c.externalId === call.id)

        if (existingCallIndex >= 0) {
          uploadedCalls[existingCallIndex] = {
            ...uploadedCalls[existingCallIndex],
            transcript: result.data.transcript,
            analysis: result.data.analysis,
            duration: result.data.duration,
            provider: result.data.provider,
          }
        } else {
          // Add new call
          uploadedCalls.push({
            id: `ringba_${call.id}`,
            externalId: call.id,
            fileName: audioFile.name,
            date: call.startTime,
            duration: result.data.duration,
            analysis: result.data.analysis,
            transcript: result.data.transcript,
            provider: result.data.provider,
            automated: true,
            integrationSource: "RingBA",
            ringbaData: {
              direction: call.direction,
              callerNumber: call.callerNumber,
              calledNumber: call.calledNumber,
              campaignId: call.campaignId,
              agentId: call.agentId,
              disposition: call.disposition,
            },
          })
        }

        localStorage.setItem("uploadedCalls", JSON.stringify(uploadedCalls))
        loadCalls()
        updateStats()

        console.log(`✅ Successfully processed call ${call.id}`)
      } else {
        throw new Error(result.error || "Processing failed")
      }
    } catch (error: any) {
      console.error(`❌ Failed to process call ${call.id}:`, error)
      setError(`Failed to process call: ${error.message}`)
    } finally {
      setProcessingCall(null)
    }
  }

  const filteredCalls = calls.filter((call) => {
    if (filters.direction !== "all" && call.direction !== filters.direction) return false
    if (filters.status !== "all" && call.status !== filters.status) return false
    if (call.duration < filters.minDuration) return false
    return true
  })

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
            <Activity className="h-3 w-3 mr-1 animate-spin" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-600" />
            RingBA Call Integration
          </h2>
          <p className="text-gray-600">Automatically fetch and analyze calls from RingBA</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Zap className="h-4 w-4 mr-1" />
            Auto-Processing
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Mic className="h-4 w-4 mr-1" />
            Deepgram AI
          </Badge>
        </div>
      </div>

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
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-sm font-medium text-gray-900">
                  {stats.lastSync === "Never" ? "Never" : new Date(stats.lastSync).toLocaleString()}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Sync Controls
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
              >
                <option value="all">All</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>

            <Button onClick={handleManualSync} disabled={isSyncing} className="ml-auto">
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Sync Calls
                </>
              )}
            </Button>
          </div>

          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing calls from RingBA...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Calls List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Calls ({filteredCalls.length})
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-gray-700">
                <Filter className="h-3 w-3 mr-1" />
                Filtered
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Calls Found</h3>
              <p className="text-gray-600 mb-4">
                {calls.length === 0
                  ? "No calls have been synced from RingBA yet."
                  : "No calls match your current filters."}
              </p>
              {calls.length === 0 && (
                <Button onClick={handleManualSync} disabled={isSyncing}>
                  <Download className="h-4 w-4 mr-2" />
                  Sync Calls from RingBA
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.slice(0, filters.maxResults).map((call) => (
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
                          <Badge className="bg-red-100 text-red-800">❌ Error: {call.error}</Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {call.status === "pending" && call.recordingUrl && (
                        <Button size="sm" onClick={() => handleProcessCall(call)} disabled={processingCall === call.id}>
                          {processingCall === call.id ? (
                            <>
                              <Activity className="h-4 w-4 mr-2 animate-spin" />
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
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analysis
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredCalls.length > filters.maxResults && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    Showing {filters.maxResults} of {filteredCalls.length} calls
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, maxResults: filters.maxResults + 25 })}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
