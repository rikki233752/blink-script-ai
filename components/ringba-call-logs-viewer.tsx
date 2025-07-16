"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone,
  Play,
  Clock,
  User,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Calendar,
  Download,
  Code,
  FileJson,
  Table,
} from "lucide-react"
import { format } from "date-fns"

interface CallLog {
  id: string
  callId: string
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
  recordingUrl: string | null
  hasRecording: boolean
  agent: string
  agentName: string
  revenue: number
  cost: number
  quality: string | null
  tags: string[]
  publisherName: string
  isTranscribed: boolean
  transcriptionStatus: string
  transcript: string | null
  analysis: any
  metadata: any
  ringbaData?: any
}

export function RingbaCallLogsViewer() {
  const [campaignName, setCampaignName] = useState("Medi (2) - Tier 2")
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRecordings, setFilterRecordings] = useState(false)
  const [activeTab, setActiveTab] = useState("formatted")

  const fetchCallLogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get calls from last 30 days by default
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      console.log(`📞 Fetching call logs for campaign: ${campaignName}`)

      const params = new URLSearchParams({
        campaignName,
        startDate,
        endDate,
        limit: "100",
      })

      const response = await fetch(`/api/ringba/call-logs?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch call logs")
      }

      setCallLogs(result.data || [])
      setRawResponse(result)
      console.log(`📞 Loaded ${result.data?.length || 0} calls for campaign ${campaignName}`)
      console.log(`✅ Using endpoint: ${result.endpoint}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Add validation to ensure we're getting real data
  const isRealData = rawResponse?.mockData === false && rawResponse?.realApiCall === true
  const dataSource = rawResponse?.dataSource || "UNKNOWN"

  // Show warning if not real data
  const showDataWarning = !isRealData || dataSource !== "RINGBA_API_REAL"

  const filteredCallLogs = callLogs.filter((call) => {
    const matchesSearch =
      call.callerId?.includes(searchTerm) ||
      call.calledNumber?.includes(searchTerm) ||
      call.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId?.includes(searchTerm)

    const matchesFilter = !filterRecordings || call.hasRecording

    return matchesSearch && matchesFilter
  })

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              RingBA Call Logs Viewer
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Campaign name..."
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={fetchCallLogs} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Fetch Call Logs"
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Failed to load call logs:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {showDataWarning && rawResponse && (
            <Alert className="border-yellow-200 bg-yellow-50 mb-4">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Data Source Warning:</strong>
                {!isRealData && " This may not be real RingBA data."}
                {dataSource !== "RINGBA_API_REAL" && ` Data source: ${dataSource}`}
                <br />
                <strong>Real API Call:</strong> {rawResponse.realApiCall ? "✅ Yes" : "❌ No"}
                <br />
                <strong>Mock Data:</strong> {rawResponse.mockData ? "❌ Yes" : "✅ No"}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="formatted" className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                Formatted Call Logs
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Raw API Response
              </TabsTrigger>
              <TabsTrigger value="request" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                API Request
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formatted">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Call Logs for &quot;{campaignName}&quot;</h3>
                    <p className="text-gray-600 text-sm">
                      {filteredCallLogs.length} call logs • {filteredCallLogs.filter((c) => c.hasRecording).length} with
                      recordings
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="relative max-w-xs">
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
                </div>

                {isLoading ? (
                  <LoadingSkeleton />
                ) : filteredCallLogs.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
                      <p className="text-gray-500">
                        {callLogs.length === 0
                          ? `No call logs available for campaign "${campaignName}" in the last 30 days.`
                          : "No call logs match your current filters."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredCallLogs.map((call) => (
                      <Card
                        key={call.callId}
                        className="border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-gray-900">Call {call.callId}</h4>
                                {getDirectionBadge(call.direction || "inbound")}
                                {call.hasRecording && <Badge variant="outline">🎵 Recording</Badge>}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">Agent:</span> {call.agentName || "Unknown"}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">Duration:</span> {formatDuration(call.duration)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  <span className="font-medium">From:</span> {call.callerId || "Unknown"}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">Time:</span>{" "}
                                  {call.startTime ? format(new Date(call.startTime), "MMM dd, HH:mm") : "Unknown"}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600">
                                  <span className="font-medium">To:</span> {call.calledNumber || "Unknown"}
                                </span>
                                <span className="text-gray-600">
                                  <span className="font-medium">Status:</span> {call.status || "Unknown"}
                                </span>
                                <span className="text-gray-600">
                                  <span className="font-medium">Disposition:</span> {call.disposition || "Unknown"}
                                </span>
                                {call.publisherName && (
                                  <span className="text-gray-600">
                                    <span className="font-medium">Publisher:</span> {call.publisherName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-6">
                              {call.recordingUrl && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                                    <Play className="h-4 w-4 mr-2" />
                                    Listen to Recording
                                  </a>
                                </Button>
                              )}
                              {call.recordingUrl && (
                                <Button variant="outline" size="sm" asChild>
                                  <a
                                    href={call.recordingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={`call_${call.callId}.wav`}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
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
              </div>
            </TabsContent>

            <TabsContent value="raw">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Raw API Response</h3>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[600px]">
                    <pre className="text-xs">{JSON.stringify(rawResponse, null, 2)}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="request">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">API Request Details</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Endpoint:</h4>
                      <code className="bg-gray-100 p-2 rounded block">
                        POST {rawResponse?.endpoint || "/api/ringba/call-logs"}
                      </code>
                    </div>

                    <div>
                      <h4 className="font-medium">Headers:</h4>
                      <code className="bg-gray-100 p-2 rounded block">
                        Authorization: Token [REDACTED]
                        <br />
                        Content-Type: application/json
                        <br />
                        Accept: application/json
                      </code>
                    </div>

                    <div>
                      <h4 className="font-medium">Request Body:</h4>
                      <div className="bg-gray-100 p-2 rounded overflow-auto max-h-[300px]">
                        <pre className="text-xs">{JSON.stringify(rawResponse?.requestBody || {}, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
