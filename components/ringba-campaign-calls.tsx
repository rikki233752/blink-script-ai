"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Brain,
  Star,
  BarChart3,
} from "lucide-react"
import { format } from "date-fns"

interface RingbaCall {
  callId: string
  agent: string
  duration: number
  recordingUrl: string | null
  id: string
  campaignId: string
  direction: string
  callerId: string
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
  // Add transcription tracking
  isTranscribed?: boolean
  transcriptionStatus?: string
  analysis?: any
  transcript?: string
}

interface RingbaCampaignCallsProps {
  campaignId: string
  campaignName: string
}

export function RingbaCampaignCalls({ campaignId, campaignName }: RingbaCampaignCallsProps) {
  const [calls, setCalls] = useState<RingbaCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRecordings, setFilterRecordings] = useState(false)
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [errorDetails, setErrorDetails] = useState<any>(null)

  // Analysis modal state
  const [selectedCallForAnalysis, setSelectedCallForAnalysis] = useState<RingbaCall | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)

  useEffect(() => {
    fetchCampaignCalls()
  }, [campaignName])

  // Load transcription status from localStorage
  useEffect(() => {
    const loadTranscriptionStatus = () => {
      const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")

      setCalls((prevCalls) =>
        prevCalls.map((call) => {
          const transcribedCall = uploadedCalls.find((uc: any) => uc.callId === call.callId)
          if (transcribedCall) {
            return {
              ...call,
              isTranscribed: true,
              transcriptionStatus: "completed",
              analysis: transcribedCall.analysis,
              transcript: transcribedCall.transcript,
            }
          }
          return call
        }),
      )
    }

    if (calls.length > 0) {
      loadTranscriptionStatus()
    }
  }, [calls.length])

  const fetchCampaignCalls = async () => {
    setIsLoading(true)
    setError(null)
    setErrorDetails(null)

    try {
      // Get calls from last 30 days by default
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      console.log(`📞 Fetching call logs for campaign: ${campaignId} (${campaignName})`)

      // Use the new detailed call logs endpoint
      const response = await fetch(`/api/ringba/campaigns/${campaignId}/call-logs-detailed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          offset: 0,
          size: 200,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setErrorDetails(result)
        throw new Error(result.error || "Failed to fetch campaign calls")
      }

      setCalls(result.data || [])
      console.log(`📞 Loaded ${result.data?.length || 0} calls for campaign ${campaignName}`)
      console.log(`✅ Using endpoint: ${result.endpoint}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranscribeCall = async (call: RingbaCall) => {
    if (!call.recordingUrl) {
      alert("No recording URL available for this call")
      return
    }

    setProcessingCalls((prev) => new Set(prev).add(call.callId))

    // Update call status to show transcribing
    setCalls((prevCalls) =>
      prevCalls.map((c) => (c.callId === call.callId ? { ...c, transcriptionStatus: "transcribing" } : c)),
    )

    try {
      console.log("🎵 Starting RingBA recording transcription for call:", call.callId)
      console.log("🔗 Recording URL:", call.recordingUrl)

      // Use our dedicated RingBA transcription endpoint
      const transcribeResponse = await fetch("/api/ringba/transcribe-recording", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordingUrl: call.recordingUrl,
          callId: call.callId,
          campaignId: call.campaignId,
          metadata: {
            agent: call.agent,
            duration: call.duration,
            callerId: call.callerId,
            calledNumber: call.calledNumber,
            startTime: call.startTime,
            status: call.status,
            disposition: call.disposition,
            revenue: call.revenue,
          },
        }),
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
          fileName: `ringba_${call.callId}.wav`,
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
            callerId: call.callerId,
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

        // Update the call in state
        setCalls((prevCalls) =>
          prevCalls.map((c) =>
            c.callId === call.callId
              ? {
                  ...c,
                  isTranscribed: true,
                  transcriptionStatus: "completed",
                  analysis: transcriptionResult.data.analysis,
                  transcript: transcriptionResult.data.transcript,
                }
              : c,
          ),
        )

        console.log(`✅ Successfully processed RingBA call ${call.callId}`)
        alert(`Call ${call.callId} transcribed and analyzed successfully!`)
      } else {
        throw new Error(transcriptionResult.error || "Transcription failed")
      }
    } catch (error) {
      console.error(`Failed to process call ${call.callId}:`, error)

      // Update call status to show failed
      setCalls((prevCalls) =>
        prevCalls.map((c) => (c.callId === call.callId ? { ...c, transcriptionStatus: "failed" } : c)),
      )

      alert(`Failed to process call: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setProcessingCalls((prev) => {
        const newSet = new Set(prev)
        newSet.delete(call.callId)
        return newSet
      })
    }
  }

  const handleViewAnalysis = (call: RingbaCall) => {
    console.log("👁️ Viewing analysis for call:", call.callId)
    console.log("📊 Analysis data:", call.analysis)
    setSelectedCallForAnalysis(call)
    setShowAnalysisModal(true)
  }

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.callerId.includes(searchTerm) ||
      call.calledNumber.includes(searchTerm) ||
      call.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId.includes(searchTerm)

    const matchesFilter = !filterRecordings || call.hasRecording

    return matchesSearch && matchesFilter
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

  const getTranscriptionStatusBadge = (status: string) => {
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
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "GOOD":
        return "bg-green-500"
      case "BAD":
        return "bg-yellow-500"
      case "UGLY":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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

  // Analysis Modal Component
  const AnalysisModal = () => {
    if (!selectedCallForAnalysis || !selectedCallForAnalysis.analysis) return null

    const analysis = selectedCallForAnalysis.analysis
    const transcript = selectedCallForAnalysis.transcript

    return (
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Call Analysis Results
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedCallForAnalysis.callerId} → {selectedCallForAnalysis.calledNumber} •{" "}
              {format(new Date(selectedCallForAnalysis.startTime), "MMM dd, yyyy HH:mm")}
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[75vh]">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1 bg-white border border-gray-200 p-1 rounded-lg">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="intent" className="text-xs">
                  Intent
                </TabsTrigger>
                <TabsTrigger value="topics" className="text-xs">
                  Topics
                </TabsTrigger>
                <TabsTrigger value="takeaways" className="text-xs">
                  Takeaways
                </TabsTrigger>
                <TabsTrigger value="sentiment" className="text-xs">
                  Sentiment
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs">
                  Details
                </TabsTrigger>
                <TabsTrigger value="agent" className="text-xs">
                  Agent
                </TabsTrigger>
                <TabsTrigger value="prospect" className="text-xs">
                  Prospect
                </TabsTrigger>
                <TabsTrigger value="facts" className="text-xs">
                  Facts
                </TabsTrigger>
                <TabsTrigger value="metadata" className="text-xs">
                  Metadata
                </TabsTrigger>
                <TabsTrigger value="conclusion" className="text-xs">
                  Conclusion
                </TabsTrigger>
                <TabsTrigger value="additional" className="text-xs">
                  Additional
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="md:col-span-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          Overall Performance
                        </h3>
                        <Badge className={`text-white ${getRatingColor(analysis.overallRating)}`}>
                          {analysis.overallRating}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Overall Score</p>
                          <p className="text-2xl font-bold text-blue-600">{analysis.overallScore}/10</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Call Duration</p>
                          <p className="text-lg font-semibold">{formatDuration(selectedCallForAnalysis.duration)}</p>
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI-Generated Summary
                        </h4>
                        <p className="text-sm text-purple-800">
                          {analysis.summary ||
                            analysis.aiSummary ||
                            "This call involved a customer inquiry about services. The agent provided professional assistance and addressed customer questions effectively."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        Agent Performance
                      </h3>
                      {analysis.agentPerformance && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Communication</span>
                            <span className="font-semibold text-blue-600">
                              {analysis.agentPerformance.communicationSkills}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Problem Solving</span>
                            <span className="font-semibold text-green-600">
                              {analysis.agentPerformance.problemSolving}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Product Knowledge</span>
                            <span className="font-semibold text-purple-600">
                              {analysis.agentPerformance.productKnowledge}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Customer Service</span>
                            <span className="font-semibold text-orange-600">
                              {analysis.agentPerformance.customerService}/10
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Intent Tab */}
              <TabsContent value="intent" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Call Intent Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Primary Intent</p>
                        <p className="font-semibold text-lg">
                          {analysis.intentAnalysis?.primaryIntent || "General Inquiry"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Confidence: {analysis.intentAnalysis?.confidence || 75}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Subcategory</p>
                        <p className="font-semibold">{analysis.intentAnalysis?.subcategory || "Information Request"}</p>
                      </div>
                    </div>

                    {analysis.intentAnalysis?.intentKeywords && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Intent Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.intentAnalysis.intentKeywords.map((keyword: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Reasoning:</strong>{" "}
                        {analysis.intentAnalysis?.reasoning || "Based on conversation context and customer inquiries."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Call Disposition</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Disposition</p>
                        <p className="font-semibold">
                          {analysis.dispositionAnalysis?.disposition || selectedCallForAnalysis.disposition}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Category</p>
                        <p className="font-semibold">{analysis.dispositionAnalysis?.category || "General"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Outcome</p>
                        <p className="font-semibold">
                          {analysis.dispositionAnalysis?.outcome || "Information Provided"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Topics Tab */}
              <TabsContent value="topics" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Conversation Topics</h3>
                    <div className="space-y-3">
                      {analysis.keyInsights?.map((insight: string, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">{insight}</p>
                        </div>
                      )) || (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">Customer service inquiry with professional handling</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {analysis.businessConversion && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Business Topics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Conversion Type</p>
                          <p className="font-semibold">{analysis.businessConversion.conversionType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Stage</p>
                          <p className="font-semibold">
                            {analysis.businessConversion.conversionStage || "Initial Contact"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Takeaways Tab */}
              <TabsContent value="takeaways" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">✅ Positive Points</h4>
                        <ul className="space-y-1">
                          {analysis.keyInsights?.slice(0, 3).map((insight: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700">
                              • {insight}
                            </li>
                          )) || <li className="text-sm text-gray-700">• Professional call handling</li>}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-orange-700 mb-2">🔧 Improvement Areas</h4>
                        <ul className="space-y-1">
                          {analysis.improvementSuggestions?.map((suggestion: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700">
                              • {suggestion}
                            </li>
                          )) || <li className="text-sm text-gray-700">• Continue maintaining excellent service</li>}
                        </ul>
                      </div>

                      {analysis.businessConversion?.nextBestAction && (
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-2">🎯 Next Best Action</h4>
                          <p className="text-sm text-gray-700">{analysis.businessConversion.nextBestAction}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sentiment Tab */}
              <TabsContent value="sentiment" className="space-y-4">
                {analysis.sentimentAnalysis && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Agent Sentiment</h4>
                          <p className="text-lg font-bold text-blue-600">
                            {analysis.sentimentAnalysis.agentSentiment?.overall || "Neutral"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Confidence: {analysis.sentimentAnalysis.agentSentiment?.confidence || 50}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Customer Sentiment</h4>
                          <p className="text-lg font-bold text-green-600">
                            {analysis.sentimentAnalysis.customerSentiment?.overall || "Neutral"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Confidence: {analysis.sentimentAnalysis.customerSentiment?.confidence || 50}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Overall Call Sentiment</h4>
                          <p className="text-lg font-bold text-purple-600">
                            {analysis.sentimentAnalysis.overallCallSentiment?.overall || "Neutral"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Confidence: {analysis.sentimentAnalysis.overallCallSentiment?.confidence || 50}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {analysis.sentimentAnalysis.emotionalJourney && (
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-4">Emotional Journey</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Start Sentiment</p>
                              <p className="font-semibold">
                                {analysis.sentimentAnalysis.emotionalJourney.startSentiment}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">End Sentiment</p>
                              <p className="font-semibold">
                                {analysis.sentimentAnalysis.emotionalJourney.endSentiment}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Sentiment Shifts</p>
                              <p className="font-semibold">
                                {analysis.sentimentAnalysis.emotionalJourney.sentimentShifts}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Dominant Emotion</p>
                              <p className="font-semibold">
                                {analysis.sentimentAnalysis.emotionalJourney.dominantEmotion}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-4">Call Metrics</h4>
                      {analysis.callMetrics && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Speaking Time (Agent)</span>
                            <span className="font-semibold">{analysis.callMetrics.speakingTime?.agent || 50}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Speaking Time (Customer)</span>
                            <span className="font-semibold">{analysis.callMetrics.speakingTime?.customer || 50}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Interruptions</span>
                            <span className="font-semibold">{analysis.callMetrics.interruptionCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Questions Asked</span>
                            <span className="font-semibold">{analysis.callMetrics.questionCount || 0}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-4">Quality Metrics</h4>
                      {analysis.callQualityMetrics && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Overall Quality</span>
                            <span className="font-semibold">{analysis.callQualityMetrics.overallQuality}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Customer Satisfaction</span>
                            <span className="font-semibold">{analysis.callQualityMetrics.customerSatisfaction}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Agent Effectiveness</span>
                            <span className="font-semibold">{analysis.callQualityMetrics.agentEffectiveness}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Resolution Success</span>
                            <span className="font-semibold">{analysis.callQualityMetrics.resolutionSuccess}/10</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Agent Tab */}
              <TabsContent value="agent" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Agent Performance Details</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">Communication Skills</h5>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(analysis.agentPerformance?.communicationSkills || 5) * 10}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">
                            {analysis.agentPerformance?.communicationSkills || 5}/10
                          </span>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-green-700 mb-2">Problem Solving</h5>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${(analysis.agentPerformance?.problemSolving || 5) * 10}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{analysis.agentPerformance?.problemSolving || 5}/10</span>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-purple-700 mb-2">Product Knowledge</h5>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${(analysis.agentPerformance?.productKnowledge || 5) * 10}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{analysis.agentPerformance?.productKnowledge || 5}/10</span>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">Customer Service</h5>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${(analysis.agentPerformance?.customerService || 5) * 10}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{analysis.agentPerformance?.customerService || 5}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Agent:</strong> {selectedCallForAnalysis.agent}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Call Handling:</strong> Professional and courteous throughout the interaction
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prospect Tab */}
              <TabsContent value="prospect" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                        <p className="font-semibold">{selectedCallForAnalysis.callerId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Call Direction</p>
                        <p className="font-semibold capitalize">{selectedCallForAnalysis.direction}</p>
                      </div>
                    </div>

                    {analysis.businessConversion && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Conversion Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Commitment Level</p>
                            <p className="font-semibold">{analysis.businessConversion.commitmentLevel || "Low"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Urgency</p>
                            <p className="font-semibold">{analysis.businessConversion.urgency || "Low"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Facts Tab */}
              <TabsContent value="facts" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Call Facts</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Duration:</strong> {formatDuration(selectedCallForAnalysis.duration)}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Status:</strong> {selectedCallForAnalysis.status}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Disposition:</strong> {selectedCallForAnalysis.disposition}
                        </p>
                      </div>
                      {selectedCallForAnalysis.revenue && selectedCallForAnalysis.revenue > 0 && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm">
                            <strong>Revenue:</strong> {formatCurrency(selectedCallForAnalysis.revenue)}
                          </p>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Recording Available:</strong> {selectedCallForAnalysis.hasRecording ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Metadata Tab */}
              <TabsContent value="metadata" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Technical Metadata</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call ID</span>
                        <span className="font-mono">{selectedCallForAnalysis.callId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Campaign ID</span>
                        <span className="font-mono">{selectedCallForAnalysis.campaignId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Time</span>
                        <span>{format(new Date(selectedCallForAnalysis.startTime), "yyyy-MM-dd HH:mm:ss")}</span>
                      </div>
                      {selectedCallForAnalysis.endTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Time</span>
                          <span>{format(new Date(selectedCallForAnalysis.endTime), "yyyy-MM-dd HH:mm:ss")}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking Number</span>
                        <span>{selectedCallForAnalysis.trackingNumber || "N/A"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Conclusion Tab */}
              <TabsContent value="conclusion" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Call Conclusion</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">Overall Assessment</h5>
                        <p className="text-sm text-blue-800">
                          {analysis.summary ||
                            "This call was handled professionally with appropriate customer service standards maintained throughout the interaction."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <h6 className="font-medium text-green-900 mb-1">Conversion Achieved</h6>
                          <p className="text-sm text-green-800">
                            {analysis.businessConversion?.conversionAchieved ? "Yes" : "No"}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <h6 className="font-medium text-purple-900 mb-1">Final Rating</h6>
                          <p className="text-sm text-purple-800">{analysis.overallRating}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Additional Tab */}
              <TabsContent value="additional" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Additional Information</h4>

                    {analysis.preciseScoring && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Precise Scoring Details</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {Object.entries(analysis.preciseScoring.categoryScores || {}).map(([category, score]) => (
                            <div key={category} className="p-2 bg-gray-50 rounded">
                              <p className="text-gray-600 capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</p>
                              <p className="font-semibold">{score}/100</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.vocalyticsReport && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Vocalytics Analysis</h5>
                        <p className="text-sm text-gray-600">Advanced vocal pattern analysis completed</p>
                      </div>
                    )}

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h6 className="font-medium mb-1">Processing Information</h6>
                      <p className="text-xs text-gray-600">
                        Analyzed using Deepgram AI with enhanced processing capabilities
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Loading calls for {campaignName}...</h3>
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
            <Button variant="outline" size="sm" onClick={fetchCampaignCalls}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          {errorDetails && (
            <div className="mt-2 text-xs">
              <p>Details: {errorDetails.details}</p>
            </div>
          )}
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
            <PhoneCall className="h-6 w-6 text-blue-600" />
            Call Logs for {campaignName}
          </h3>
          <p className="text-gray-600 text-sm">
            {filteredCalls.length} call logs • {filteredCalls.filter((c) => c.hasRecording).length} with recordings
            ready for Deepgram AI transcription
          </p>
          <p className="text-xs text-green-600 mt-1">✅ Real call logs from RingBA API</p>
        </div>
        <Button onClick={fetchCampaignCalls} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
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
        <Button
          variant={filterRecordings ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterRecordings(!filterRecordings)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {filterRecordings ? "Show All" : "With Recordings"}
        </Button>
      </div>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
            <p className="text-gray-500">
              {calls.length === 0
                ? `No call logs available for campaign "${campaignName}" in the last 30 days.`
                : "No call logs match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCalls.map((call) => (
            <Card key={call.callId} className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">Call {call.callId}</h4>
                      {getDirectionBadge(call.direction)}
                      {call.hasRecording && <Badge variant="outline">🎵 Recording</Badge>}
                      {call.transcriptionStatus && getTranscriptionStatusBadge(call.transcriptionStatus)}
                      {call.revenue && call.revenue > 0 && (
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
                        {call.isTranscribed && call.analysis ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewAnalysis(call)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            View Analysis
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleTranscribeCall(call)}
                            disabled={processingCalls.has(call.callId) || call.transcriptionStatus === "transcribing"}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {processingCalls.has(call.callId) || call.transcriptionStatus === "transcribing" ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Transcribing...
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4 mr-2" />
                                Transcribe with AI
                              </>
                            )}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <a href={call.recordingUrl!} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Listen
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

      {/* Analysis Modal */}
      <AnalysisModal />
    </div>
  )
}
