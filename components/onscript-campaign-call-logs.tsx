"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Calendar,
  PlayCircle,
  ExternalLink,
  Brain,
  User,
  Clock,
  AlertTriangle,
  MessageSquare,
  Filter,
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  MapPin,
  Building,
  X,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { SimpleWorkingCalendar } from "@/components/simple-working-calendar"
import { OnScriptCallAnalysisModal } from "@/components/onscript-call-analysis-modal"

interface CallLog {
  id: string
  campaignId: string
  campaignName: string
  callerId: string
  calledNumber: string
  startTime: string
  endTime: string | null
  duration: number
  connectedDuration: number
  timeToConnect: number
  status: string
  disposition: string
  direction: string
  recordingUrl: string | null
  hasRecording: boolean
  agentName: string
  publisherName: string
  revenue: number
  payout: number
  cost: number
  profit: number
  endCallSource: string
  quality: string
  tags: string[]
  isTranscribed: boolean
  transcriptionStatus: string
  transcript: string | null
  analysis: any
  metadata: any
  // New fields from RingBA
  hangupDirection: string
  targetName: string
  buyerName: string
  state: string
}

interface FilterState {
  status: string[]
  disposition: string[]
  quality: string[]
  hasRecording: boolean | null
  isTranscribed: boolean | null
  hangupDirection: string[]
  targetName: string[]
  buyerName: string[]
  state: string[]
  publisherName: string[]
  agentName: string[]
  direction: string[]
  minDuration: number | null
  maxDuration: number | null
  minRevenue: number | null
  maxRevenue: number | null
}

interface CPAMetric {
  dimension: string
  value: string
  totalCalls: number
  totalSales: number
  totalRevenue: number
  cpa: number
  conversionRate: number
}

interface OnScriptCampaignCallLogsProps {
  campaignId: string
  campaignName: string
}

