"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  PlusIcon,
  Download,
  Search,
  Settings,
  AlertTriangle,
  Brain,
  PlayCircle,
  ExternalLink,
  Clock,
  Target,
  MessageSquare,
  User,
  RefreshCw,
  Play,
  Calendar,
  Activity,
  Key,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { SimpleWorkingCalendar } from "@/components/simple-working-calendar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CampaignCreationModal, type CampaignCreated } from "@/components/campaign-creation-modal"
import { CampaignExportModal } from "@/components/campaign-export-modal"
import { OnScriptActionButtons } from "@/components/onscript-action-buttons"
import RingbaPixelSetup from "@/components/ringba-pixel-setup"
import { ApiKeyManagementModal } from "@/components/api-key-management-modal"
import { useAuth } from "@/contexts/auth-context"

interface Campaign {
  id: string
  campaign_name: string
  average_score: number
  total_calls: number
  qc_approved: number
  qc_rejected: number
  completed_calls: number
  skipped_calls: number
  audio_duration: number
  created_at: string
  status: "active" | "paused" | "completed"
  color: string
}

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
}

interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

interface MetricsSummary {
  totalAverageScore: number
  accountHours: number
  totalCalls: number
  avgCallDuration: number
  commissionable: number
  cpa: number
  revenue: number
  skipped: number
  completed: number
  qcApproved: number
  qcRejected: number
}

interface RealTakeaway {
  category: "Positive" | "Opportunity" | "Concern" | "Action Required" | "Improvement"
  takeaway: string
  impact: "High" | "Medium" | "Low"
  confidence: number
  source: "transcript" | "analysis" | "metadata"
  extractedData?: string
}

