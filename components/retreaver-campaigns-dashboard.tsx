"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Phone,
  Calendar,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Search,
  Play,
  FileText,
  Info,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CompactDateRangePicker } from "@/components/compact-date-range-picker"

interface RetreaverCampaign {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
  total_calls: number
  description?: string
  tracking_number?: string
}

interface RetreaverCall {
  id: string
  campaignId: string
  campaignName: string
  callId: string
  agentName: string
  customerPhone: string
  direction: "inbound" | "outbound"
  duration: number
  startTime: string
  endTime: string
  status: string
  disposition: string
  hasRecording: boolean
  recordingUrl?: string
  hasTranscription: boolean
  hasAnalysis: boolean
  revenue?: number
  cost?: number
  trackingNumber?: string
  metadata: any
}

export default function RetreaverCampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<RetreaverCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<RetreaverCampaign | null>(null)
  const [callLogs, setCallLogs] = useState<RetreaverCall[]>([])
  const [isLoadingCalls, setIsLoadingCalls] = useState(false)
  const [callsError, setCallsError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [showCallLogs, setShowCallLogs] = useState(false)
  const [isApplyingDateFilter, setIsApplyingDateFilter] = useState(false)
  const [apiDetails, setApiDetails] = useState<any>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("📞 Fetching Retreaver campaigns...")
      const response = await fetch("/api/retreaver/campaigns")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch campaigns")
      }

      setCampaigns(result.campaigns || [])
      console.log(`✅ Loaded ${result.campaigns?.length || 0} Retreaver campaigns`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewCallLogs = (campaign: RetreaverCampaign) => {
    console.log("👁️ Opening call logs for campaign:", campaign.name)
    setSelectedCampaign(campaign)
    setShowCallLogs(true)
    setCallLogs([])
    setCallsError(null)
    setDateRange(undefined)
    setApiDetails(null)
  }

  const handleDateRangeApply = async () => {
    if (!selectedCampaign || !dateRange?.from || !dateRange?.to) {
      setCallsError("Please select a date range to fetch call logs")
      return
    }

    setIsApplyingDateFilter(true)
    setIsLoadingCalls(true)
    setCallsError(null)

    try {
      // Format dates to RFC3339 format
      const startDate = formatToRFC3339(dateRange.from, false)
      const endDate = formatToRFC3339(dateRange.to, true)

      console.log("📅 Fetching call logs with date range:", {
        campaignId: selectedCampaign.id,
        startDate,
        endDate,
      })

      const response = await fetch(
        `/api/retreaver/v2/calls?campaign_id=${selectedCampaign.id}&created_at_start=${encodeURIComponent(
          startDate,
        )}&created_at_end=${encodeURIComponent(endDate)}&page=1`,
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch call logs")
      }

      setCallLogs(result.data || [])
      setApiDetails({
        apiUrl: result.apiUrl,
        dateRange: result.dateRange,
        pagination: result.pagination,
      })

      console.log(`✅ Loaded ${result.data?.length || 0} call logs for campaign ${selectedCampaign.name}`)
    } catch (err) {
      setCallsError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoadingCalls(false)
      setIsApplyingDateFilter(false)
    }
  }

  const formatToRFC3339 = (date: Date, isEndOfDay = false): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    if (isEndOfDay) {
      return `${year}-${month}-${day}T23:59:59+00:00`
    } else {
      return `${year}-${month}-${day}T00:00:00+00:00`
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500 text-white">Inactive</Badge>
      case "paused":
        return <Badge className="bg-yellow-500 text-white">Paused</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDirectionBadge = (direction: string) => {
    return direction === "inbound" ? (
      <Badge className="bg-green-500 text-white">📞 Inbound</Badge>
    ) : (
      <Badge className="bg-blue-500 text-white">📱 Outbound</Badge>
    )
  }

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const CallLogsLoadingSkeleton = () => (
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

  if (showCallLogs && selectedCampaign) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" size="sm" onClick={() => setShowCallLogs(false)} className="mb-2">
              ← Back to Campaigns
            </Button>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="h-6 w-6 text-blue-600" />
              Call Logs - {selectedCampaign.name}
            </h3>
            <p className="text-gray-600 text-sm">
              Campaign ID: {selectedCampaign.id} • Status: {selectedCampaign.status}
            </p>
            <p className="text-xs text-blue-600 mt-1">✅ Using Retreaver V2 API with RFC3339 date filtering</p>
          </div>
        </div>

        {/* Date Range Filter - Required for V2 API */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />📞 Call Logs with Recordings
              <Badge className="bg-blue-600 text-white text-xs">V2 API</Badge>
            </CardTitle>
            <p className="text-sm text-blue-700">
              Click "View Call Logs" to see actual calls with recordings and date filtering. Date range is required for
              the V2 API.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CompactDateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  onApply={handleDateRangeApply}
                  isLoading={isApplyingDateFilter}
                />
              </div>
              {dateRange?.from && dateRange?.to && (
                <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                  <strong>RFC3339 Range:</strong>
                  <br />
                  Start: {formatToRFC3339(dateRange.from, false)}
                  <br />
                  End: {formatToRFC3339(dateRange.to, true)}
                </div>
              )}
            </div>

            {apiDetails && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">API Details</span>
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>
                    <strong>Endpoint:</strong> {apiDetails.apiUrl}
                  </div>
                  <div>
                    <strong>Results:</strong> {apiDetails.pagination?.totalCalls || 0} calls found
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Logs Error */}
        {callsError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error loading call logs:</strong> {callsError}
            </AlertDescription>
          </Alert>
        )}

        {/* Call Logs List */}
        {isLoadingCalls ? (
          <CallLogsLoadingSkeleton />
        ) : !dateRange?.from || !dateRange?.to ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-blue-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Date Range Required</h3>
              <p className="text-gray-500">
                The Retreaver V2 API requires a specific date range. Please select start and end dates above to fetch
                call logs.
              </p>
            </CardContent>
          </Card>
        ) : callLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No call logs found</h3>
              <p className="text-gray-500">
                No calls found for campaign "{selectedCampaign.name}" in the selected date range.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Showing {callLogs.length} call logs for the selected date range</p>
            </div>

            {callLogs.map((call) => (
              <Card key={call.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">Call {call.callId}</h4>
                        {getDirectionBadge(call.direction)}
                        {call.hasRecording && <Badge variant="outline">🎵 Recording</Badge>}
                        {call.hasTranscription && (
                          <Badge variant="outline" className="text-green-600">
                            📝 Transcribed
                          </Badge>
                        )}
                        {call.revenue && call.revenue > 0 && (
                          <Badge variant="outline" className="text-green-600">
                            💰 {formatCurrency(call.revenue)}
                          </Badge>
                        )}
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
                          <span className="font-medium">Customer:</span> {call.customerPhone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Time:</span> {format(new Date(call.startTime), "MMM dd, HH:mm")}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          <span className="font-medium">Status:</span> {call.status}
                        </span>
                        <span className="text-gray-600">
                          <span className="font-medium">Disposition:</span> {call.disposition}
                        </span>
                        {call.trackingNumber && (
                          <span className="text-gray-600">
                            <span className="font-medium">Tracking:</span> {call.trackingNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-6">
                      {call.hasRecording && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={call.recordingUrl!} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Listen
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">🎯 Retreaver Campaigns</h3>
          <p className="text-gray-600 text-sm">
            Campaigns ({campaigns.length}) • {campaigns.filter((c) => c.status === "active").length} active •{" "}
            {campaigns.filter((c) => c.status === "inactive").length} inactive
          </p>
          <p className="text-xs text-green-600 mt-1">✅ Connected to Retreaver API</p>
        </div>
        <Button onClick={fetchCampaigns} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error State */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Failed to load campaigns:</strong> {error}
              </div>
              <Button variant="outline" size="sm" onClick={fetchCampaigns}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Campaigns Grid */}
      {!isLoading && !error && (
        <>
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-gray-500">
                  {campaigns.length === 0
                    ? "No campaigns available in your Retreaver account."
                    : "No campaigns match your search criteria."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg font-semibold text-gray-900">{campaign.name}</CardTitle>
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-gray-600">ID: {campaign.id}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Created:</span>
                          <span>{format(new Date(campaign.created_at), "MMM dd, yyyy, HH:mm a")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Updated:</span>
                          <span>{format(new Date(campaign.updated_at), "MMM dd, yyyy, HH:mm a")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Total Calls:</span>
                          <span className="font-medium">{campaign.total_calls}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleViewCallLogs(campaign)}
                          className="bg-black hover:bg-gray-800 text-white w-full"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          View Call Logs
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://app.retreaver.com/campaigns/${campaign.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Retreaver
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
