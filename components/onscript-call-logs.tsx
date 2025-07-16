"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  FileText,
  ArrowLeft,
  Brain,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { CompactDateRangePicker } from "@/components/compact-date-range-picker"
import type { DateRange } from "react-day-picker"
import { OnScriptCallAnalysisModal } from "./onscript-call-analysis-modal"

interface OnScriptCallLog {
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
  transcript?: string
  analysis?: any
}

interface OnScriptCallLogsProps {
  campaignId: string
}

export function OnScriptCallLogs({ campaignId }: OnScriptCallLogsProps) {
  const [callLogs, setCallLogs] = useState<OnScriptCallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRecordings, setFilterRecordings] = useState(false)
  const [filterTranscribed, setFilterTranscribed] = useState(false)
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [campaignName, setCampaignName] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isApplyingDateFilter, setIsApplyingDateFilter] = useState(false)
  const [autoTranscriptionInProgress, setAutoTranscriptionInProgress] = useState<Set<string>>(new Set())

  // Analysis modal state
  const [selectedCallLog, setSelectedCallLog] = useState<OnScriptCallLog | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)

  useEffect(() => {
    fetchCallLogs()
  }, [campaignId])

  // Load existing transcriptions from localStorage on component mount
  useEffect(() => {
    loadExistingTranscriptions()
  }, [callLogs.length])

  // Auto-transcribe calls with recordings when they load
  useEffect(() => {
    if (callLogs.length > 0) {
      autoTranscribeCallsWithRecordings()
    }
  }, [callLogs.length])

  const loadExistingTranscriptions = () => {
    try {
      const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")

      if (uploadedCalls.length > 0 && callLogs.length > 0) {
        setCallLogs((prevCallLogs) =>
          prevCallLogs.map((callLog) => {
            const transcribedCall = uploadedCalls.find(
              (uc: any) => uc.callId === callLog.callId || uc.id === callLog.id,
            )

            if (transcribedCall) {
              console.log(`📝 Found existing transcription for call ${callLog.callId}`)
              return {
                ...callLog,
                hasTranscription: true,
                hasAnalysis: true,
                transcript: transcribedCall.transcript,
                analysis: transcribedCall.analysis,
              }
            }
            return callLog
          }),
        )
      }
    } catch (error) {
      console.error("Error loading existing transcriptions:", error)
    }
  }

  const autoTranscribeCallsWithRecordings = async () => {
    console.log("🤖 Starting auto-transcription process...")

    // Get calls that have recordings but no transcription
    const callsToTranscribe = callLogs.filter(
      (call) => call.hasRecording && !call.hasTranscription && call.recordingUrl,
    )

    if (callsToTranscribe.length === 0) {
      console.log("✅ No calls need auto-transcription")
      return
    }

    console.log(`🎯 Auto-transcribing ${callsToTranscribe.length} calls with recordings...`)

    // Process calls one by one to avoid overwhelming the API
    for (const call of callsToTranscribe) {
      // Skip if already processing
      if (autoTranscriptionInProgress.has(call.id)) {
        continue
      }

      // Add to processing set
      setAutoTranscriptionInProgress((prev) => new Set(prev).add(call.id))

      try {
        await handleTranscribeCall(call, true) // true = auto mode

        // Small delay between calls to be respectful to the API
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Auto-transcription failed for call ${call.id}:`, error)
      } finally {
        // Remove from processing set
        setAutoTranscriptionInProgress((prev) => {
          const newSet = new Set(prev)
          newSet.delete(call.id)
          return newSet
        })
      }
    }

    console.log("✅ Auto-transcription process completed")
  }

  const fetchCallLogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`📞 Fetching OnScript call logs for campaign: ${campaignId}`)
      const response = await fetch(`/api/onscript/campaigns/${campaignId}/call-logs`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch call logs")
      }

      setCallLogs(result.data || [])
      setCampaignName(result.campaignName || `Campaign ${campaignId}`)
      console.log(`✅ Loaded ${result.data?.length || 0} OnScript call logs`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranscribeCall = async (callLog: OnScriptCallLog, isAutoMode = false) => {
    if (!callLog.recordingUrl) {
      if (!isAutoMode) {
        alert("No recording URL available for this call")
      }
      return
    }

    setProcessingCalls((prev) => new Set(prev).add(callLog.id))

    try {
      console.log(`🎯 Starting ${isAutoMode ? "auto-" : ""}transcription for OnScript call:`, callLog.id)
      console.log("🔗 Recording URL:", callLog.recordingUrl)

      // Download the recording
      const recordingResponse = await fetch(callLog.recordingUrl)
      if (!recordingResponse.ok) {
        throw new Error("Failed to download recording")
      }

      const audioBlob = await recordingResponse.blob()
      const audioFile = new File([audioBlob], `onscript_${callLog.callId}.wav`, { type: "audio/wav" })

      // Transcribe using our existing API
      console.log("🎵 Transcribing call with Deepgram AI...")
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
      console.log("📊 Transcription result:", transcriptionResult)

      if (transcriptionResult.success && transcriptionResult.data) {
        // Create the call data object for storage
        const callData = {
          id: callLog.id,
          callId: callLog.callId,
          agent: callLog.agentName,
          duration: callLog.duration,
          recordingUrl: callLog.recordingUrl,
          fileName: audioFile.name,
          date: callLog.startTime,
          analysis: transcriptionResult.data.analysis,
          transcript: transcriptionResult.data.transcript,
          provider: transcriptionResult.data.provider || "deepgram",
          automated: isAutoMode,
          integrationSource: "OnScript-CallLogs",
          campaignId: callLog.campaignId,
          campaignName: callLog.campaignName,
          processedAt: new Date().toISOString(),
          metadata: {
            direction: callLog.direction,
            customerPhone: callLog.customerPhone,
            agentName: callLog.agentName,
            status: callLog.status,
            disposition: callLog.disposition,
            startTime: callLog.startTime,
            endTime: callLog.endTime,
            revenue: callLog.revenue,
            cost: callLog.cost,
            trackingNumber: callLog.trackingNumber,
          },
        }

        // Save to localStorage
        const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
        const existingIndex = existingCalls.findIndex((c: any) => c.callId === callLog.callId || c.id === callLog.id)

        if (existingIndex >= 0) {
          existingCalls[existingIndex] = callData
        } else {
          existingCalls.push(callData)
        }

        localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))
        console.log("💾 Saved transcription to localStorage")

        // Update the call log state immediately
        setCallLogs((prev) =>
          prev.map((call) =>
            call.id === callLog.id
              ? {
                  ...call,
                  hasTranscription: true,
                  hasAnalysis: true,
                  transcript: transcriptionResult.data.transcript,
                  analysis: transcriptionResult.data.analysis,
                }
              : call,
          ),
        )

        console.log(`✅ Successfully ${isAutoMode ? "auto-" : ""}processed OnScript call log ${callLog.id}`)

        if (!isAutoMode) {
          alert(
            `Call log ${callLog.callId} transcribed and analyzed successfully! Click "View Analysis" to see results.`,
          )
        }
      } else {
        throw new Error(transcriptionResult.error || "Transcription failed")
      }
    } catch (error) {
      console.error(`Failed to process call log ${callLog.id}:`, error)
      if (!isAutoMode) {
        alert(`Failed to process call: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    } finally {
      setProcessingCalls((prev) => {
        const newSet = new Set(prev)
        newSet.delete(callLog.id)
        return newSet
      })
    }
  }

  const handleViewAnalysis = (callLog: OnScriptCallLog) => {
    console.log("👁️ Opening analysis modal for call:", callLog.callId)
    console.log("📊 Call log data:", callLog)
    console.log("🧠 Analysis data:", callLog.analysis)
    console.log("📝 Transcript available:", !!callLog.transcript)

    if (!callLog.analysis || !callLog.transcript) {
      console.warn("⚠️ Missing analysis or transcript data")
      alert("Analysis data is not available. Please wait for auto-transcription to complete or transcribe manually.")
      return
    }

    // Force state update with a small delay to ensure proper rendering
    setSelectedCallLog(callLog)
    setTimeout(() => {
      setShowAnalysisModal(true)
      console.log("✅ Modal state set to true")
    }, 100)
  }

  const handleCloseAnalysisModal = () => {
    console.log("❌ Closing analysis modal")
    setShowAnalysisModal(false)
    setSelectedCallLog(null)
  }

  const handleDateRangeApply = async () => {
    setIsApplyingDateFilter(true)
    // Here you would typically refetch call logs with the date range
    // For now, we'll just simulate the loading state
    setTimeout(() => {
      setIsApplyingDateFilter(false)
      console.log("📅 Date range applied:", dateRange)
    }, 1000)
  }

  // Enhanced filtering logic - automatically filter out calls without recordings
  const filteredCallLogs = callLogs.filter((callLog) => {
    // ALWAYS filter out calls without recordings (this is the new requirement)
    if (!callLog.hasRecording) {
      return false
    }

    const matchesSearch =
      callLog.customerPhone.includes(searchTerm) ||
      callLog.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      callLog.callId.includes(searchTerm) ||
      (callLog.trackingNumber && callLog.trackingNumber.includes(searchTerm))

    // Note: filterRecordings is now redundant since we always filter for recordings,
    // but keeping it for backward compatibility
    const matchesRecordingFilter = !filterRecordings || callLog.hasRecording
    const matchesTranscribedFilter = !filterTranscribed || callLog.hasTranscription

    return matchesSearch && matchesRecordingFilter && matchesTranscribedFilter
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

  // Count auto-transcription progress
  const autoTranscriptionCount = autoTranscriptionInProgress.size
  const callsWithRecordings = callLogs.filter((c) => c.hasRecording).length
  const transcribedCalls = callLogs.filter((c) => c.hasTranscription).length
  const totalCallsFromAPI = callLogs.length
  const callsWithoutRecordings = totalCallsFromAPI - callsWithRecordings

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Loading call logs...</h3>
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
              <strong>Failed to load call logs:</strong> {error}
            </div>
            <Button variant="outline" size="sm" onClick={fetchCallLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/onscript/campaigns">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Link>
            </Button>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-blue-600" />
            Call Logs - {campaignName}
          </h3>
          <p className="text-gray-600 text-sm">
            {filteredCallLogs.length} call logs with recordings • {transcribedCalls} transcribed
            {callsWithoutRecordings > 0 && (
              <span className="text-orange-600 ml-2">
                ({callsWithoutRecordings} calls without recordings filtered out)
              </span>
            )}
          </p>
          <p className="text-xs text-green-600 mt-1">
            ✅ OnScript AI-style call log management with auto-transcription • Only showing calls with recordings
          </p>

          {/* Auto-transcription status */}
          {autoTranscriptionCount > 0 && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800">
                  Auto-transcribing {autoTranscriptionCount} call{autoTranscriptionCount > 1 ? "s" : ""} in
                  background...
                </span>
              </div>
            </div>
          )}
        </div>
        <Button onClick={fetchCallLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap justify-between">
        <div className="flex gap-4 items-center flex-wrap flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by phone, agent, call ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Note: Recording filter is now less relevant since we always show only calls with recordings */}
          <Button
            variant={filterRecordings ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRecordings(!filterRecordings)}
            className="opacity-50"
            title="All displayed calls have recordings"
          >
            <Filter className="h-4 w-4 mr-2" />
            {filterRecordings ? "All Calls" : "With Recordings"}
          </Button>
          <Button
            variant={filterTranscribed ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTranscribed(!filterTranscribed)}
          >
            <FileText className="h-4 w-4 mr-2" />
            {filterTranscribed ? "All Calls" : "Transcribed"}
          </Button>
        </div>

        {/* Date Range Picker - Top Right Corner */}
        <div className="flex items-center gap-2">
          <CompactDateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onApply={handleDateRangeApply}
            isLoading={isApplyingDateFilter}
          />
        </div>
      </div>

      {/* Information Alert about filtering */}
      {callsWithoutRecordings > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Recording Filter Active:</strong> {callsWithoutRecordings} call
            {callsWithoutRecordings > 1 ? "s" : ""} without recordings have been automatically filtered out. Only calls
            with recordings are displayed for transcription and analysis.
          </AlertDescription>
        </Alert>
      )}

      {/* Call Logs List */}
      {filteredCallLogs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No call logs with recordings found</h3>
            <p className="text-gray-500">
              {callLogs.length === 0
                ? `No call logs available for campaign "${campaignName}".`
                : callsWithoutRecordings === totalCallsFromAPI
                  ? `All ${totalCallsFromAPI} call logs for this campaign have no recordings.`
                  : "No call logs with recordings match your current filters."}
            </p>
            {callsWithoutRecordings > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                {callsWithoutRecordings} call{callsWithoutRecordings > 1 ? "s" : ""} without recordings were filtered
                out.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCallLogs.map((callLog) => (
            <Card key={callLog.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">Call Log {callLog.callId}</h4>
                      {getDirectionBadge(callLog.direction)}
                      {callLog.hasRecording && <Badge variant="outline">🎵 Recording</Badge>}
                      {callLog.hasTranscription && (
                        <Badge variant="outline" className="text-green-600">
                          📝 Transcribed
                        </Badge>
                      )}
                      {callLog.hasAnalysis && (
                        <Badge variant="outline" className="text-blue-600">
                          🧠 Analyzed
                        </Badge>
                      )}
                      {autoTranscriptionInProgress.has(callLog.id) && (
                        <Badge variant="outline" className="text-orange-600">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Auto-transcribing...
                        </Badge>
                      )}
                      {callLog.revenue && callLog.revenue > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(callLog.revenue)}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Agent:</span> {callLog.agentName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Duration:</span> {formatDuration(callLog.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">Customer:</span> {callLog.customerPhone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Time:</span>{" "}
                        {format(new Date(callLog.startTime), "MMM dd, HH:mm")}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium">Status:</span> {callLog.status}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">Disposition:</span> {callLog.disposition}
                      </span>
                      {callLog.trackingNumber && (
                        <span className="text-gray-600">
                          <span className="font-medium">Tracking:</span> {callLog.trackingNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    {callLog.hasTranscription && callLog.hasAnalysis ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewAnalysis(callLog)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        View Analysis
                      </Button>
                    ) : autoTranscriptionInProgress.has(callLog.id) ? (
                      <Button variant="outline" size="sm" disabled className="text-orange-600 bg-transparent">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Auto-transcribing...
                      </Button>
                    ) : callLog.hasRecording ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleTranscribeCall(callLog)}
                        disabled={processingCalls.has(callLog.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {processingCalls.has(callLog.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Transcribing...
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Transcribe & Analyze
                          </>
                        )}
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-center">
                        No Recording
                      </Badge>
                    )}

                    {callLog.hasRecording && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={callLog.recordingUrl!} target="_blank" rel="noopener noreferrer">
                          <Play className="h-4 w-4 mr-2" />
                          Listen
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

      {/* Analysis Modal - Always render, control visibility with open prop */}
      <OnScriptCallAnalysisModal
        callLog={selectedCallLog}
        onClose={handleCloseAnalysisModal}
        open={showAnalysisModal && selectedCallLog !== null}
      />
    </div>
  )
}
