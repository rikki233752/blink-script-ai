"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
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
  supportsSorting: boolean
  isComputed: boolean
  roles: string[]
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

interface RingBACallLog {
  inboundCallId: string
  callDt: string
  campaignId: string
  campaignName: string
  inboundPhoneNumber: string
  callLengthInSeconds: number
  hasConnected: boolean
  hasConverted: boolean
  recordingUrl: string | null
  hasRecording: boolean
  buyer: string
  targetName: string
  publisherName: string
  payoutAmount: number
}

export function RingBACompleteIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "testing" | "connected" | "failed">("unknown")
  const [connectionData, setConnectionData] = useState<any>(null)
  const [columns, setColumns] = useState<RingBAColumn[]>([])
  const [campaigns, setCampaigns] = useState<RingBACampaign[]>([])
  const [callLogs, setCallLogs] = useState<RingBACallLog[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<RingBACampaign | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("connection")

  // Call logs filters
  const [reportStart, setReportStart] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split("T")[0])
  const [getAllPages, setGetAllPages] = useState(false)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setConnectionStatus("testing")
    setError(null)

    try {
      const response = await fetch("/api/ringba/connection-test")
      const result = await response.json()

      if (result.success) {
        setConnectionStatus("connected")
        setConnectionData(result.data)
        // Auto-fetch columns and campaigns on successful connection
        await fetchColumns()
        await fetchCampaigns()
      } else {
        setConnectionStatus("failed")
        setError(result.error)
      }
    } catch (err) {
      setConnectionStatus("failed")
      setError(err instanceof Error ? err.message : "Connection test failed")
    }
  }

  const fetchColumns = async () => {
    try {
      const response = await fetch("/api/ringba/columns")
      const result = await response.json()

      if (result.success) {
        setColumns(result.columns || [])
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch columns")
    }
  }

  const fetchCampaigns = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ringba/campaigns-complete")
      const result = await response.json()

      if (result.success) {
        setCampaigns(result.campaigns || [])
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCallLogs = async (campaign: RingBACampaign) => {
    setIsLoading(true)
    setSelectedCampaign(campaign)
    setActiveTab("calllogs")

    try {
      const response = await fetch("/api/ringba/call-logs-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          reportStart: `${reportStart}T00:00:00Z`,
          reportEnd: `${reportEnd}T23:59:59Z`,
          getAllPages,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCallLogs(result.callLogs || [])
      } else {
        setError(result.error)
        setCallLogs([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch call logs")
      setCallLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )
      case "testing":
        return (
          <Badge className="bg-blue-500 text-white">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Testing...
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
        return (
          <Badge className="bg-gray-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
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
            RingBA Complete Integration
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600">Step-by-step API implementation with exact logic</p>
            {getConnectionStatusBadge()}
          </div>
        </div>
        <Button onClick={testConnection} variant="outline" disabled={connectionStatus === "testing"}>
          <RefreshCw className={`h-4 w-4 mr-2 ${connectionStatus === "testing" ? "animate-spin" : ""}`} />
          Test Connection
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection">
            <CheckCircle className="h-4 w-4 mr-2" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="columns">
            <Database className="h-4 w-4 mr-2" />
            Columns
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="calllogs">
            <FileText className="h-4 w-4 mr-2" />
            Call Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Connection Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>API Endpoint</Label>
                  <Input value="GET /account" disabled />
                </div>
                <div>
                  <Label>Authentication</Label>
                  <Input value="Token {RINGBA_API_KEY}" disabled />
                </div>
              </div>

              {connectionData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Connection Response:</h4>
                  <pre className="text-sm overflow-auto">{JSON.stringify(connectionData, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Available Columns</CardTitle>
            </CardHeader>
            <CardContent>
              {columns.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No columns loaded. Test connection first.</p>
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
                            <div className="flex gap-2">
                              <Badge variant="outline">{column.type}</Badge>
                              {column.isComputed && <Badge className="bg-blue-100 text-blue-800">Computed</Badge>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">ID: {column.id}</p>
                          <p className="text-sm text-gray-600 mb-2">Group: {column.groupName}</p>
                          <div className="flex gap-2 flex-wrap">
                            {column.supportsFilter && <Badge className="bg-green-100 text-green-800">Filterable</Badge>}
                            {column.supportsSorting && (
                              <Badge className="bg-purple-100 text-purple-800">Sortable</Badge>
                            )}
                            {column.roles.includes("buyer") && (
                              <Badge className="bg-orange-100 text-orange-800">Buyer</Badge>
                            )}
                          </div>
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
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No campaigns found. Check your connection.</p>
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
                          <Button onClick={() => fetchCallLogs(campaign)} disabled={isLoading}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Call Logs
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
              <CardTitle>Step 4: Call Logs</CardTitle>
              {selectedCampaign && <p className="text-sm text-gray-600">Campaign: {selectedCampaign.name}</p>}
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
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
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="getAllPages"
                    checked={getAllPages}
                    onChange={(e) => setGetAllPages(e.target.checked)}
                  />
                  <Label htmlFor="getAllPages">Get All Pages</Label>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : callLogs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    {selectedCampaign
                      ? "No call logs found for this campaign."
                      : "Select a campaign to view call logs."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callLogs.map((call) => (
                    <Card key={call.inboundCallId} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{call.inboundPhoneNumber}</h4>
                              {call.hasConnected && <Badge className="bg-green-100 text-green-800">Connected</Badge>}
                              {call.hasConverted && <Badge className="bg-blue-100 text-blue-800">Converted</Badge>}
                              {call.hasRecording && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  Recording
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(call.callDt), "MMM dd, HH:mm")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(call.callLengthInSeconds)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{call.targetName}</span>
                              </div>
                              <div>
                                <span className="font-medium">Publisher:</span> {call.publisherName || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Payout:</span> ${call.payoutAmount || "0.00"}
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
