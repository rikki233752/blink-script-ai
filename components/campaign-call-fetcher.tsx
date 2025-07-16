"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Phone,
  Play,
  Clock,
  User,
  Calendar,
  PhoneCall,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertCircle,
  Mic,
  Download,
} from "lucide-react"
import { format } from "date-fns"

interface CampaignCallFetcherProps {
  campaignId?: string
  startDate?: string
  endDate?: string
}

export function CampaignCallFetcher({
  campaignId = "CA44105a090ea24f0bbfdd5a823af7b2ec",
  startDate = "2024-06-01T00:00:00Z",
  endDate = "2025-06-10T23:59:59Z",
}: CampaignCallFetcherProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [calls, setCalls] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [responseDetails, setResponseDetails] = useState<any>(null)

  const fetchCampaignCalls = async () => {
    setIsLoading(true)
    setError(null)
    setCalls([])

    try {
      // Use the exact payload format provided by the user
      const payload = {
        startDate,
        endDate,
        filters: {
          campaignIds: [campaignId],
        },
      }

      console.log("📤 Sending payload:", payload)

      const response = await fetch("/api/ringba/fetch-campaign-calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        setCalls(result.callLogs || [])
        setResponseDetails({
          endpoint: result.endpoint,
          format: result.format,
          totalCalls: result.totalCalls,
          callsWithRecordings: result.callsWithRecordings,
        })
        console.log("✅ Successfully fetched calls:", result)
      } else {
        setError(result.error || "Failed to fetch calls")
        // If we have mock data, use it for development
        if (result.mockData) {
          setCalls(result.mockData)
          console.log("⚠️ Using mock data:", result.mockData)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranscribeCall = async (call: any) => {
    if (!call.recordingUrl) {
      alert("No recording URL available for this call")
      return
    }

    setProcessingCalls((prev) => new Set(prev).add(call.callId))

    try {
      // Download the recording
      console.log("📥 Downloading recording for call:", call.callId)
      const recordingResponse = await fetch(call.recordingUrl)
      if (!recordingResponse.ok) {
        throw new Error("Failed to download recording")
      }

      const audioBlob = await recordingResponse.blob()
      const audioFile = new File([audioBlob], `ringba_${call.callId}.wav`, { type: "audio/wav" })

      // Transcribe using our existing API
      console.log("🎯 Transcribing call with Deepgram...")
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
          campaignName: call.campaignName,
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

        console.log(`✅ Successfully processed Ringba call ${call.callId}`)
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

  const getDirectionBadge = (direction: string) => {
    return direction === "inbound" ? (
      <Badge className="bg-green-500 text-white">📞 Inbound</Badge>
    ) : (
      <Badge className="bg-blue-500 text-white">📱 Outbound</Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-blue-600" />
            Campaign Call Logs
          </h3>
          <p className="text-gray-600 text-sm">Campaign ID: {campaignId}</p>
          <p className="text-gray-500 text-xs">
            Date Range: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={fetchCampaignCalls} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Fetch Call Logs
            </>
          )}
        </Button>
      </div>

      {/* Response Details */}
      {responseDetails && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">API Endpoint:</span>
                <p className="text-blue-600 truncate">{responseDetails.endpoint}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Format Used:</span>
                <p className="text-blue-600">{responseDetails.format}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Total Calls:</span>
                <p className="text-blue-600">{responseDetails.totalCalls}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">With Recordings:</span>
                <p className="text-blue-600">{responseDetails.callsWithRecordings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Failed to load calls:</strong> {error}
              </div>
              <Button variant="outline" size="sm" onClick={fetchCampaignCalls}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
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
      )}

      {/* No Calls Found */}
      {!isLoading && calls.length === 0 && !error && (
        <Card>
          <CardContent className="p-8 text-center">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
            <p className="text-gray-500">No call logs available for this campaign in the specified date range.</p>
          </CardContent>
        </Card>
      )}

      {/* Calls List */}
      {!isLoading && calls.length > 0 && (
        <div className="space-y-3">
          {calls.map((call) => (
            <Card key={call.callId} className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">Call {call.callId}</h4>
                      {getDirectionBadge(call.direction)}
                      {call.hasRecording && <Badge variant="outline">🎵 Recording</Badge>}
                      {call.revenue > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(call.revenue)}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Agent:</span> {call.agent}
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
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Time:</span> {format(new Date(call.startTime), "MMM dd, HH:mm")}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
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
                              Processing...
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4 mr-2" />
                              Transcribe with Deepgram
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Listen
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={call.recordingUrl} download={`call_${call.callId}.mp3`}>
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
    </div>
  )
}