export function OnScriptCampaignCallLogs({ campaignId, campaignName }: OnScriptCampaignCallLogsProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showRecordingsOnly, setShowRecordingsOnly] = useState(false)
  const [showTranscribedOnly, setShowTranscribedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  // Add these state variables after the existing state declarations
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [processingCallIds, setProcessingCallIds] = useState<Set<string>>(new Set())

  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  })

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    disposition: [],
    quality: [],
    hasRecording: null,
    isTranscribed: null,
    hangupDirection: [],
    targetName: [],
    buyerName: [],
    state: [],
    publisherName: [],
    agentName: [],
    direction: [],
    minDuration: null,
    maxDuration: null,
    minRevenue: null,
    maxRevenue: null,
  })

  // ✅ REAL-TIME DATE FILTERING: Fetch call logs whenever date range changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to && campaignId) {
      const fromISO = dateRange.from.toISOString()
      const toISO = dateRange.to.toISOString()

      console.log("🔄 Date range or campaign changed, fetching call logs...")
      console.log("📅 New date range:", {
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd"),
        campaignId: campaignId,
        fromISO,
        toISO,
      })
      fetchCallLogs()
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), campaignId]) // ✅ Use ISO strings for proper dependency detection

  const fetchCallLogs = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates to view call logs.",
        variant: "destructive",
      })
      return
    }

    // ✅ PREVENT DOUBLE CALLS: Check if already loading
    if (isLoading) {
      console.log("⚠️ Already loading, skipping duplicate request")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // ✅ PRECISE DATE FORMATTING: Ensure exact date boundaries
      const startDate = new Date(dateRange.from)
      startDate.setHours(0, 0, 0, 0) // Start of day
      const endDate = new Date(dateRange.to)
      endDate.setHours(23, 59, 59, 999) // End of day

      const formattedStartDate = startDate.toISOString()
      const formattedEndDate = endDate.toISOString()

      console.log("🔍 Fetching call logs with precise date filtering:")
      console.log("📅 Campaign ID:", campaignId)
      console.log("📅 Start Date (ISO):", formattedStartDate)
      console.log("📅 End Date (ISO):", formattedEndDate)
      console.log("📅 Date Range (Human):", {
        from: format(dateRange.from, "MMM dd, yyyy"),
        to: format(dateRange.to, "MMM dd, yyyy"),
        days: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      })

      // ✅ EXACT API STRUCTURE: Use your specified request format
      const requestBody = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        filters: {
          CampaignId: [campaignId],
        },
        columns: [
          "callStartTime",
          "callId",
          "callStatus",
          "duration",
          "recordingUrl",
          "callerId",
          "calledNumber",
          "campaignId",
          "campaignName",
          "disposition",
          "buyer",
          "revenue",
          "cost",
          "publisherName",
        ],
        page: 1,
        pageSize: 500,
        sortColumn: "callStartTime",
        sortOrder: "desc",
      }

      console.log("📡 API Request Body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(`/api/ringba/campaigns/${campaignId}/call-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorDetails = errorText

        // Try to parse error response for better error messages
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.troubleshooting) {
            errorDetails = `${errorData.error}\n\nTroubleshooting:\n${JSON.stringify(errorData.troubleshooting, null, 2)}`
          }
        } catch {
          // Keep original error text if not JSON
        }

        throw new Error(`API Error (${response.status}): ${errorDetails.substring(0, 200)}...`)
      }

      const result = await response.json()
      console.log("📡 API Response:", {
        success: result.success,
        dataCount: result.data?.length || 0,
        total: result.total,
        dateRange: result.dateRange,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch call logs")
      }

      // ✅ CLIENT-SIDE DATE FILTERING: Additional safety check
      const callsInDateRange = (result.data || []).filter((call: any) => {
        const callDate = new Date(call.startTime)
        const isInRange = callDate >= startDate && callDate <= endDate

        if (!isInRange) {
          console.log("⚠️ Call outside date range:", {
            callId: call.id,
            callDate: format(callDate, "yyyy-MM-dd HH:mm"),
            expectedRange: `${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`,
          })
        }

        return isInRange
      })

      // Transform the data to match our CallLog interface
      const transformedCallLogs: CallLog[] = callsInDateRange.map((call: any, index: number) => ({
        id: call.id || `call-${index}`,
        campaignId: call.campaignId || campaignId,
        campaignName: call.campaignName || campaignName,
        callerId: call.callerId || "Unknown",
        calledNumber: call.calledNumber || "Unknown",
        startTime: call.startTime,
        endTime: call.endTime || null,
        duration: Number.parseInt(call.duration || "0"),
        connectedDuration: Number.parseInt(call.connectedDuration || "0"),
        timeToConnect: Number.parseInt(call.timeToConnect || "0"),
        status: call.status || "unknown",
        disposition: call.disposition || "unknown",
        direction: call.direction || "inbound",
        recordingUrl: call.recordingUrl || null,
        hasRecording: Boolean(call.hasRecording),
        agentName: call.agentName || "Unknown Agent",
        publisherName: call.publisherName || "Unknown Publisher",
        revenue: Number.parseFloat(call.revenue || "0"),
        payout: Number.parseFloat(call.payout || "0"),
        cost: Number.parseFloat(call.cost || "0"),
        profit: Number.parseFloat(call.profit || "0"),
        endCallSource: call.endCallSource || "unknown",
        quality: call.quality || "unknown",
        tags: call.tags || [],
        isTranscribed: Boolean(call.isTranscribed),
        transcriptionStatus: call.transcriptionStatus || "pending",
        transcript: call.transcript || null,
        analysis: call.analysis || null,
        metadata: call.metadata || {},
        // New fields from RingBA metadata - with better fallbacks
        hangupDirection: call.metadata?.hangupSource || call.metadata?.endCallSource || call.endCallSource || "Unknown",
        targetName: call.metadata?.targetName || call.agentName || "Unknown Target",
        buyerName: call.metadata?.buyerName || call.metadata?.buyer || "Unknown Buyer",
        state: call.metadata?.state || "Unknown State",
      }))

      setCallLogs(transformedCallLogs)
      console.log(`✅ Successfully loaded ${transformedCallLogs.length} call logs for date range`)

      // ✅ ENHANCED FEEDBACK: Show filter info in success message
      const filterInfo = result.filterInfo
      if (filterInfo) {
        toast({
          title: "Call Logs Updated (Recordings Only)",
          description: `Found ${transformedCallLogs.length} calls with recordings from ${format(dateRange.from, "MMM dd")} to ${format(dateRange.to, "MMM dd")}. ${filterInfo.filteredOut > 0 ? `Filtered out ${filterInfo.filteredOut} calls without recordings.` : ""}`,
        })
      } else {
        toast({
          title: "Call Logs Updated",
          description: `Found ${transformedCallLogs.length} calls from ${format(dateRange.from, "MMM dd")} to ${format(dateRange.to, "MMM dd")}.`,
        })
      }

      setIsInitialLoad(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`RingBA API Error: ${errorMessage}`)
      setCallLogs([])
      console.error("❌ Call logs fetch error:", err)

      toast({
        title: "Failed to Load Call Logs",
        description: errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ REAL-TIME DATE CHANGE HANDLER: Immediately update state when dates change
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    console.log("📅 Date range changed:", {
      from: newDateRange?.from ? format(newDateRange.from, "yyyy-MM-dd") : "not set",
      to: newDateRange?.to ? format(newDateRange.to, "yyyy-MM-dd") : "not set",
      hasCompleteRange: !!(newDateRange?.from && newDateRange?.to),
    })

    setDateRange(newDateRange)

    // ✅ IMMEDIATE FEEDBACK: Show loading state when complete date range is set
    if (newDateRange?.from && newDateRange?.to) {
      toast({
        title: "Updating Call Logs",
        description: `Fetching calls with recordings for ${format(newDateRange.from, "MMM dd")} to ${format(newDateRange.to, "MMM dd")}...`,
      })
    }
  }

  const handleDateRangeApply = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates.",
        variant: "destructive",
      })
      return
    }

    console.log("🔄 Manual apply triggered - useEffect should handle this automatically")
    // ✅ REMOVE DOUBLE API CALL: Let useEffect handle the fetch automatically
    // fetchCallLogs() // Commented out to prevent double calls
  }

  // ✅ NEW: Enhanced View Analysis Handler with Auto-Transcription
  const handleViewAnalysis = async (callLog: CallLog) => {
    console.log("👁️ View Analysis clicked for call:", callLog.id)
    console.log("📊 Call current state:", {
      hasRecording: callLog.hasRecording,
      isTranscribed: callLog.isTranscribed,
      hasAnalysis: !!callLog.analysis,
      transcriptionStatus: callLog.transcriptionStatus,
    })

    // If call already has transcript and analysis, show modal immediately
    if (callLog.isTranscribed && callLog.analysis && callLog.transcript) {
      console.log("✅ Call already analyzed, showing modal immediately")
      setSelectedCallLog(callLog)
      setShowAnalysisModal(true)
      return
    }

    // If call has recording but needs transcription/analysis, do it automatically
    if (callLog.hasRecording && callLog.recordingUrl) {
      console.log("🔄 Auto-transcribing and analyzing call in background...")

      // Add call to processing set
      setProcessingCallIds((prev) => new Set(prev).add(callLog.id))

      try {
        // Show immediate feedback
        toast({
          title: "Processing Call Analysis",
          description: "Transcribing and analyzing call in the background. This may take a moment...",
        })

        // Update the call log status to show it's being processed
        setCallLogs((prev) =>
          prev.map((call) => (call.id === callLog.id ? { ...call, transcriptionStatus: "transcribing" } : call)),
        )

        console.log("🎵 Starting auto-transcription for call:", callLog.id)

        const response = await fetch("/api/ringba/transcribe-recording", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recordingUrl: callLog.recordingUrl,
            callId: callLog.id,
            campaignId: callLog.campaignId,
            metadata: {
              callerId: callLog.callerId,
              calledNumber: callLog.calledNumber,
              agentName: callLog.agentName,
              publisherName: callLog.publisherName,
              duration: callLog.duration,
              connectedDuration: callLog.connectedDuration,
              startTime: callLog.startTime,
              endTime: callLog.endTime,
              revenue: callLog.revenue,
              cost: callLog.cost,
              quality: callLog.quality,
            },
          }),
        })

        const result = await response.json()

        if (result.success) {
          // Update the call log with transcription results
          const updatedCallLog = {
            ...callLog,
            isTranscribed: true,
            transcriptionStatus: "completed",
            transcript: result.data?.transcript || result.transcript,
            analysis: result.data?.analysis || result.analysis,
          }

          setCallLogs((prev) => prev.map((call) => (call.id === callLog.id ? updatedCallLog : call)))

          console.log("✅ Auto-transcription completed, opening analysis modal")

          // Show success message
          toast({
            title: "Analysis Complete",
            description: "Call has been transcribed and analyzed successfully.",
          })

          // Open the analysis modal with the updated data
          setSelectedCallLog(updatedCallLog)
          setShowAnalysisModal(true)
        } else {
          throw new Error(result.error || "Auto-transcription failed")
        }
      } catch (err) {
        console.error("❌ Auto-transcription error:", err)

        // Update call status to failed
        setCallLogs((prev) =>
          prev.map((call) => (call.id === callLog.id ? { ...call, transcriptionStatus: "failed" } : call)),
        )

        toast({
          title: "Analysis Failed",
          description: err instanceof Error ? err.message : "Failed to process call analysis",
          variant: "destructive",
        })
      } finally {
        // Remove call from processing set
        setProcessingCallIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(callLog.id)
          return newSet
        })
      }
    } else {
      // No recording available
      toast({
        title: "No Recording Available",
        description: "This call does not have a recording available for analysis.",
        variant: "destructive",
      })
    }
  }

  const handleCloseAnalysisModal = () => {
    console.log("❌ Closing analysis modal")
    setShowAnalysisModal(false)
    setSelectedCallLog(null)
  }

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof CallLog): string[] => {
    const values = callLogs.map((call) => String(call[field])).filter(Boolean)
    return Array.from(new Set(values)).sort()
  }

  // Apply all filters to call logs
  const filteredCallLogs = useMemo(() => {
    return callLogs.filter((call) => {
      // Search term filter
      const matchesSearch =
        !searchTerm ||
        call.callerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.calledNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.publisherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.state.toLowerCase().includes(searchTerm.toLowerCase())

      // Basic filters
      const matchesRecordingFilter = !showRecordingsOnly || call.hasRecording
      const matchesTranscribedFilter = !showTranscribedOnly || call.isTranscribed

      // Advanced filters
      const matchesStatus = filters.status.length === 0 || filters.status.includes(call.status)
      const matchesDisposition = filters.disposition.length === 0 || filters.disposition.includes(call.disposition)
      const matchesQuality = filters.quality.length === 0 || filters.quality.includes(call.quality)
      const matchesHasRecording = filters.hasRecording === null || call.hasRecording === filters.hasRecording
      const matchesIsTranscribed = filters.isTranscribed === null || call.isTranscribed === filters.isTranscribed
      const matchesHangupDirection =
        filters.hangupDirection.length === 0 || filters.hangupDirection.includes(call.hangupDirection)
      const matchesTargetName = filters.targetName.length === 0 || filters.targetName.includes(call.targetName)
      const matchesBuyerName = filters.buyerName.length === 0 || filters.buyerName.includes(call.buyerName)
      const matchesState = filters.state.length === 0 || filters.state.includes(call.state)
      const matchesPublisherName =
        filters.publisherName.length === 0 || filters.publisherName.includes(call.publisherName)
      const matchesAgentName = filters.agentName.length === 0 || filters.agentName.includes(call.agentName)
      const matchesDirection = filters.direction.length === 0 || filters.direction.includes(call.direction)

      // Duration filters
      const matchesMinDuration = filters.minDuration === null || call.duration >= filters.minDuration
      const matchesMaxDuration = filters.maxDuration === null || call.duration <= filters.maxDuration

      // Revenue filters
      const matchesMinRevenue = filters.minRevenue === null || call.revenue >= filters.minRevenue
      const matchesMaxRevenue = filters.maxRevenue === null || call.revenue <= filters.maxRevenue

      return (
        matchesSearch &&
        matchesRecordingFilter &&
        matchesTranscribedFilter &&
        matchesStatus &&
        matchesDisposition &&
        matchesQuality &&
        matchesHasRecording &&
        matchesIsTranscribed &&
        matchesHangupDirection &&
        matchesTargetName &&
        matchesBuyerName &&
        matchesState &&
        matchesPublisherName &&
        matchesAgentName &&
        matchesDirection &&
        matchesMinDuration &&
        matchesMaxDuration &&
        matchesMinRevenue &&
        matchesMaxRevenue
      )
    })
  }, [callLogs, searchTerm, showRecordingsOnly, showTranscribedOnly, filters])

  // Calculate CPA metrics by different dimensions
  const cpaMetrics = useMemo(() => {
    const calculateCPAByDimension = (dimension: keyof CallLog): CPAMetric[] => {
      const groups = filteredCallLogs.reduce(
        (acc, call) => {
          const value = String(call[dimension])
          if (!acc[value]) {
            acc[value] = {
              calls: [],
              totalRevenue: 0,
              totalSales: 0,
            }
          }
          acc[value].calls.push(call)
          acc[value].totalRevenue += call.revenue
          if (call.disposition === "converted" || call.disposition === "sale") {
            acc[value].totalSales += 1
          }
          return acc
        },
        {} as Record<string, { calls: CallLog[]; totalRevenue: number; totalSales: number }>,
      )

      return Object.entries(groups)
        .map(([value, data]) => ({
          dimension: String(dimension),
          value,
          totalCalls: data.calls.length,
          totalSales: data.totalSales,
          totalRevenue: data.totalRevenue,
          cpa: data.totalSales > 0 ? data.totalRevenue / data.totalSales : 0,
          conversionRate: data.calls.length > 0 ? (data.totalSales / data.calls.length) * 100 : 0,
        }))
        .filter((metric) => metric.totalCalls > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
    }

    return {
      byState: calculateCPAByDimension("state"),
      byBuyer: calculateCPAByDimension("buyerName"),
      byTarget: calculateCPAByDimension("targetName"),
      byPublisher: calculateCPAByDimension("publisherName"),
      byAgent: calculateCPAByDimension("agentName"),
      byStatus: calculateCPAByDimension("status"),
      byDisposition: calculateCPAByDimension("disposition"),
      byQuality: calculateCPAByDimension("quality"),
    }
  }, [filteredCallLogs])

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: [],
      disposition: [],
      quality: [],
      hasRecording: null,
      isTranscribed: null,
      hangupDirection: [],
      targetName: [],
      buyerName: [],
      state: [],
      publisherName: [],
      agentName: [],
      direction: [],
      minDuration: null,
      maxDuration: null,
      minRevenue: null,
      maxRevenue: null,
    })
    setSearchTerm("")
    setShowRecordingsOnly(false)
    setShowTranscribedOnly(false)
  }

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.disposition.length > 0) count++
    if (filters.quality.length > 0) count++
    if (filters.hasRecording !== null) count++
    if (filters.isTranscribed !== null) count++
    if (filters.hangupDirection.length > 0) count++
    if (filters.targetName.length > 0) count++
    if (filters.buyerName.length > 0) count++
    if (filters.state.length > 0) count++
    if (filters.publisherName.length > 0) count++
    if (filters.agentName.length > 0) count++
    if (filters.direction.length > 0) count++
    if (filters.minDuration !== null) count++
    if (filters.maxDuration !== null) count++
    if (filters.minRevenue !== null) count++
    if (filters.maxRevenue !== null) count++
    if (searchTerm) count++
    if (showRecordingsOnly) count++
    if (showTranscribedOnly) count++
    return count
  }, [filters, searchTerm, showRecordingsOnly, showTranscribedOnly])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getTranscriptionStatusBadge = (status: string, isProcessing = false) => {
    if (isProcessing) {
      return (
        <Badge className="bg-blue-500 text-white">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing...
        </Badge>
      )
    }

    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white">✅ Analyzed</Badge>
      case "transcribing":
        return (
          <Badge className="bg-blue-500 text-white">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing...
          </Badge>
        )
      case "failed":
        return <Badge className="bg-red-500 text-white">❌ Failed</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">⏳ Ready</Badge>
    }
  }

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "excellent":
        return <Badge className="bg-green-500 text-white">⭐ Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-500 text-white">👍 Good</Badge>
      case "fair":
        return <Badge className="bg-yellow-500 text-white">⚠️ Fair</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">❓ Unknown</Badge>
    }
  }

  const getHangupDirectionBadge = (direction: string) => {
    const lowerDirection = direction.toLowerCase()
    if (lowerDirection.includes("target") || lowerDirection.includes("agent")) {
      return <Badge className="bg-red-100 text-red-800">🎯 Target</Badge>
    } else if (lowerDirection.includes("caller") || lowerDirection.includes("customer")) {
      return <Badge className="bg-blue-100 text-blue-800">📞 Caller</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">❓ {direction}</Badge>
    }
  }

  // Calculate statistics
  const totalCalls = callLogs.length
  const recordedCalls = callLogs.filter((call) => call.hasRecording).length
  const transcribedCalls = callLogs.filter((call) => call.isTranscribed).length
  const totalRevenue = callLogs.reduce((sum, call) => sum + call.revenue, 0)

  // Add this after the statistics calculation with better debugging
  const dateRangeInfo =
    dateRange?.from && dateRange?.to
      ? {
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to, "yyyy-MM-dd"),
          daysDifference: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1,
          fromISO: dateRange.from.toISOString(),
          toISO: dateRange.to.toISOString(),
        }
      : null

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/onscript/campaigns")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Call Logs & Analytics</h1>
            <p className="text-gray-600">
              Campaign: <span className="font-medium">{campaignName}</span> (ID: {campaignId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SimpleWorkingCalendar
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange} // ✅ Real-time date change
            onApply={handleDateRangeApply}
            isLoading={isLoading}
          />
          <Button variant="outline" onClick={fetchCallLogs} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ✅ ENHANCED DATE RANGE INFO: Shows real-time filtering status */}
      {dateRangeInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                Real-time filtering: {dateRangeInfo.startDate} to {dateRangeInfo.endDate} (
                {dateRangeInfo.daysDifference} days)
              </span>
              {isLoading && (
                <Badge className="bg-blue-500 text-white animate-pulse">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Campaign: {campaignId}
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {totalCalls} total calls
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-300">
                {recordedCalls} with recordings
              </Badge>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                {transcribedCalls} analyzed
              </Badge>
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {formatCurrency(totalRevenue)} revenue
              </Badge>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            ✅ Call logs update automatically when you change the date range • Click "View Analysis" for instant AI
            analysis
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="call-logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="call-logs" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Call Logs ({filteredCallLogs.length})
          </TabsTrigger>
          <TabsTrigger value="cpa-analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            CPA Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="call-logs" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by phone number, agent, publisher, target, buyer, or state..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showRecordingsOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRecordingsOnly(!showRecordingsOnly)}
                    className="flex items-center gap-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Recordings Only
                  </Button>
                  <Button
                    variant={showTranscribedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowTranscribedOnly(!showTranscribedOnly)}
                    className="flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    Analyzed Only
                  </Button>
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1 bg-red-500 text-white text-xs">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={filters.status.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, status: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          {getUniqueValues("status").map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Disposition Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Disposition</label>
                      <Select
                        value={filters.disposition.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, disposition: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Dispositions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dispositions</SelectItem>
                          {getUniqueValues("disposition").map((disposition) => (
                            <SelectItem key={disposition} value={disposition}>
                              {disposition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* State Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">State</label>
                      <Select
                        value={filters.state.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, state: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All States" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All States</SelectItem>
                          {getUniqueValues("state").map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Publisher Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Publisher</label>
                      <Select
                        value={filters.publisherName.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, publisherName: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Publishers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Publishers</SelectItem>
                          {getUniqueValues("publisherName").map((publisher) => (
                            <SelectItem key={publisher} value={publisher}>
                              {publisher}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Target Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target</label>
                      <Select
                        value={filters.targetName.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, targetName: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Targets" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Targets</SelectItem>
                          {getUniqueValues("targetName").map((target) => (
                            <SelectItem key={target} value={target}>
                              {target}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Buyer Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Buyer</label>
                      <Select
                        value={filters.buyerName.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, buyerName: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Buyers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Buyers</SelectItem>
                          {getUniqueValues("buyerName").map((buyer) => (
                            <SelectItem key={buyer} value={buyer}>
                              {buyer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quality Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quality</label>
                      <Select
                        value={filters.quality.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, quality: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Quality</SelectItem>
                          {getUniqueValues("quality").map((quality) => (
                            <SelectItem key={quality} value={quality}>
                              {quality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hangup Direction Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Hangup Direction</label>
                      <Select
                        value={filters.hangupDirection.join(",")}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, hangupDirection: value ? value.split(",") : [] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Hangup" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Hangup</SelectItem>
                          {getUniqueValues("hangupDirection").map((direction) => (
                            <SelectItem key={direction} value={direction}>
                              {direction}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Numeric Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Min Duration (seconds)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minDuration || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minDuration: e.target.value ? Number.parseInt(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Duration (seconds)</label>
                      <Input
                        type="number"
                        placeholder="∞"
                        value={filters.maxDuration || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxDuration: e.target.value ? Number.parseInt(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Min Revenue ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={filters.minRevenue || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minRevenue: e.target.value ? Number.parseFloat(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Revenue ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="∞"
                        value={filters.maxRevenue || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxRevenue: e.target.value ? Number.parseFloat(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Boolean Filters */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasRecording"
                        checked={filters.hasRecording === true}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, hasRecording: checked ? true : null }))
                        }
                      />
                      <label htmlFor="hasRecording" className="text-sm font-medium">
                        Has Recording Only
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isTranscribed"
                        checked={filters.isTranscribed === true}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, isTranscribed: checked ? true : null }))
                        }
                      />
                      <label htmlFor="isTranscribed" className="text-sm font-medium">
                        Analyzed Only
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Failed to Load Call Logs</AlertTitle>
              <AlertDescription className="text-red-700 whitespace-pre-wrap">{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Data State */}
          {!error && !isLoading && filteredCallLogs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No call logs found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {totalCalls === 0
                    ? `This campaign doesn't have any call logs for ${dateRangeInfo?.startDate} to ${dateRangeInfo?.endDate}.`
                    : "No calls match your current search and filter criteria."}
                </p>
                {totalCalls === 0 ? (
                  <Button onClick={fetchCallLogs} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Different Date Range
                  </Button>
                ) : (
                  <Button onClick={clearAllFilters} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Call Logs List */}
          {!isLoading && filteredCallLogs.length > 0 && (
            <div className="space-y-4">
              {filteredCallLogs.map((callLog) => {
                const isProcessing = processingCallIds.has(callLog.id)

                return (
                  <Card key={callLog.id} className="border border-gray-200 hover:border-purple-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {callLog.callerId} → {callLog.calledNumber}
                            </h4>
                            <Badge variant={callLog.direction === "inbound" ? "default" : "secondary"}>
                              {callLog.direction}
                            </Badge>
                            {callLog.hasRecording && (
                              <Badge className="bg-green-100 text-green-800">
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Recording
                              </Badge>
                            )}
                            {getQualityBadge(callLog.quality)}
                            {getTranscriptionStatusBadge(callLog.transcriptionStatus, isProcessing)}
                            {getHangupDirectionBadge(callLog.hangupDirection)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{callLog.agentName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {Math.floor(callLog.duration / 60)}:
                                {(callLog.duration % 60).toString().padStart(2, "0")}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Status:</span> {callLog.status}
                            </div>
                            <div>
                              <span className="font-medium">Started:</span>{" "}
                              {format(new Date(callLog.startTime), "MMM dd, HH:mm")}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-medium">Connected:</span>{" "}
                              {Math.floor(callLog.connectedDuration / 60)}:
                              {(callLog.connectedDuration % 60).toString().padStart(2, "0")}
                            </div>
                            <div>
                              <span className="font-medium">Time to Connect:</span> {callLog.timeToConnect}s
                            </div>
                            <div>
                              <span className="font-medium">Revenue:</span> {formatCurrency(callLog.revenue)}
                            </div>
                            <div>
                              <span className="font-medium">Publisher:</span> {callLog.publisherName}
                            </div>
                          </div>

                          {/* New additional fields row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Target:</span> {callLog.targetName}
                            </div>
                            <div>
                              <span className="font-medium">Buyer:</span> {callLog.buyerName}
                            </div>
                            <div>
                              <span className="font-medium">State:</span> {callLog.state}
                            </div>
                            <div>
                              <span className="font-medium">Hangup:</span> {callLog.hangupDirection}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-6">
                          {/* ✅ SIMPLIFIED: Always show "View Analysis" button */}
                          {callLog.hasRecording ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleViewAnalysis(callLog)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  View Analysis
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              No Recording
                            </Button>
                          )}

                          {callLog.recordingUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={callLog.recordingUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Play Recording
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Results Summary */}
          {!isLoading && filteredCallLogs.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {filteredCallLogs.length} of {totalCalls} calls
              {searchTerm && ` matching "${searchTerm}"`}
              {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter(s) applied`}
              {dateRangeInfo && ` from ${dateRangeInfo.startDate} to ${dateRangeInfo.endDate}`}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cpa-analytics" className="space-y-6">
          {/* CPA Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall CPA Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall CPA</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalSales = filteredCallLogs.filter(
                      (call) => call.disposition === "converted" || call.disposition === "sale",
                    ).length
                    const totalRevenue = filteredCallLogs.reduce((sum, call) => sum + call.revenue, 0)
                    const overallCPA = totalSales > 0 ? totalRevenue / totalSales : 0
                    return formatCurrency(overallCPA)
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {
                    filteredCallLogs.filter((call) => call.disposition === "converted" || call.disposition === "sale")
                      .length
                  }{" "}
                  sales from {filteredCallLogs.length} calls
                </p>
              </CardContent>
            </Card>

            {/* Total Revenue Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(filteredCallLogs.reduce((sum, call) => sum + call.revenue, 0))}
                </div>
                <p className="text-xs text-muted-foreground">From {filteredCallLogs.length} calls</p>
              </CardContent>
            </Card>

            {/* Conversion Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalSales = filteredCallLogs.filter(
                      (call) => call.disposition === "converted" || call.disposition === "sale",
                    ).length
                    const conversionRate =
                      filteredCallLogs.length > 0 ? (totalSales / filteredCallLogs.length) * 100 : 0
                    return `${conversionRate.toFixed(1)}%`
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {
                    filteredCallLogs.filter((call) => call.disposition === "converted" || call.disposition === "sale")
                      .length
                  }{" "}
                  / {filteredCallLogs.length} calls
                </p>
              </CardContent>
            </Card>

            {/* Average Call Duration Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const avgDuration =
                      filteredCallLogs.length > 0
                        ? filteredCallLogs.reduce((sum, call) => sum + call.duration, 0) / filteredCallLogs.length
                        : 0
                    return `${Math.floor(avgDuration / 60)}:${(Math.floor(avgDuration) % 60).toString().padStart(2, "0")}`
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Minutes:Seconds</p>
              </CardContent>
            </Card>
          </div>

          {/* CPA by Dimension Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPA by State */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  CPA by State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cpaMetrics.byState.slice(0, 10).map((metric, index) => (
                    <div key={metric.value} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(metric.cpa)}</div>
                        <div className="text-xs text-gray-500">
                          {metric.totalSales} sales / {metric.totalCalls} calls ({metric.conversionRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CPA by Buyer */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  CPA by Buyer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cpaMetrics.byBuyer.slice(0, 10).map((metric, index) => (
                    <div key={metric.value} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(metric.cpa)}</div>
                        <div className="text-xs text-gray-500">
                          {metric.totalSales} sales / {metric.totalCalls} calls ({metric.conversionRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CPA by Target */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  CPA by Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cpaMetrics.byTarget.slice(0, 10).map((metric, index) => (
                    <div key={metric.value} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(metric.cpa)}</div>
                        <div className="text-xs text-gray-500">
                          {metric.totalSales} sales / {metric.totalCalls} calls ({metric.conversionRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CPA by Publisher */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  CPA by Publisher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cpaMetrics.byPublisher.slice(0, 10).map((metric, index) => (
                    <div key={metric.value} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(metric.cpa)}</div>
                        <div className="text-xs text-gray-500">
                          {metric.totalSales} sales / {metric.totalCalls} calls ({metric.conversionRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CPA by Quality */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  CPA by Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cpaMetrics.byQuality.slice(0, 10).map((metric, index) => (
                    <div key={metric.value} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(metric.cpa)}</div>
                        <div className="text-xs text-gray-500">
                          {metric.totalSales} sales / {metric.totalCalls} calls ({metric.conversionRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CPA by Disposition */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  CPA by Disposition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cpaMetrics.byDisposition.slice(0, 10).map((metric, index) => (
                    <div key={metric.value} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(metric.cpa)}</div>
                        <div className="text-xs text-gray-500">
                          {metric.totalSales} sales / {metric.totalCalls} calls ({metric.conversionRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CPA Formula Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                CPA Calculation Formula
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-blue-800 mb-2">
                    CPA = Total Revenue ÷ Number of Sales
                  </div>
                  <p className="text-sm text-blue-600">
                    Cost Per Acquisition measures how much revenue is generated per successful sale.
                    <br />
                    Sales are identified by calls with disposition "converted" or "sale".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Modal */}
      {showAnalysisModal && selectedCallLog && (
        <OnScriptCallAnalysisModal
          callLog={{
            id: selectedCallLog.id,
            campaignId: selectedCallLog.campaignId,
            campaignName: selectedCallLog.campaignName,
            callId: selectedCallLog.id,
            agentName: selectedCallLog.agentName,
            customerPhone: selectedCallLog.callerId,
            direction: selectedCallLog.direction as "inbound" | "outbound",
            duration: selectedCallLog.duration,
            startTime: selectedCallLog.startTime,
            endTime: selectedCallLog.endTime || selectedCallLog.startTime,
            status: selectedCallLog.status,
            disposition: selectedCallLog.disposition,
            hasRecording: selectedCallLog.hasRecording,
            recordingUrl: selectedCallLog.recordingUrl,
            hasTranscription: selectedCallLog.isTranscribed,
            hasAnalysis: !!selectedCallLog.analysis,
            transcript: selectedCallLog.transcript,
            analysis: selectedCallLog.analysis,
            metadata: selectedCallLog.metadata,
            revenue: selectedCallLog.revenue,
          }}
          onClose={handleCloseAnalysisModal}
          open={showAnalysisModal}
        />
      )}
    </div>
  )
}
