"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Phone,
  Play,
  Clock,
  User,
  Search,
  Filter,
  Mic,
  AlertCircle,
  RefreshCw,
  Calendar,
  PhoneCall,
  DollarSign,
  Building,
  Download,
  Database,
} from "lucide-react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

interface RingbaCall {
  callId: string
  campaignId: string
  campaignName: string
  agent: string
  agentId: string
  duration: number
  recordingUrl: string | null
  direction: string
  callerNumber: string
  calledNumber: string
  startTime: string
  endTime: string | null
  status: string
  disposition: string
  hasRecording: boolean
  publisherId?: string
  targetId?: string
  trackingNumber?: string
  revenue?: number
  cost?: number
  metadata: any
}

interface Campaign {
  id: string
  name: string
  status?: string
  callCount?: number
}

export function AllRingbaCalls() {
  const [calls, setCalls] = useState<RingbaCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRecordings, setFilterRecordings] = useState(false)
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [timeRange, setTimeRange] = useState("30")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "table">("list")
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "error">("unknown")
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [callsMetadata, setCallsMetadata] = useState<any>(null)

  useEffect(() => {
    checkRingbaApiStatus()
    fetchRealCampaigns()
    fetchAccountId()
  }, [])

  useEffect(() => {
    if (apiStatus === "ok") {
      fetchAllCalls()
    }
  }, [apiStatus, timeRange, selectedCampaign, filterRecordings])

  const checkRingbaApiStatus = async () => {
    try {
      const response = await fetch("/api/ringba/status")
      const result = await response.json()

      if (result.success) {
        setApiStatus("ok")
        console.log("✅ Ringba API connection verified")
      } else {
        setApiStatus("error")
        setError("Ringba API configuration issue: " + (result.error || "Unknown error"))
        console.error("❌ Ringba API configuration issue:", result.error)
      }
    } catch (error) {
      setApiStatus("error")
      setError("Failed to check Ringba API status")
      console.error("❌ Failed to check Ringba API status:", error)
    }
  }

  const fetchRealCampaigns = async () => {
    setIsCampaignsLoading(true)
    setCampaignsError(null)

    try {
      console.log("🔍 Fetching real Ringba campaigns...")
      const response = await fetch("/api/ringba/campaigns")

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch campaigns")
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid campaign data format received")
      }

      console.log(`✅ Received ${result.data.length} real Ringba campaigns`)
      setCampaigns(
        result.data.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          callCount: campaign.call_count || 0,
        })),
      )
    } catch (error) {
      console.error("❌ Failed to fetch real Ringba campaigns:", error)
      setCampaignsError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsCampaignsLoading(false)
    }
  }

  const fetchAllCalls = async () => {
    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    setCallsMetadata(null)

    try {
      const params = new URLSearchParams({
        days: timeRange,
        limit: "200",
        hasRecording: filterRecordings ? "true" : "false",
      })

      if (selectedCampaign !== "all") {
        params.append("campaignId", selectedCampaign)
      }

      console.log(`🔍 Fetching Ringba calls for account ${accountId} with params: ${params.toString()}`)
      const response = await fetch(`/api/ringba/all-calls?${params}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API error ${response.status}:`, errorText)
        throw new Error(`API error ${response.status}: ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        setErrorDetails(result)
        throw new Error(result.error || "Failed to fetch calls")
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid data format received from API")
      }

      setCalls(result.data)
      setCallsMetadata(result.metadata)
      console.log(`📞 Loaded ${result.data.length} real Ringba calls from account ${accountId}`)
      console.log(`✅ Using endpoint: ${result.metadata?.endpoint}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("❌ Error fetching calls:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccountId = async () => {
    try {
      const response = await fetch("/api/ringba/account-id")
      const result = await response.json()

      if (result.success) {
        setAccountId(result.accountId)
        console.log("✅ Ringba Account ID fetched successfully:", result.accountId)
      } else {
        console.error("❌ Failed to fetch Ringba Account ID:", result.error)
      }
    } catch (error) {
      console.error("❌ Error fetching Ringba Account ID:", error)
    }
  }

  const handleTranscribeCall = async (call: RingbaCall) => {
    if (!call.recordingUrl) {
      alert("No recording URL available for this call")
      return
    }

    setProcessingCalls((prev) => new Set(prev).add(call.callId))

    try {
      // Download the recording from the real Ringba URL
      console.log("📥 Downloading recording for call:", call.callId, "from:", call.recordingUrl)
      const recordingResponse = await fetch(call.recordingUrl)
      if (!recordingResponse.ok) {
        throw new Error(`Failed to download recording: ${recordingResponse.status}`)
      }

      const audioBlob = await recordingResponse.blob()
      const audioFile = new File([audioBlob], `ringba_${call.callId}.wav`, { type: "audio/wav" })

      console.log(`📁 Downloaded audio file: ${audioFile.size} bytes`)

      // Transcribe using our existing API
      console.log("🎯 Transcribing call with Deepgram AI...")
      const formData = new FormData()
      formData.append("audio", audioFile)

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const transcriptionResult = await transcribeResponse.json()

      if (transcriptionResult.success && transcriptionResult.data) {
        // Save the call data with real Ringba metadata
        const callData = {
          id: `ringba_${call.callId}`,
          callId: call.callId,
          agent: call.agent,
          duration: call.duration,
          recordingUrl: call.recordingUrl,
          fileName: audioFile.name,
          date: call.startTime,
          analysis: transcriptionResult.data.analysis,
          transcript: transcriptionResult.data.transcript,
          provider: transcriptionResult.data.provider,
          automated: true,
          integrationSource: "RingBA",
          campaignId: call.campaignId,
          campaignName: call.campaignName,
          ringbaData: {
            direction: call.direction,
            callerNumber: call.callerNumber,
            calledNumber: call.calledNumber,
            status: call.status,
            disposition: call.disposition,
            startTime: call.startTime,
            endTime: call.endTime,
            publisherId: call.publisherId,
            targetId: call.targetId,
            trackingNumber: call.trackingNumber,
            revenue: call.revenue,
            cost: call.cost,
            accountId: accountId,
          },
        }

        // Save to localStorage
        const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
        const existingIndex = existingCalls.findIndex((c: any) => c.callId === call.callId)

        if (existingIndex >= 0) {
          existingCalls[existingIndex] = callData
        } else {
          existingCalls.push(callData)
        }

        localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))

        console.log(`✅ Successfully processed Ringba call ${call.callId}`)
        alert(`Call ${call.callId} transcribed and analyzed successfully! Redirecting to view results...`)

        // Redirect to analysis view
        window.location.href = `/`
      } else {
        throw new Error(transcriptionResult.error || "Transcription failed")
      }
    } catch (error) {
      console.error(`Failed to process call ${call.callId}:`, error)
      alert(`Failed to process call: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setProcessingCalls((prev) => {
        const newSet = new Set(prev)
        newSet.delete(call.callId)
        return newSet
      })
    }
  }

  const exportAllCalls = async () => {
    setIsExporting(true)
    setExportProgress(0)

    const callsWithRecordings = calls.filter((call) => call.hasRecording)
    let processed = 0

    for (const call of callsWithRecordings) {
      try {
        await handleTranscribeCall(call)
        processed++
        setExportProgress(Math.floor((processed / callsWithRecordings.length) * 100))
      } catch (error) {
        console.error(`Failed to export call ${call.callId}:`, error)
      }
    }

    setIsExporting(false)
    alert(`Exported ${processed} of ${callsWithRecordings.length} calls`)
  }

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.callerNumber.includes(searchTerm) ||
      call.calledNumber.includes(searchTerm) ||
      call.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId.includes(searchTerm) ||
      call.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (call.trackingNumber && call.trackingNumber.includes(searchTerm))

    return matchesSearch
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getDirectionBadge = (direction: string) => {
    return direction === "inbound" ? (
      <Badge className="bg-green-500 text-white">📞 Inbound</Badge>
    ) : (
      <Badge className="bg-blue-500 text-white">📱 Outbound</Badge>
    )
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const callStats = {
    total: calls.length,
    withRecordings: calls.filter((c) => c.hasRecording).length,
    inbound: calls.filter((c) => c.direction === "inbound").length,
    outbound: calls.filter((c) => c.direction === "outbound").length,
    uniqueCampaigns: new Set(calls.map((c) => c.campaignId)).size,
    uniqueAgents: new Set(calls.map((c) => c.agentId)).size,
    totalDuration: calls.reduce((sum, call) => sum + call.duration, 0),
  }

  // API Status check
  if (apiStatus === "error") {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800 font-bold">Ringba API Configuration Error</AlertTitle>
        <AlertDescription className="text-red-800">
          <p className="mb-4">{error || "Unable to connect to Ringba API. Please check your API configuration."}</p>
          <p className="text-sm mb-4">
            Make sure your Ringba API key and account ID are correctly configured in the environment variables.
          </p>
          <Button variant="outline" size="sm" onClick={checkRingbaApiStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Campaign loading state
  if (isCampaignsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-12 w-12 mx-auto text-blue-500 mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Ringba Account Data</h3>
            <p className="text-gray-500">Fetching your real campaign and call data from Ringba...</p>
            {accountId && <p className="text-xs text-blue-600 mt-2">Account ID: {accountId}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Campaign error state
  if (campaignsError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800 font-bold">Failed to Load Ringba Data</AlertTitle>
        <AlertDescription className="text-red-800">
          <p className="mb-4">{campaignsError}</p>
          <Button variant="outline" size="sm" onClick={fetchRealCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading Data
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Loading call logs from Ringba account {accountId}...</h3>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Failed to load calls:</strong> {error}
            </div>
            <Button variant="outline" size="sm" onClick={fetchAllCalls}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          {errorDetails && (
            <div className="mt-2 text-xs">
              <p>Endpoint: {errorDetails.endpoint}</p>
              <p>Details: {errorDetails.details}</p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-blue-600" />
            Ringba Call Logs - Ready for Transcription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Calls</div>
              <div className="text-2xl font-bold">{callStats.total}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">With Recordings</div>
              <div className="text-2xl font-bold">{callStats.withRecordings}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Campaigns</div>
              <div className="text-2xl font-bold">{callStats.uniqueCampaigns}</div>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-sm text-amber-600 font-medium">Total Duration</div>
              <div className="text-2xl font-bold">{Math.floor(callStats.totalDuration / 60)} mins</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Database className="h-4 w-4 text-green-600" />
            <span>
              Real data from Ringba Account: <strong>{accountId}</strong>
            </span>
            {callsMetadata?.endpoint && (
              <Badge variant="outline" className="text-xs">
                API: {callsMetadata.endpoint}
              </Badge>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by phone, agent, campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Campaign" />
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

            <Button
              variant={filterRecordings ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRecordings(!filterRecordings)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {filterRecordings ? "Show All" : "With Recordings"}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "table" : "list")}>
              {viewMode === "list" ? "Table View" : "List View"}
            </Button>

            <Button onClick={fetchAllCalls} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {callStats.withRecordings > 0 && (
              <Button onClick={exportAllCalls} variant="default" size="sm" disabled={isExporting}>
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Transcribing... {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Transcribe All ({callStats.withRecordings})
                  </>
                )}
              </Button>
            )}
          </div>

          {isExporting && (
            <div className="mt-4">
              <Progress value={exportProgress} className="h-2" />
              <p className="text-xs text-center mt-1 text-gray-500">
                Transcribing with Deepgram AI: {exportProgress}% complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
            <p className="text-gray-500">
              {calls.length === 0
                ? `No calls available in the selected time range for account ${accountId}.`
                : "No calls match your current filters."}
            </p>
            {calls.length === 0 && (
              <div className="mt-4">
                <Button onClick={fetchAllCalls} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Different Time Range
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredCalls.map((call) => (
            <Card key={call.callId} className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">Call {call.callId}</h4>
                      {getDirectionBadge(call.direction)}
                      {call.hasRecording && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          🎵 Recording Available
                        </Badge>
                      )}
                      {call.revenue && call.revenue > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(call.revenue)}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">Campaign:</span> {call.campaignName}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Agent:</span> {call.agent}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Duration:</span> {formatDuration(call.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Time:</span> {format(new Date(call.startTime), "MMM dd, HH:mm")}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium">From:</span> {call.callerNumber}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">To:</span> {call.calledNumber}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">Status:</span> {call.status}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">Disposition:</span> {call.disposition}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    {call.hasRecording && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleTranscribeCall(call)}
                          disabled={processingCalls.has(call.callId)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {processingCalls.has(call.callId) ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Transcribing...
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4 mr-2" />
                              Transcribe with Deepgram AI
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={call.recordingUrl!} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Listen to Recording
                          </a>
                        </Button>
                      </>
                    )}
                    {!call.hasRecording && (
                      <Badge variant="secondary" className="text-center">
                        No Recording
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.callId}>
                    <TableCell className="font-medium">{call.callId}</TableCell>
                    <TableCell>{call.campaignName}</TableCell>
                    <TableCell>{call.agent}</TableCell>
                    <TableCell>{getDirectionBadge(call.direction)}</TableCell>
                    <TableCell>{formatDuration(call.duration)}</TableCell>
                    <TableCell>{format(new Date(call.startTime), "MMM dd, HH:mm")}</TableCell>
                    <TableCell>{call.status}</TableCell>
                    <TableCell>
                      {call.hasRecording ? (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleTranscribeCall(call)}
                            disabled={processingCalls.has(call.callId)}
                          >
                            {processingCalls.has(call.callId) ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={call.recordingUrl!} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">No Recording</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
