"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Target,
  Phone,
  DollarSign,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Play,
  Download,
  Mic,
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react"
import { format, subDays } from "date-fns"
import { DateRangePicker } from "./date-range-picker"
import type { DateRange } from "react-day-picker"

interface Campaign {
  id: string
  name: string
  status: string
  type: string
  description: string
  isActive: boolean
  callLogs: CallLog[]
  callCount: number
  recordedCallsCount: number
  apiStatus: string
  apiError?: string
  totalRevenue: number
  averageDuration: number
}

interface CallLog {
  id: string
  callId: string
  campaignId: string
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
  agent: string
  revenue: number
  cost: number
  quality: string | null
  tags: string[]
}

export function CampaignsWithCallsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7), // Default to last 7 days
    to: new Date(),
  })
  const [selectedTab, setSelectedTab] = useState("overview")

  useEffect(() => {
    fetchCampaignsWithCalls()
  }, [])

  const fetchCampaignsWithCalls = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        startDate: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd'T'00:00:00'Z'")
          : format(subDays(new Date(), 7), "yyyy-MM-dd'T'00:00:00'Z'"),
        endDate: dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd'T'23:59:59'Z'")
          : format(new Date(), "yyyy-MM-dd'T'23:59:59'Z'"),
      }

      const response = await fetch("/api/ringba/campaigns-with-calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        setCampaigns(result.data || [])
        setSummary(result.summary || {})
        console.log("✅ Successfully fetched campaigns with calls:", result)
      } else {
        setError(result.error || "Failed to fetch campaigns")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCampaignExpansion = (campaignId: string) => {
    setExpandedCampaigns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId)
      } else {
        newSet.add(campaignId)
      }
      return newSet
    })
  }

  const handleTranscribeCall = async (call: CallLog) => {
    if (!call.recordingUrl) {
      alert("No recording URL available for this call")
      return
    }

    setProcessingCalls((prev) => new Set(prev).add(call.callId))

    try {
      console.log("📥 Processing call:", call.callId)

      // Download the recording
      const recordingResponse = await fetch(call.recordingUrl)
      if (!recordingResponse.ok) {
        throw new Error("Failed to download recording")
      }

      const audioBlob = await recordingResponse.blob()
      const audioFile = new File([audioBlob], `ringba_${call.callId}.wav`, { type: "audio/wav" })

      // Transcribe using our existing API
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
        // Find the campaign for this call
        const campaign = campaigns.find((c) => c.id === call.campaignId)

        // Save the call data
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
          campaignName: campaign?.name || "Unknown Campaign",
          ringbaData: {
            direction: call.direction,
            callerNumber: call.callerId,
            calledNumber: call.calledNumber,
            status: call.status,
            disposition: call.disposition,
            startTime: call.startTime,
            endTime: call.endTime,
            revenue: call.revenue,
            cost: call.cost,
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

        console.log(`✅ Successfully processed call ${call.callId}`)
        alert(`Call ${call.callId} transcribed and analyzed successfully!`)

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

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive || status === "active") {
      return <Badge className="bg-green-500 text-white">🟢 Active</Badge>
    } else if (status === "paused") {
      return <Badge className="bg-yellow-500 text-white">⏸️ Paused</Badge>
    } else {
      return <Badge className="bg-gray-500 text-white">⚪ Inactive</Badge>
    }
  }

  const getApiStatusBadge = (apiStatus: string) => {
    switch (apiStatus) {
      case "success":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Live API
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Info className="h-3 w-3 mr-1" />
            Mock Data
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            API Error
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
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
            <Target className="h-8 w-8 text-blue-600" />
            Ringba Campaigns & Call Logs
          </h2>
          <p className="text-gray-600">Organized by campaign with individual call logs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCampaignsWithCalls} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Controls */}
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onApply={fetchCampaignsWithCalls}
        isLoading={isLoading}
      />

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalCampaigns}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.totalCalls.toLocaleString()}</p>
                </div>
                <Phone className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With Recordings</p>
                  <p className="text-2xl font-bold text-green-600">{summary.totalRecordedCalls}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">API Success</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.successfulCampaigns}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Failed to load campaigns:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Campaigns List */}
      {!isLoading && campaigns.length > 0 && (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="border border-gray-200">
              <Collapsible
                open={expandedCampaigns.has(campaign.id)}
                onOpenChange={() => toggleCampaignExpansion(campaign.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          {getStatusBadge(campaign.status, campaign.isActive)}
                          {getApiStatusBadge(campaign.apiStatus)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Campaign ID:</span> {campaign.id}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {campaign.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span className="font-medium">Calls:</span> {campaign.callCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            <span className="font-medium">Recordings:</span> {campaign.recordedCallsCount}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm mt-2">
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatCurrency(campaign.totalRevenue)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Avg: {formatDuration(campaign.averageDuration)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{campaign.callCount} calls</Badge>
                        {expandedCampaigns.has(campaign.id) ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {campaign.apiError && (
                      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <strong>API Notice:</strong> {campaign.apiError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {campaign.callLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No call logs found for this campaign</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 mb-3">Call Logs ({campaign.callLogs.length})</h4>
                        {campaign.callLogs.map((call) => (
                          <Card key={call.callId} className="border border-gray-100">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="font-medium text-gray-900">
                                      {call.callerId} → {call.calledNumber}
                                    </h5>
                                    {getDirectionBadge(call.direction)}
                                    {call.hasRecording && (
                                      <Badge variant="outline" className="text-green-600">
                                        🎵 Recording
                                      </Badge>
                                    )}
                                    {call.revenue > 0 && (
                                      <Badge variant="outline" className="text-green-600">
                                        {formatCurrency(call.revenue)}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <User className="h-4 w-4" />
                                      <span>{call.agent}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{formatDuration(call.duration)}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Status:</span> {call.status}
                                    </div>
                                    <div>
                                      <span className="font-medium">Disposition:</span> {call.disposition}
                                    </div>
                                  </div>

                                  <div className="text-sm text-gray-500 mt-1">
                                    <span className="font-medium">Started:</span>{" "}
                                    {format(new Date(call.startTime), "MMM dd, yyyy HH:mm")}
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
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            <Mic className="h-4 w-4 mr-2" />
                                            Transcribe
                                          </>
                                        )}
                                      </Button>
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={call.recordingUrl!} target="_blank" rel="noopener noreferrer">
                                          <Play className="h-4 w-4 mr-2" />
                                          Listen
                                        </a>
                                      </Button>
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={call.recordingUrl!} download={`call_${call.callId}.mp3`}>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
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
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* No Campaigns Found */}
      {!isLoading && campaigns.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No campaigns were found for the specified date range. Try adjusting the date range or check your Ringba
              account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
