"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Phone,
  Target,
  Database,
  PlayCircle,
  Calendar,
  Clock,
  User,
  Download,
  FileText,
  AlertCircle,
  Info,
} from "lucide-react"
import { format } from "date-fns"

interface RingBAColumn {
  id: string
  title: string
  type: string
  groupName: string
  supportsFilter: boolean
}

interface RingBACampaign {
  id: string
  name: string
  status: string
  type: string
  isActive: boolean
  totalCalls: number
  conversionRate: number
}

interface TransformedCallLog {
  id: string
  campaignId: string
  callerId: string
  startTime: string
  duration: number
  hasRecording: boolean
  recordingUrl: string | null
  agentName: string
  status: "connected" | "not-connected"
  disposition: "converted" | "not-converted"
}

export function RingBAComprehensiveDashboard() {
  const [step1Status, setStep1Status] = useState<"pending" | "loading" | "success" | "error">("pending")
  const [step2Status, setStep2Status] = useState<"pending" | "loading" | "success" | "error">("pending")
  const [step3Status, setStep3Status] = useState<"pending" | "loading" | "success" | "error">("pending")
  const [step4Status, setStep4Status] = useState<"pending" | "loading" | "success" | "error">("pending")

  const [connectionData, setConnectionData] = useState<any>(null)
  const [columns, setColumns] = useState<RingBAColumn[]>([])
  const [campaigns, setCampaigns] = useState<RingBACampaign[]>([])
  const [callLogs, setCallLogs] = useState<TransformedCallLog[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<RingBACampaign | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Call logs filters
  const [reportStart, setReportStart] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    runStep1()
  }, [])

  const runStep1 = async () => {
    setStep1Status("loading")
    setError(null)

    try {
      const response = await fetch("/api/ringba/comprehensive/connection")
      const result = await response.json()

      if (result.success) {
        setStep1Status("success")
        setConnectionData(result.data)
        // Auto-run step 2
        setTimeout(() => runStep2(), 1000)
      } else {
        setStep1Status("error")
        setError(result.error)
      }
    } catch (err) {
      setStep1Status("error")
      setError(err instanceof Error ? err.message : "Step 1 failed")
    }
  }

  const runStep2 = async () => {
    setStep2Status("loading")

    try {
      const response = await fetch("/api/ringba/comprehensive/columns")
      const result = await response.json()

      if (result.success) {
        setStep2Status("success")
        setColumns(result.columns || [])
        // Auto-run step 3
        setTimeout(() => runStep3(), 1000)
      } else {
        setStep2Status("error")
        setError(result.error)
      }
    } catch (err) {
      setStep2Status("error")
      setError(err instanceof Error ? err.message : "Step 2 failed")
    }
  }

  const runStep3 = async () => {
    setStep3Status("loading")

    try {
      const response = await fetch("/api/ringba/comprehensive/campaigns")
      const result = await response.json()

      if (result.success) {
        setStep3Status("success")
        setCampaigns(result.campaigns || [])
      } else {
        setStep3Status("error")
        setError(result.error)
      }
    } catch (err) {
      setStep3Status("error")
      setError(err instanceof Error ? err.message : "Step 3 failed")
    }
  }

  const runStep4 = async (campaign: RingBACampaign) => {
    setStep4Status("loading")
    setSelectedCampaign(campaign)

    try {
      const response = await fetch("/api/ringba/comprehensive/call-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          reportStart: `${reportStart}T00:00:00Z`,
          reportEnd: `${reportEnd}T23:59:59Z`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStep4Status("success")
        setCallLogs(result.callLogs || [])
      } else {
        setStep4Status("error")
        setError(result.error)
        setCallLogs([])
      }
    } catch (err) {
      setStep4Status("error")
      setError(err instanceof Error ? err.message : "Step 4 failed")
      setCallLogs([])
    }
  }

  const getStepBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )
      case "loading":
        return (
          <Badge className="bg-blue-500 text-white">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Running...
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Phone className="h-8 w-8 text-blue-600" />
            RingBA Comprehensive Integration
          </h2>
          <p className="text-gray-600">Step-by-step API implementation with exact technical details</p>
        </div>
        <Button onClick={runStep1} variant="outline" disabled={step1Status === "loading"}>
          <RefreshCw className={`h-4 w-4 mr-2 ${step1Status === "loading" ? "animate-spin" : ""}`} />
          Restart Process
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Step Progress */}
      <Card>
        <CardHeader>
          <CardTitle>API Implementation Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Connection Test</h4>
                <p className="text-sm text-gray-600">GET /account</p>
                {getStepBadge(step1Status)}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Get Columns</h4>
                <p className="text-sm text-gray-600">GET /calllogs/columns</p>
                {getStepBadge(step2Status)}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Fetch Campaigns</h4>
                <p className="text-sm text-gray-600">GET /campaigns</p>
                {getStepBadge(step3Status)}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Call Logs</h4>
                <p className="text-sm text-gray-600">POST /calllogs</p>
                {getStepBadge(step4Status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Columns</p>
                <p className="text-2xl font-bold text-blue-600">{columns.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Campaigns</p>
                <p className="text-2xl font-bold text-green-600">{campaigns.length}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Call Logs</p>
                <p className="text-2xl font-bold text-purple-600">{callLogs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Recordings</p>
                <p className="text-2xl font-bold text-orange-600">
                  {callLogs.filter((call) => call.hasRecording).length}
                </p>
              </div>
              <PlayCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="columns">
            <Database className="h-4 w-4 mr-2" />
            Columns ({columns.length})
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="calllogs">
            <FileText className="h-4 w-4 mr-2" />
            Call Logs ({callLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Available Columns</CardTitle>
            </CardHeader>
            <CardContent>
              {columns.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No columns loaded. Run Step 2 first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Recommended Columns:</strong> inboundCallId, callDt, campaignId, campaignName,
                      inboundPhoneNumber, callLengthInSeconds, hasConnected, hasConverted, recordingUrl, hasRecording
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {columns.map((column) => (
                      <Card key={column.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{column.title}</h4>
                            <Badge variant="outline">{column.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">ID: {column.id}</p>
                          <p className="text-sm text-gray-600 mb-2">Group: {column.groupName}</p>
                          {column.supportsFilter && <Badge className="bg-green-100 text-green-800">Filterable</Badge>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No campaigns found. Run Step 3 first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{campaign.name}</h4>
                              <Badge variant={campaign.isActive ? "default" : "secondary"}>
                                {campaign.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">ID:</span> {campaign.id}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {campaign.type}
                              </div>
                              <div>
                                <span className="font-medium">Calls:</span> {campaign.totalCalls.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Conversion:</span> {campaign.conversionRate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <Button onClick={() => runStep4(campaign)} disabled={step4Status === "loading"}>
                            <FileText className="h-4 w-4 mr-2" />
                            Fetch Call Logs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calllogs">
          <Card>
            <CardHeader>
              <CardTitle>Step 4-6: Call Logs (Transformed)</CardTitle>
              {selectedCampaign && <p className="text-sm text-gray-600">Campaign: {selectedCampaign.name}</p>}
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="reportStart">Report Start</Label>
                  <Input
                    id="reportStart"
                    type="date"
                    value={reportStart}
                    onChange={(e) => setReportStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reportEnd">Report End</Label>
                  <Input id="reportEnd" type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
                </div>
              </div>

              {callLogs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    {selectedCampaign
                      ? "No call logs found for this campaign."
                      : "Select a campaign to fetch call logs."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Data Transformation Complete:</strong> Raw RingBA data has been transformed to app format
                      with standardized fields: id, campaignId, callerId, startTime, duration, status, disposition.
                    </AlertDescription>
                  </Alert>

                  {callLogs.map((call) => (
                    <Card key={call.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{call.callerId}</h4>
                              <Badge
                                className={
                                  call.status === "connected"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {call.status}
                              </Badge>
                              <Badge
                                className={
                                  call.disposition === "converted"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {call.disposition}
                              </Badge>
                              {call.hasRecording && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  Recording
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(call.startTime), "MMM dd, HH:mm")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(call.duration)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{call.agentName}</span>
                              </div>
                              <div>
                                <span className="font-medium">ID:</span> {call.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                          {call.recordingUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Recording
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