export function OnScriptCampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCallLogs, setIsLoadingCallLogs] = useState(false)
  const [activeMetric, setActiveMetric] = useState("avgScore")
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiWarning, setApiWarning] = useState<string | null>(null)
  const [callLogsError, setCallLogsError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<string, { min?: string; max?: string; text?: string }>>({})
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  })

  // Analysis modal state
  const [selectedCallForAnalysis, setSelectedCallForAnalysis] = useState<CallLog | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [activeSection, setActiveSection] = useState("Summary")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [activeTab, setActiveTab] = useState("campaigns")
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false)
  const [callLogsDateRange, setCallLogsDateRange] = useState<DateRange | undefined>(dateRange)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const { user } = useAuth()

  // Performance optimization: Use refs to prevent unnecessary re-renders
  const abortControllerRef = useRef<AbortController | null>(null)
  const campaignMetricsCache = useRef<Map<string, any>>(new Map())
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Memoized calculations to prevent recalculation on every render
  const calculatedSummary = useMemo(() => {
    if (summary) return summary

    return {
      totalAverageScore:
        campaigns.length > 0
          ? Math.round(campaigns.reduce((acc, c) => acc + c.average_score, 0) / campaigns.length)
          : 0,
      accountHours: campaigns.reduce((acc, c) => acc + c.audio_duration, 0),
      totalCalls: campaigns.reduce((acc, c) => acc + c.total_calls, 0),
      avgCallDuration: 7.9,
      commissionable: 0,
      cpa: 0,
      revenue: campaigns.reduce((acc, c) => acc + c.total_calls * 2.5, 0), // Estimated
      skipped: campaigns.reduce((acc, c) => acc + c.skipped_calls, 0),
      completed: campaigns.reduce((acc, c) => acc + c.completed_calls, 0),
      qcApproved: campaigns.reduce((acc, c) => acc + c.qc_approved, 0),
      qcRejected: campaigns.reduce((acc, c) => acc + c.qc_rejected, 0),
    }
  }, [campaigns, summary])

  const pieData = useMemo(
    () => [
      { name: "QC Approved", value: calculatedSummary.qcApproved, color: "#10b981" },
      { name: "QC Rejected", value: calculatedSummary.qcRejected, color: "#ef4444" },
    ],
    [calculatedSummary],
  )

  // Memoized filtered campaigns to prevent recalculation
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      return Object.entries(filters).every(([column, filter]) => {
        if (!filter.min && !filter.max && !filter.text) return true

        const value = campaign[column as keyof Campaign]

        if (filter.text) {
          return String(value).toLowerCase().includes(filter.text.toLowerCase())
        }

        if (typeof value === "number") {
          if (filter.min && value < Number.parseFloat(filter.min)) return false
          if (filter.max && value > Number.parseFloat(filter.max)) return false
        }

        return true
      })
    })
  }, [campaigns, filters])

  // Optimized fetch functions with abort controllers and caching
  const fetchCampaigns = useCallback(async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setApiError(null)
    setApiWarning(null)

    try {
      console.log("🔄 Fetching campaigns with real call data from RingBA...")

      const response = await fetch("/api/ringba/campaigns", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("📊 RingBA Campaigns Response:", result)

      if (result.success && result.data) {
        // Process campaigns in batches to prevent blocking
        const transformedCampaigns: Campaign[] = []
        const colors = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"]

        // Process campaigns in smaller chunks to prevent UI blocking
        for (let i = 0; i < result.data.length; i += 5) {
          const batch = result.data.slice(i, i + 5)

          const batchPromises = batch.map(async (campaign: any, index: number) => {
            const campaignId = campaign.id || campaign.campaign_id || `campaign-${i + index}`

            // Check cache first
            let callMetrics = campaignMetricsCache.current.get(campaignId)
            if (!callMetrics) {
              callMetrics = await fetchCampaignCallMetrics(campaignId)
              campaignMetricsCache.current.set(campaignId, callMetrics)
            }

            return {
              id: campaignId,
              campaign_name: campaign.name || campaign.campaign_name || `Campaign ${i + index + 1}`,
              average_score: callMetrics.averageScore,
              total_calls: callMetrics.totalCalls,
              qc_approved: callMetrics.qcApproved,
              qc_rejected: callMetrics.qcRejected,
              completed_calls: callMetrics.completedCalls,
              skipped_calls: callMetrics.skippedCalls,
              audio_duration: callMetrics.audioDuration,
              created_at: campaign.created || campaign.created_at || new Date().toISOString(),
              status:
                campaign.status?.toLowerCase() === "active"
                  ? "active"
                  : campaign.status?.toLowerCase() === "paused"
                    ? "paused"
                    : "completed",
              color: colors[(i + index) % colors.length],
            }
          })

          const batchResults = await Promise.all(batchPromises)
          transformedCampaigns.push(...batchResults)

          // Allow UI to update between batches
          if (i + 5 < result.data.length) {
            await new Promise((resolve) => setTimeout(resolve, 10))
          }
        }

        setCampaigns(transformedCampaigns)
        console.log(`✅ Successfully transformed ${transformedCampaigns.length} campaigns with real data`)
      } else {
        throw new Error(result.error || "No campaigns data received")
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request was aborted")
        return
      }
      console.error("❌ Failed to fetch campaigns:", error)
      setApiError(error instanceof Error ? error.message : "Unknown error occurred")
      setCampaigns([])
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  // Optimized campaign metrics fetching with caching
  const fetchCampaignCallMetrics = useCallback(
    async (campaignId: string) => {
      try {
        console.log(`📞 Fetching call metrics for campaign: ${campaignId}`)

        let startDate: string, endDate: string

        if (dateRange?.from && dateRange?.to) {
          startDate = new Date(dateRange.from.setHours(0, 0, 0, 0)).toISOString()
          endDate = new Date(dateRange.to.setHours(23, 59, 59, 999)).toISOString()
        } else {
          endDate = new Date().toISOString()
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }

        const response = await fetch(`/api/ringba/campaigns/${campaignId}/call-logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: startDate,
            endDate: endDate,
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
              "callLengthInSeconds",
              "connectedCallLengthInSeconds",
              "timeToConnectInSeconds",
              "hasConnected",
              "hasConverted",
              "hasRecording",
              "payoutAmount",
              "conversionAmount",
              "totalCost",
              "endCallSource",
            ],
            page: 1,
            pageSize: 1000,
            sortColumn: "callStartTime",
            sortOrder: "desc",
          }),
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) {
          console.warn(`Failed to fetch call logs for campaign ${campaignId}`)
          return getDefaultMetrics()
        }

        const callLogsResult = await response.json()

        if (!callLogsResult.success || !callLogsResult.data) {
          console.warn(`No call logs data for campaign ${campaignId}`)
          return getDefaultMetrics()
        }

        const callLogs = callLogsResult.data
        console.log(`📊 Found ${callLogs.length} calls for campaign ${campaignId} in selected date range`)

        // Calculate metrics efficiently
        const totalCalls = callLogs.length
        const totalDuration = callLogs.reduce((sum: number, call: any) => {
          const duration = Number.parseInt(call.callLengthInSeconds || call.duration || "0")
          return sum + duration
        }, 0)

        const scorecardScores = callLogs
          .map((call: any) => call.ai_analysis?.quality_score || call.scorecard_score)
          .filter((score: any) => score !== undefined && score !== null)

        const averageScore =
          scorecardScores.length > 0
            ? Math.round(
                scorecardScores.reduce((sum: number, score: number) => sum + score, 0) / scorecardScores.length,
              )
            : 0

        const qcApproved = callLogs.filter(
          (call: any) =>
            call.disposition === "sale" ||
            call.outcome === "approved" ||
            call.ai_analysis?.compliance_status === "approved",
        ).length

        const qcRejected = callLogs.filter(
          (call: any) =>
            call.disposition === "rejected" ||
            call.outcome === "rejected" ||
            call.ai_analysis?.compliance_status === "rejected",
        ).length

        const completedCalls = callLogs.filter(
          (call: any) => call.hasConnected === true || Number.parseInt(call.callLengthInSeconds || "0") > 30,
        ).length

        const skippedCalls = totalCalls - completedCalls
        const audioDuration = totalDuration / 3600

        return {
          averageScore,
          totalCalls,
          qcApproved,
          qcRejected,
          completedCalls,
          skippedCalls,
          audioDuration,
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          return getDefaultMetrics()
        }
        console.error(`Error fetching metrics for campaign ${campaignId}:`, error)
        return getDefaultMetrics()
      }
    },
    [dateRange],
  )

  const getDefaultMetrics = useCallback(
    () => ({
      averageScore: 0,
      totalCalls: 0,
      qcApproved: 0,
      qcRejected: 0,
      completedCalls: 0,
      skippedCalls: 0,
      audioDuration: 0,
    }),
    [],
  )

  // Debounced metrics fetching
  const fetchMetrics = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (!dateRange?.from || !dateRange?.to) return

        console.log("🔄 Fetching metrics from RingBA...")

        const response = await fetch("/api/ringba/campaigns/metrics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRange: {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            },
            campaignIds: campaigns.map((c) => c.id),
          }),
          signal: abortControllerRef.current?.signal,
        })

        if (response.ok) {
          const result = await response.json()
          console.log("📊 Metrics response:", result)

          if (result.success && result.data) {
            setSummary({
              totalAverageScore: calculatedSummary.totalAverageScore,
              accountHours: result.data.totalDuration / 3600,
              totalCalls: result.data.totalCalls,
              avgCallDuration: result.data.averageCallDuration / 60,
              commissionable: result.data.totalConversions,
              cpa: result.data.cpa,
              revenue: result.data.revenue,
              skipped: result.data.skippedCalls,
              completed: result.data.completedCalls,
              qcApproved: result.data.qcApproved,
              qcRejected: result.data.qcRejected,
            })

            const chartDataPoints = result.data.campaignMetrics.map((campaign: any) => ({
              date: format(dateRange.from!, "MMM dd"),
              [campaign.campaignName]: campaign[activeMetric === "avgScore" ? "totalCalls" : activeMetric] || 0,
            }))

            setChartData(chartDataPoints)
            console.log("✅ Updated metrics with real RingBA data")
          }
        } else {
          console.warn("Failed to fetch metrics, using calculated values")
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch metrics:", error)
        }
      }
    }, 300) // 300ms debounce
  }, [dateRange, campaigns, calculatedSummary, activeMetric])

  // Optimized call logs fetching
  const fetchCallLogs = useCallback(
    async (campaignId: string) => {
      setIsLoadingCallLogs(true)
      setCallLogsError(null)

      try {
        console.log("🔄 Fetching call logs for campaign:", campaignId)

        let startDate: string, endDate: string

        if (dateRange?.from && dateRange?.to) {
          startDate = new Date(dateRange.from.setHours(0, 0, 0, 0)).toISOString()
          endDate = new Date(dateRange.to.setHours(23, 59, 59, 999)).toISOString()
        } else {
          endDate = new Date().toISOString()
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }

        const response = await fetch(`/api/ringba/campaigns/${campaignId}/call-logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: startDate,
            endDate: endDate,
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
              "callLengthInSeconds",
              "connectedCallLengthInSeconds",
              "timeToConnectInSeconds",
              "hasConnected",
              "hasConverted",
              "hasRecording",
              "payoutAmount",
              "conversionAmount",
              "totalCost",
              "endCallSource",
              "publisherName",
            ],
            page: 1,
            pageSize: 500,
            sortColumn: "callStartTime",
            sortOrder: "desc",
          }),
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ API Error: ${response.status} - ${errorText}`)
          throw new Error(`API Error (${response.status}): ${errorText.substring(0, 100)}...`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text()
          console.error(`❌ Non-JSON response: ${responseText.substring(0, 200)}...`)
          throw new Error(`Expected JSON response but got: ${contentType || "unknown content type"}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch call logs")
        }

        setCallLogs(result.data || [])
      } catch (err: any) {
        if (err.name === "AbortError") {
          return
        }
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setCallLogsError(`RingBA API Error: ${errorMessage}`)
        setCallLogs([])
        console.error("❌ Call logs fetch error:", err)
      } finally {
        setIsLoadingCallLogs(false)
      }
    },
    [dateRange],
  )

  // Optimized event handlers
  const handleViewCalls = useCallback(
    (campaign: Campaign) => {
      setSelectedCampaign(campaign)
      setActiveTab("calls")
      setCallLogsDateRange(dateRange)
      fetchCallLogs(campaign.id)
    },
    [dateRange, fetchCallLogs],
  )

  const handleTranscribeCall = useCallback(async (callLog: CallLog) => {
    if (!callLog.hasRecording || !callLog.recordingUrl) {
      alert("This call does not have a recording available for transcription.")
      return
    }

    try {
      setCallLogs((prev) =>
        prev.map((call) => (call.id === callLog.id ? { ...call, transcriptionStatus: "transcribing" } : call)),
      )

      console.log("🎵 Starting transcription for call:", callLog.id)

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
        setCallLogs((prev) =>
          prev.map((call) =>
            call.id === callLog.id
              ? {
                  ...call,
                  isTranscribed: true,
                  transcriptionStatus: "completed",
                  transcript: result.data?.transcript || result.transcript,
                  analysis: result.data?.analysis || result.analysis,
                }
              : call,
          ),
        )

        alert("✅ Transcription completed successfully!")
      } else {
        throw new Error(result.error || "Transcription failed")
      }
    } catch (err) {
      console.error("❌ Transcription error:", err)
      setCallLogs((prev) =>
        prev.map((call) => (call.id === callLog.id ? { ...call, transcriptionStatus: "failed" } : call)),
      )
      alert(`❌ Transcription failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }, [])

  const handleViewAnalysis = useCallback((callLog: CallLog) => {
    console.log("👁️ Viewing analysis for call:", callLog.id)
    setSelectedCallForAnalysis(callLog)
    setShowAnalysisModal(true)
  }, [])

  const handleDateRangeApply = useCallback(() => {
    console.log("🔄 Applying new date range, refetching data...")
    // Clear cache when date range changes
    campaignMetricsCache.current.clear()
    fetchCampaigns()
    fetchMetrics()
  }, [fetchCampaigns, fetchMetrics])

  const handleFilterChange = useCallback((column: string, type: "min" | "max" | "text", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [column]: {
        ...prev[column],
        [type]: value || undefined,
      },
    }))
  }, [])

  const handleCampaignUpdate = useCallback((updatedCampaign: Campaign) => {
    setCampaigns((prev) => prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c)))
  }, [])

  const handleCampaignClone = useCallback((clonedCampaign: Campaign) => {
    setCampaigns((prev) => [...prev, clonedCampaign])
  }, [])

  const handleCampaignCreated = useCallback(
    (newCampaign: CampaignCreated) => {
      fetchCampaigns()
    },
    [fetchCampaigns],
  )

  // Initial data loading
  useEffect(() => {
    fetchCampaigns()
    fetchMetrics()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Utility functions (memoized for performance)
  const formatDuration = useCallback((hours: number) => {
    if (hours === 0) return "0 Hrs"
    if (hours < 1) return `${Math.round(hours * 60)}min`
    return `${hours.toFixed(1)} Hr${hours !== 1 ? "s" : ""}`
  }, [])

  const formatCallDuration = useCallback((minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return `${mins}min ${secs}s`
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "active":
        return "#10b981"
      case "paused":
        return "#f59e0b"
      case "active":
        return "#10b981"
      case "paused":
        return "#f59e0b"
      case "completed":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }, [])

  const getStatusBadge = useCallback((status: string, isActive: boolean) => {
    if (isActive || status === "active") {
      return <Badge className="bg-green-500 text-white">🟢 Active</Badge>
    } else if (status === "paused") {
      return <Badge className="bg-yellow-500 text-white">⏸️ Paused</Badge>
    } else {
      return <Badge className="bg-gray-500 text-white">⚪ Inactive</Badge>
    }
  }, [])

  const getTranscriptionStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white">✅ Transcribed</Badge>
      case "transcribing":
        return <Badge className="bg-blue-500 text-white">🔄 Transcribing</Badge>
      case "failed":
        return <Badge className="bg-red-500 text-white">❌ Failed</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">⏳ Pending</Badge>
    }
  }, [])

  const getQualityBadge = useCallback((quality: string) => {
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
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }, [])

  // Enhanced Analysis Modal with OnScript AI-style summary
  const formatTimestamp = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}s`
  }, [])

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.9) return "bg-green-500"
    if (confidence >= 0.8) return "bg-yellow-500"
    return "bg-red-500"
  }, [])

  const getEventColor = useCallback((event: string) => {
    switch (event) {
      case "CALL START":
        return "bg-green-500 text-white"
      case "CALL END":
        return "bg-red-500 text-white"
      case "SPEAKER CHANGE":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }, [])

  const AnalysisModal = () => {
    if (!selectedCallForAnalysis || !selectedCallForAnalysis.analysis) return null

    const transcriptEntries = [] // Replace with your actual transcript entries

    return (
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-white">
          <div className="flex h-[95vh]">
            {/* Transcript Section - OnScript Style */}
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
              {/* Transcript Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Real Transcript</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transcript"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  {transcriptEntries.length > 0 ? `${transcriptEntries.length} segments` : "Processing transcript..."}
                </div>
              </div>

              {/* Transcript Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {transcriptEntries.length > 0 ? (
                    transcriptEntries.map((entry, index) => (
                      <div key={index} className="space-y-2">
                        {/* Speaker and Timestamp */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.speaker}</span>
                            <span className="text-gray-500">
                              {formatTimestamp(entry.timestamp)} - {formatTimestamp(entry.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(entry.confidence)}`}></div>
                            <span className="text-gray-500">{Math.round(entry.confidence * 100)}%</span>
                          </div>
                        </div>

                        {/* Events */}
                        {entry.events.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.events.map((event, eventIndex) => (
                              <Badge key={eventIndex} className={`text-xs ${getEventColor(event)}`}>
                                {event}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Transcript Text */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-800">{entry.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No transcript segments available</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedCallForAnalysis.transcript
                          ? "Processing transcript data..."
                          : "No transcript data found"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns from RingBA...</p>
            {dateRange?.from && dateRange?.to && (
              <p className="text-gray-400 text-sm mt-2">
                Date range: {format(dateRange.from, "yyyy-MM-dd")} to {format(dateRange.to, "yyyy-MM-dd")}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="space-y-6 p-6">
        {/* API Error/Warning Alerts */}
        {apiError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>RingBA API Connection Error</AlertTitle>
            <AlertDescription>{apiError}. Using your existing RingBA endpoint: /api/ringba/campaigns</AlertDescription>
          </Alert>
        )}

        {/* Success message when campaigns are loaded */}
        {campaigns.length > 0 && !apiError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>RingBA Campaigns Loaded</AlertTitle>
            <AlertDescription>
              Successfully loaded {campaigns.length} campaigns from your RingBA account
              {dateRange?.from && dateRange?.to && (
                <span className="ml-2 text-blue-600">
                  ({format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Header Bar */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">OnScript Campaigns</h1>
          <div className="flex items-center gap-3">
            {/* Compact Date Range Picker */}
            <SimpleWorkingCalendar
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onApply={handleDateRangeApply}
              isLoading={isLoading}
            />

            {/* API Key Management Button */}
            <Button
              variant="outline"
              className="text-purple-600 border-purple-600 bg-transparent"
              onClick={() => setShowApiKeyModal(true)}
            >
              <Key className="mr-2 h-4 w-4" />
              API Keys
            </Button>

            <Button
              variant="outline"
              className="text-blue-600 border-blue-600 bg-transparent"
              onClick={() => setShowCreateCampaignModal(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>

            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowExportModal(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export Campaigns
            </Button>
          </div>
        </div>

        {/* Tab Navigation - Fixed Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-0">
            <TabsTrigger value="campaigns" className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-2 text-sm" disabled={!selectedCampaign}>
              <MessageSquare className="h-4 w-4" />
              Call Analysis
            </TabsTrigger>
            <TabsTrigger value="pixel" className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Pixel Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Left Chart Panel (70% width) */}
              <div className="lg:col-span-7">
                <Card>
                  <CardHeader className="pb-2">
                    <Tabs value={activeMetric} onValueChange={setActiveMetric}>
                      <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="avgScore">Avg. Score</TabsTrigger>
                        <TabsTrigger value="audioHr">Audio (hr)</TabsTrigger>
                        <TabsTrigger value="totalCalls">Total Calls</TabsTrigger>
                        <TabsTrigger value="skipped">Skipped</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="qcApproved">QC Approved</TabsTrigger>
                        <TabsTrigger value="qcRejected">QC Rejected</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border rounded shadow-lg">
                                      <p className="font-medium">{label}</p>
                                      {payload.map((entry, index) => (
                                        <p key={index} style={{ color: entry.color }}>
                                          {entry.dataKey}: {entry.value}
                                        </p>
                                      ))}
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            {campaigns.map((campaign) => (
                              <Line
                                key={campaign.id}
                                type="monotone"
                                dataKey={campaign.campaign_name}
                                stroke={campaign.color}
                                strokeWidth={2}
                                dot={{ fill: campaign.color, strokeWidth: 2, r: 4 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <p className="text-lg font-medium">No chart data available</p>
                            <p className="text-sm">Chart data will be generated from campaign metrics</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Analytics Cards (30% width) */}
              <div className="lg:col-span-3 space-y-4">
                {/* Total Average Score */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Average Score</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="2"
                            strokeDasharray={`${calculatedSummary.totalAverageScore}, 100`}
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="50%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-600">
                            {calculatedSummary.totalAverageScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Calls */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Calls</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-4">{calculatedSummary.totalCalls}</div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Avg. Call Duration</div>
                        <div className="font-medium text-blue-600">
                          {formatCallDuration(calculatedSummary.avgCallDuration)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Commissionable</div>
                        <div className="font-medium">{calculatedSummary.commissionable}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">CPA</div>
                        <div className="font-medium text-blue-600">${calculatedSummary.cpa.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Revenue</div>
                        <div className="font-medium text-blue-600">${calculatedSummary.revenue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Skipped</div>
                        <div className="font-medium">{calculatedSummary.skipped}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Completed</div>
                        <div className="font-medium text-green-600">{calculatedSummary.completed}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Hours */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Account Hours</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {calculatedSummary.accountHours.toFixed(1)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-8 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Control */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Quality Control</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={20} outerRadius={30} dataKey="value">
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>QC Approved: {calculatedSummary.qcApproved}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>QC Rejected: {calculatedSummary.qcRejected}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Campaigns Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Settings className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No campaigns found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {apiError
                        ? "Please check your RingBA API connection"
                        : "Try adjusting your filters or date range"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">ID</th>
                          <th className="text-left p-2 font-medium">CAMPAIGN NAME</th>
                          <th className="text-left p-2 font-medium">AVERAGE SCORE</th>
                          <th className="text-left p-2 font-medium">TOTAL CALLS</th>
                          <th className="text-left p-2 font-medium">QC APPROVED</th>
                          <th className="text-left p-2 font-medium">QC REJECTED</th>
                          <th className="text-left p-2 font-medium">COMPLETED CALLS</th>
                          <th className="text-left p-2 font-medium">SKIPPED CALLS</th>
                          <th className="text-left p-2 font-medium">AUDIO DURATION</th>
                          <th className="text-left p-2 font-medium">ACTIONS</th>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <Input
                              placeholder="Min"
                              className="w-16 h-8 text-xs"
                              value={filters.id?.min || ""}
                              onChange={(e) => handleFilterChange("id", "min", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="Search..."
                              className="w-32 h-8 text-xs"
                              value={filters.campaign_name?.text || ""}
                              onChange={(e) => handleFilterChange("campaign_name", "text", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Min"
                                className="w-12 h-8 text-xs"
                                value={filters.average_score?.min || ""}
                                onChange={(e) => handleFilterChange("average_score", "min", e.target.value)}
                              />
                              <Input
                                placeholder="Max"
                                className="w-12 h-8 text-xs"
                                value={filters.average_score?.max || ""}
                                onChange={(e) => handleFilterChange("average_score", "max", e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Min"
                                className="w-12 h-8 text-xs"
                                value={filters.total_calls?.min || ""}
                                onChange={(e) => handleFilterChange("total_calls", "min", e.target.value)}
                              />
                              <Input
                                placeholder="Max"
                                className="w-12 h-8 text-xs"
                                value={filters.total_calls?.max || ""}
                                onChange={(e) => handleFilterChange("total_calls", "max", e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Min"
                                className="w-12 h-8 text-xs"
                                value={filters.qc_approved?.min || ""}
                                onChange={(e) => handleFilterChange("qc_approved", "min", e.target.value)}
                              />
                              <Input
                                placeholder="Max"
                                className="w-12 h-8 text-xs"
                                value={filters.qc_approved?.max || ""}
                                onChange={(e) => handleFilterChange("qc_approved", "max", e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Min"
                                className="w-12 h-8 text-xs"
                                value={filters.qc_rejected?.min || ""}
                                onChange={(e) => handleFilterChange("qc_rejected", "min", e.target.value)}
                              />
                              <Input
                                placeholder="Max"
                                className="w-12 h-8 text-xs"
                                value={filters.qc_rejected?.max || ""}
                                onChange={(e) => handleFilterChange("qc_rejected", "max", e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Min"
                                className="w-12 h-8 text-xs"
                                value={filters.completed_calls?.min || ""}
                                onChange={(e) => handleFilterChange("completed_calls", "min", e.target.value)}
                              />
                              <Input
                                placeholder="Max"
                                className="w-12 h-8 text-xs"
                                value={filters.completed_calls?.max || ""}
                                onChange={(e) => handleFilterChange("completed_calls", "max", e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Min"
                                className="w-12 h-8 text-xs"
                                value={filters.skipped_calls?.min || ""}
                                onChange={(e) => handleFilterChange("skipped_calls", "min", e.target.value)}
                              />
                              <Input
                                placeholder="Max"
                                className="w-12 h-8 text-xs"
                                value={filters.skipped_calls?.max || ""}
                                onChange={(e) => handleFilterChange("skipped_calls", "max", e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Input
                                placeholder="Min"
                                className="w-12 h-8 text-xs"
                                value={filters.audio_duration?.min || ""}
                                onChange={(e) => handleFilterChange("audio_duration", "min", e.target.value)}
                              />
                              <Input
                                placeholder="Max"
                                className="w-12 h-8 text-xs"
                                value={filters.audio_duration?.max || ""}
                                onChange={(e) => handleFilterChange("audio_duration", "max", e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="p-2"></td>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCampaigns.map((campaign) => (
                          <tr key={campaign.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <a
                                href={`/campaigns/${campaign.id}?campaignName=${encodeURIComponent(campaign.campaign_name)}`}
                                className="text-blue-600 hover:underline font-medium hover:text-blue-800 transition-colors"
                              >
                                {campaign.id}
                              </a>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getStatusColor(campaign.status) }}
                                ></div>
                                {campaign.campaign_name}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(campaign.average_score, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{campaign.average_score}%</span>
                              </div>
                            </td>
                            <td className="p-2">{campaign.total_calls}</td>
                            <td className="p-2">{campaign.qc_approved}</td>
                            <td className="p-2">{campaign.qc_rejected}</td>
                            <td className="p-2">{campaign.completed_calls}</td>
                            <td className="p-2">{campaign.skipped_calls}</td>
                            <td className="p-2">{formatDuration(campaign.audio_duration)}</td>
                            <td className="p-2">
                              <OnScriptActionButtons
                                campaign={campaign}
                                onViewCalls={handleViewCalls}
                                onCampaignUpdate={handleCampaignUpdate}
                                onCampaignClone={handleCampaignClone}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Analysis Tab */}
          <TabsContent value="calls">
            {selectedCampaign && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        OnScript AI Call Analysis - {selectedCampaign.campaign_name}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-sm text-gray-600">Campaign ID: {selectedCampaign.id}</p>
                        <Badge className="bg-purple-100 text-purple-800">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Enhanced Analysis
                        </Badge>
                      </div>
                    </div>

                    {/* Call Logs Date Range Picker */}
                    <div className="flex items-center gap-3">
                      <SimpleWorkingCalendar
                        dateRange={callLogsDateRange}
                        onDateRangeChange={setCallLogsDateRange}
                        onApply={() => {
                          console.log("🔄 Applying call logs date range filter...")
                          fetchCallLogs(selectedCampaign.id)
                        }}
                        isLoading={isLoadingCallLogs}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchCallLogs(selectedCampaign.id)}
                        disabled={isLoadingCallLogs}
                      >
                        {isLoadingCallLogs ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Calls
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {callLogsDateRange?.from && callLogsDateRange?.to && (
                  <div className="px-6 py-2 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Showing calls from {format(callLogsDateRange.from, "MMM dd, yyyy")} to{" "}
                        {format(callLogsDateRange.to, "MMM dd, yyyy")}
                      </span>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {callLogs.length} calls found
                      </Badge>
                    </div>
                  </div>
                )}
                <CardContent>
                  {callLogsError && (
                    <Alert className="border-red-200 bg-red-50 mb-4">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>RingBA API Connection Failed:</strong> {callLogsError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isLoadingCallLogs && (
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

                  {!callLogsError && !isLoadingCallLogs && callLogs.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No call logs found</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          This campaign doesn't have any call logs yet, or they may not be available through the API.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {!isLoadingCallLogs && callLogs.length > 0 && (
                    <div className="space-y-4">
                      {callLogs.map((callLog) => (
                        <Card
                          key={callLog.id}
                          className="border border-gray-200 hover:border-purple-300 transition-colors"
                        >
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
                                  {getTranscriptionStatusBadge(callLog.transcriptionStatus)}
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

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
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
                                    <span className="font-medium">Cost:</span> {formatCurrency(callLog.cost)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 ml-6">
                                {callLog.hasRecording && (
                                  <>
                                    {callLog.isTranscribed && callLog.analysis ? (
                                      <Button variant="default" size="sm" onClick={() => handleViewAnalysis(callLog)}>
                                        <Brain className="h-4 w-4 mr-2" />
                                        View OnScript Analysis
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleTranscribeCall(callLog)}
                                        disabled={callLog.transcriptionStatus === "transcribing"}
                                      >
                                        {callLog.transcriptionStatus === "transcribing" ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Transcribing...
                                          </>
                                        ) : (
                                          <>
                                            <Brain className="h-4 w-4 mr-2" />
                                            Analyze with OnScript AI
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </>
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pixel Setup Tab */}
          <TabsContent value="pixel">
            <RingbaPixelSetup userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Analysis Modal */}
      <AnalysisModal />

      {/* Campaign Creation Modal */}
      <CampaignCreationModal
        isOpen={showCreateCampaignModal}
        onClose={() => setShowCreateCampaignModal(false)}
        onSuccess={handleCampaignCreated}
      />

      {/* Campaign Export Modal */}
      <CampaignExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        campaigns={filteredCampaigns}
      />

      {/* API Key Management Modal */}
      <ApiKeyManagementModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />
    </div>
  )
}
