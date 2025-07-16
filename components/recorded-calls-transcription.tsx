"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  PlayCircle,
  Mic,
  FileText,
  Clock,
  User,
  Phone,
  Calendar,
  Download,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react"
import { format } from "date-fns"

interface RecordedCall {
  id: string
  campaignId: string
  campaignName: string
  callerId: string
  calledNumber: string
  startTime: string
  endTime: string | null
  duration: number
  status: string
  disposition: string
  direction: string
  recordingUrl: string
  hasRecording: boolean
  agentName: string
  revenue: number
  cost: number
  quality: string | null
  tags: string[]
  isTranscribed: boolean
  transcriptionStatus: string
  transcript: string | null
  analysis: any
  recordingDuration: number
  recordingFormat: string
  recordingSize: number | null
  metadata: any
}

interface RecordedCallsTranscriptionProps {
  campaignId: string
  campaignName: string
}

export function RecordedCallsTranscription({ campaignId, campaignName }: RecordedCallsTranscriptionProps) {
  const [recordedCalls, setRecordedCalls] = useState<RecordedCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [transcriptionProgress, setTranscriptionProgress] = useState<{ [key: string]: number }>({})
  const [batchProcessing, setBatchProcessing] = useState(false)

  useEffect(() => {
    fetchRecordedCalls()
  }, [campaignId])

  const fetchRecordedCalls = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`🎵 Fetching recorded calls for campaign: ${campaignName} (ID: ${campaignId})`)

      const response = await fetch(`/api/ringba/campaigns/${campaignId}/recorded-calls`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch recorded calls")
      }

      setRecordedCalls(result.data || [])
      console.log(`🎵 Loaded ${result.data?.length || 0} recorded calls for campaign ${campaignName}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranscribeCall = async (call: RecordedCall) => {
    setProcessingCalls((prev) => new Set(prev).add(call.id))
    setTranscriptionProgress((prev) => ({ ...prev, [call.id]: 0 }))

    try {
      console.log("🎤 Starting transcription for call:", call.id)

      // Update progress
      setTranscriptionProgress((prev) => ({ ...prev, [call.id]: 20 }))

      // Download the recording
      console.log("📥 Downloading recording from:", call.recordingUrl)
      const recordingResponse = await fetch(call.recordingUrl)
      if (!recordingResponse.ok) {
        throw new Error("Failed to download recording")
      }

      setTranscriptionProgress((prev) => ({ ...prev, [call.id]: 40 }))

      const audioBlob = await recordingResponse.blob()
      const audioFile = new File([audioBlob], `ringba_${call.id}.${call.recordingFormat}`, {
        type: `audio/${call.recordingFormat}`,
      })

      setTranscriptionProgress((prev) => ({ ...prev, [call.id]: 60 }))

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

      setTranscriptionProgress((prev) => ({ ...prev, [call.id]: 80 }))

      const transcriptionResult = await transcribeResponse.json()

      if (transcriptionResult.success && transcriptionResult.data) {
        // Save the call data with transcription results
        const callData = {
          id: `ringba_${call.id}`,
          callId: call.id,
          agent: call.agentName,
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
          campaignName: campaignName,
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
            quality: call.quality,
            tags: call.tags,
          },
        }

        // Save to localStorage
        const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
        const existingIndex = existingCalls.findIndex((c: any) => c.callId === call.id)

        if (existingIndex >= 0) {
          existingCalls[existingIndex] = callData
        } else {
          existingCalls.push(callData)
        }

        localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))

        // Update the call in our state
        setRecordedCalls((prev) =>
          prev.map((c) =>
            c.id === call.id
              ? {
                  ...c,
                  isTranscribed: true,
                  transcriptionStatus: "completed",
                  transcript: transcriptionResult.data.transcript,
                  analysis: transcriptionResult.data.analysis,
                }
              : c,
          ),
        )

        setTranscriptionProgress((prev) => ({ ...prev, [call.id]: 100 }))

        console.log(`✅ Successfully transcribed and analyzed call ${call.id}`)
      } else {
        throw new Error(transcriptionResult.error || "Transcription failed")
      }
    } catch (error) {
      console.error(`Failed to transcribe call ${call.id}:`, error)
      setRecordedCalls((prev) => prev.map((c) => (c.id === call.id ? { ...c, transcriptionStatus: "failed" } : c)))
      alert(`Failed to transcribe call: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setProcessingCalls((prev) => {
        const newSet = new Set(prev)
        newSet.delete(call.id)
        return newSet
      })
      setTimeout(() => {
        setTranscriptionProgress((prev) => {
          const newProgress = { ...prev }
          delete newProgress[call.id]
          return newProgress
        })
      }, 2000)
    }
  }

  const handleBatchTranscribe = async () => {
    const untranscribedCalls = recordedCalls.filter((call) => !call.isTranscribed && call.hasRecording)

    if (untranscribedCalls.length === 0) {
      alert("No untranscribed calls with recordings found.")
      return
    }

    setBatchProcessing(true)

    for (const call of untranscribedCalls) {
      await handleTranscribeCall(call)
      // Small delay between calls to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setBatchProcessing(false)
    alert(`Batch transcription completed! Processed ${untranscribedCalls.length} calls.`)
  }

  const filteredCalls = recordedCalls.filter((call) => {
    const matchesSearch =
      call.callerId.includes(searchTerm) ||
      call.calledNumber.includes(searchTerm) ||
      call.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.id.includes(searchTerm)

    return matchesSearch
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTranscriptionStatusBadge = (call: RecordedCall) => {
    if (processingCalls.has(call.id)) {
      return (
        <Badge className="bg-blue-500 text-white">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Transcribing...
        </Badge>
      )
    }

    switch (call.transcriptionStatus) {
      case "completed":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Loading recorded calls for {campaignName}...</h3>
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
              <strong>Failed to load recorded calls:</strong> {error}
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecordedCalls}>
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
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-blue-600" />
            Recorded Calls for {campaignName}
          </h3>
          <p className="text-gray-600 text-sm">
            {filteredCalls.length} recorded calls • {filteredCalls.filter((c) => c.isTranscribed).length} transcribed •{" "}
            {filteredCalls.filter((c) => !c.isTranscribed).length} pending
          </p>
          <p className="text-xs text-green-600 mt-1">🎵 Only calls with recordings from Ringba API</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRecordedCalls} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleBatchTranscribe}
            variant="default"
            size="sm"
            disabled={batchProcessing || recordedCalls.filter((c) => !c.isTranscribed).length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            {batchProcessing ? "Processing..." : "Batch Transcribe All"}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by phone, agent, or call ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Recorded Calls List */}
      {filteredCalls.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <PlayCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recorded calls found</h3>
            <p className="text-gray-500">
              {recordedCalls.length === 0
                ? `No recorded calls available for campaign "${campaignName}".`
                : "No recorded calls match your current search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCalls.map((call) => (
            <Card key={call.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {call.callerId} → {call.calledNumber}
                      </h4>
                      <Badge variant={call.direction === "inbound" ? "default" : "secondary"}>{call.direction}</Badge>
                      <Badge className="bg-green-100 text-green-800">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        {call.recordingFormat.toUpperCase()}
                      </Badge>
                      {getTranscriptionStatusBadge(call)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{call.agentName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(call.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{call.status}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(call.startTime), "MMM dd, HH:mm")}</span>
                      </div>
                    </div>

                    {transcriptionProgress[call.id] !== undefined && (
                      <div className="mb-2">
                        <Progress value={transcriptionProgress[call.id]} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          Transcribing with Deepgram AI... {transcriptionProgress[call.id]}%
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium">Disposition:</span> {call.disposition}
                      </span>
                      {call.revenue > 0 && (
                        <span className="text-green-600">
                          <span className="font-medium">Revenue:</span> ${call.revenue.toFixed(2)}
                        </span>
                      )}
                      {call.recordingSize && (
                        <span className="text-gray-600">
                          <span className="font-medium">Size:</span> {(call.recordingSize / 1024 / 1024).toFixed(1)}MB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleTranscribeCall(call)}
                      disabled={processingCalls.has(call.id) || call.isTranscribed}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {processingCalls.has(call.id) ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Transcribing...
                        </>
                      ) : call.isTranscribed ? (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          View Analysis
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Transcribe with Deepgram AI
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Recording
                      </a>
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
