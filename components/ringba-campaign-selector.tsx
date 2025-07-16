"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import { format, subDays } from "date-fns"
import {
  Phone,
  Calendar,
  AlertCircle,
  RefreshCw,
  Play,
  Download,
  Mic,
  Clock,
  User,
  ArrowRight,
  PhoneCall,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

interface Campaign {
  id: string
  name: string
  status: string
  callCount?: number
  revenue?: number
  conversionRate?: number
  lastCallDate?: string
  trackingNumbers?: number
}

interface CallLog {
  id: string
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
  campaignId: string
  transcriptionStatus: "pending" | "processing" | "completed" | "failed"
  revenue?: number
  cost?: number
  tags?: string[]
}

export function RingbaCampaignSelector() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [isLoadingCallLogs, setIsLoadingCallLogs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 14),
    to: new Date(),
  })
  const [processingCall, setProcessingCall] = useState<string | null>(null)
  const [transcriptionResults, setTranscriptionResults] = useState<Record<string, any>>({})
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean
    method: string
    dataSource: string
    accountId?: string
  }>({
    isConnected: false,
    method: "Unknown",
    dataSource: "Unknown",
  })

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true)
    setError(null)

    try {
      console.log("Fetching real campaigns from Ringba API...")

      const response = await fetch("/api/ringba/fetch-campaigns")
      const result = await response.json()

      console.log("Campaigns API response:", result)

      if (!result.success) {
        // Provide specific error messages based on status
        if (result.status === 401) {
          setError(
            "Authentication failed. Please verify your RINGBA_API_KEY is correct. " +
              "Check the /ringba-campaigns page to see if it works there.",
          )
        } else if (result.status === 404) {
          setError(
            "Account not found. Please verify your RINGBA_ACCOUNT_ID is correct. " +
              "Check the /ringba-campaigns page to see if it works there.",
          )
        } else {
          setError(`API Error: ${result.error}. Status: ${result.status}`)
        }

        setApiStatus({
          isConnected: false,
          method: "Failed",
          dataSource: "Error",
        })
        return
      }

      // Successfully fetched campaigns
      setCampaigns(result.data || [])
      setApiStatus({
        isConnected: true,
        method: result.method || "Bearer Token",
        dataSource: result.dataSource || "RINGBA_API",
        accountId: result.accountId,
      })

      // If there are campaigns, select the first one by default
      if (result.data && result.data.length > 0) {
        setSelectedCampaign(result.data[0])
        setError(null)
      } else {
        setError("No campaigns found in your Ringba account.")
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}. ` +
          "Please check your internet connection and API configuration.",
      )
      setApiStatus({
        isConnected: false,
        method: "Network Error",
        dataSource: "Error",
      })
    } finally {
      setIsLoadingCampaigns(false)
    }
  }

  const fetchCallLogs = async () => {
    if (!selectedCampaign) {
      setError("Please select a campaign first")
      return
    }

    if (!dateRange?.from) {
      setError("Please select a date range")
      return
    }

    setIsLoadingCallLogs(true)
    setError(null)
    setCallLogs([])

    try {
      console.log("Fetching call logs for campaign:", selectedCampaign.id)

      const response = await fetch("/api/ringba/fetch-call-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to ? dateRange.to.toISOString() : new Date().toISOString(),
        }),
      })

      const result = await response.json()

      console.log("Call logs response:", result)

      if (!result.success) {
        if (result.status === 401) {
          throw new Error("Unauthorized: Invalid API key. Please check your Ringba API credentials.")
        } else if (result.status === 404) {
          throw new Error("Resource not found: Invalid account ID or campaign ID.")
        } else {
          throw new Error(result.error || "Failed to fetch call logs from Ringba API")
        }
      }

      setCallLogs(result.data || [])

      if (result.data && result.data.length === 0) {
        setError(
          `No call logs found for campaign "${selectedCampaign.name}" in the selected date range. ` +
            "Try extending the date range or check if the campaign has any calls with recordings.",
        )
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred while fetching call logs")
      console.error("Error fetching call logs:", error)
    } finally {
      setIsLoadingCallLogs(false)
    }
  }

  const handleCampaignChange = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId)
    if (campaign) {
      setSelectedCampaign(campaign)
      setCallLogs([]) // Clear previous call logs
      setError(null) // Clear any previous errors
    }
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  const handleTranscribeCall = async (call: CallLog) => {
    if (!call.recordingUrl) {
      setError("No recording URL available for this call")
      return
    }

    setProcessingCall(call.id)

    // Update call status to processing
    setCallLogs((prev) =>
      prev.map((c) => (c.id === call.id ? { ...c, transcriptionStatus: "processing" as const } : c)),
    )

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl: call.recordingUrl,
          callId: call.id,
          metadata: {
            callerId: call.callerId,
            calledNumber: call.calledNumber,
            duration: call.duration,
            startTime: call.startTime,
            agentName: call.agentName,
            campaignId: call.campaignId,
          },
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Transcription failed")
      }

      // Update call status to completed
      setCallLogs((prev) =>
        prev.map((c) => (c.id === call.id ? { ...c, transcriptionStatus: "completed" as const } : c)),
      )

      // Store transcription results
      setTranscriptionResults((prev) => ({
        ...prev,
        [call.id]: {
          transcript: result.data.transcript,
          analysis: result.data.analysis,
        },
      }))

      // Show success message
      alert(`Call ${call.id} transcribed successfully!`)
    } catch (error) {
      console.error("Transcription error:", error)

      // Update call status to failed
      setCallLogs((prev) => prev.map((c) => (c.id === call.id ? { ...c, transcriptionStatus: "failed" as const } : c)))

      setError(error instanceof Error ? error.message : "Transcription failed")
    } finally {
      setProcessingCall(null)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm:ss")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      case "abandoned":
        return <Badge className="bg-red-500 text-white">Abandoned</Badge>
      case "missed":
        return <Badge className="bg-yellow-500 text-white">Missed</Badge>
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500 text-white">Inactive</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>
    }
  }

  const getTranscriptionStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Transcribed
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
        return <Badge className="bg-gray-500 text-white">Not Transcribed</Badge>
    }
  }

  const getApiStatusBadge = () => {
    if (apiStatus.isConnected && apiStatus.dataSource === "RINGBA_API") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Live API
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PhoneCall className="h-8 w-8 text-blue-600" />
            Ringba Call Logs Explorer
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600">
              Account: {apiStatus.accountId || "Loading..."} • Method: {apiStatus.method}
            </p>
            {getApiStatusBadge()}
          </div>
        </div>
      </div>

      {/* API Status Alert */}
      {apiStatus.dataSource !== "RINGBA_API" && campaigns.length === 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>API Connection Failed:</strong> Unable to fetch real campaigns from Ringba API. Please check your
            API credentials and try the{" "}
            <a href="/ringba-campaigns" className="underline font-medium">
              /ringba-campaigns
            </a>{" "}
            page to verify your setup.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {apiStatus.isConnected && apiStatus.dataSource === "RINGBA_API" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Connected to Ringba API:</strong> Successfully fetched {campaigns.length} real campaigns from your
            account.
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Selector and Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Select Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCampaigns ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <Select
                  value={selectedCampaign?.id}
                  onValueChange={handleCampaignChange}
                  disabled={campaigns.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{campaign.name}</span>
                          <span className="text-xs text-gray-500">
                            {campaign.callCount} calls • {getStatusBadge(campaign.status)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Campaign Details */}
                {selectedCampaign && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Campaign Details</span>
                      {getStatusBadge(selectedCampaign.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{selectedCampaign.callCount || 0} calls</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{formatCurrency(selectedCampaign.revenue || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{selectedCampaign.trackingNumbers || 0} numbers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {selectedCampaign.lastCallDate
                            ? format(new Date(selectedCampaign.lastCallDate), "MMM dd")
                            : "No calls"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {campaigns.length === 0 && !error && (
                  <p className="text-sm text-gray-600 mt-2">No campaigns found in your account</p>
                )}

                <div className="mt-4">
                  <Button
                    onClick={fetchCampaigns}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingCampaigns}
                    className="w-full"
                  >
                    {isLoadingCampaigns ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Campaigns
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onApply={fetchCallLogs}
              isLoading={isLoadingCallLogs}
            />
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p>{error}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/ringba-campaigns", "_blank")}
                  className="text-xs"
                >
                  🔍 Check /ringba-campaigns
                </Button>
                <Button variant="outline" size="sm" onClick={fetchCampaigns} className="text-xs">
                  🔄 Retry
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Call Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Logs
            </div>
            {selectedCampaign && (
              <Badge variant="outline" className="text-blue-600">
                {selectedCampaign.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCallLogs ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
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
          ) : callLogs.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Call Logs Found</h3>
              <p className="text-gray-600 mb-6">
                {selectedCampaign
                  ? "No call logs found for the selected campaign and date range. Try extending the date range."
                  : "Please select a campaign and date range to fetch call logs."}
              </p>
              {selectedCampaign && (
                <Button onClick={fetchCallLogs} disabled={isLoadingCallLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing {callLogs.length} call logs • {callLogs.filter((call) => call.hasRecording).length} with
                  recordings
                </p>
                <Button onClick={fetchCallLogs} variant="outline" size="sm" disabled={isLoadingCallLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {callLogs.map((call) => (
                <Card key={call.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">Call {call.id}</h4>
                          <Badge variant={call.direction === "inbound" ? "default" : "secondary"}>
                            {call.direction}
                          </Badge>
                          {getStatusBadge(call.status)}
                          {call.hasRecording && (
                            <Badge className="bg-green-100 text-green-800">
                              <Play className="h-3 w-3 mr-1" />
                              Recording
                            </Badge>
                          )}
                          {getTranscriptionStatusBadge(call.transcriptionStatus)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Agent:</span> {call.agentName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Duration:</span> {formatDuration(call.duration)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span className="font-medium">From:</span> {call.callerId}
                          </div>
                          <div className="flex items-center gap-1">
                            <ArrowRight className="h-4 w-4" />
                            <span className="font-medium">To:</span> {call.calledNumber}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            <span className="font-medium">Time:</span> {formatDate(call.startTime)}
                          </span>
                          <span className="text-gray-600">
                            <span className="font-medium">Disposition:</span> {call.disposition}
                          </span>
                          {call.revenue && call.revenue > 0 && (
                            <span className="text-green-600">
                              <span className="font-medium">Revenue:</span> {formatCurrency(call.revenue)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        {call.hasRecording && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleTranscribeCall(call)}
                              disabled={processingCall === call.id || call.transcriptionStatus === "processing"}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {processingCall === call.id || call.transcriptionStatus === "processing" ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Transcribing...
                                </>
                              ) : call.transcriptionStatus === "completed" ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  View Analysis
                                </>
                              ) : (
                                <>
                                  <Mic className="h-4 w-4 mr-2" />
                                  Transcribe with AI
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
                              <a href={call.recordingUrl!} download>
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
      </Card>
    </div>
  )
}
