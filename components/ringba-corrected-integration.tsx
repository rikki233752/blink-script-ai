"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Phone, Clock, DollarSign, Play, Target, User } from "lucide-react"

interface CallLog {
  id: string
  campaignId: string
  campaignName: string
  callerId: string
  trackingNumber: string
  targetNumber: string
  startTime: string
  duration: number
  connectedDuration: number
  timeToConnect: number
  hasRecording: boolean
  recordingUrl: string | null
  agentName: string
  publisherName: string
  status: "connected" | "not-connected"
  disposition: "converted" | "not-converted"
  revenue: number
  cost: number
  payout: number
  endCallSource: string
}

export default function RingBACorrectedIntegration() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campaignId, setCampaignId] = useState("CA1654a4bb6aee4c93ac0d23b930069b63")
  const [totalRecords, setTotalRecords] = useState(0)
  const [transactionId, setTransactionId] = useState("")
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [columnNamesUsed, setColumnNamesUsed] = useState<string[]>([])

  const fetchCallLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ringba/call-logs-corrected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          reportStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          reportEnd: new Date().toISOString(),
          offset: 0,
          size: 100,
        }),
      })

      const data = await response.json()
      setRawResponse(data)

      if (data.success) {
        setCallLogs(data.callLogs || [])
        setTotalRecords(data.totalRecords || 0)
        setTransactionId(data.transactionId || "")
        setColumnNamesUsed(data.columnNamesUsed || [])
      } else {
        setError(data.error || "Failed to fetch call logs")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">RingBA Corrected Integration</h1>
        <p className="text-muted-foreground">
          Using correct column names: <code className="bg-muted px-1 rounded">callLengthInSeconds</code> from API
          documentation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Fetch Call Logs with Correct Column Names
          </CardTitle>
          <CardDescription>
            Using <strong>callLengthInSeconds</strong> and other verified column names from ringba-api-samples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="campaignId">Campaign ID</Label>
              <Input
                id="campaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="CA1654a4bb6aee4c93ac0d23b930069b63"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchCallLogs} disabled={loading || !campaignId}>
                {loading ? "Fetching..." : "Fetch Call Logs"}
              </Button>
            </div>
          </div>

          {columnNamesUsed.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800 mb-2">Column Names Used:</p>
              <div className="flex flex-wrap gap-1">
                {columnNamesUsed.map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          {callLogs.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">Success!</p>
                <p className="text-green-600">
                  Fetched {callLogs.length} call logs (Total: {totalRecords})
                </p>
                {transactionId && <p className="text-sm text-green-600">Transaction ID: {transactionId}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(callLogs.length > 0 || rawResponse) && (
        <Tabs defaultValue="call-logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="call-logs">Call Logs ({callLogs.length})</TabsTrigger>
            <TabsTrigger value="raw-response">Raw API Response</TabsTrigger>
          </TabsList>

          <TabsContent value="call-logs" className="space-y-4">
            {callLogs.map((call) => (
              <Card key={call.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{call.campaignName}</h3>
                        <Badge variant={call.status === "connected" ? "default" : "secondary"}>{call.status}</Badge>
                        <Badge variant={call.disposition === "converted" ? "default" : "outline"}>
                          {call.disposition}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Caller ID</p>
                            <p className="font-medium">{call.callerId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Target</p>
                            <p className="font-medium">{call.targetNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Agent</p>
                            <p className="font-medium">{call.agentName}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Publisher</p>
                          <p className="font-medium">{call.publisherName}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Total Duration</p>
                            <p className="font-medium">{formatDuration(call.duration)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Connected Duration</p>
                          <p className="font-medium">{formatDuration(call.connectedDuration)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Time to Connect</p>
                          <p className="font-medium">{call.timeToConnect}s</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Source</p>
                          <p className="font-medium">{call.endCallSource}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-medium">{formatCurrency(call.revenue)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost</p>
                          <p className="font-medium">{formatCurrency(call.cost)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payout</p>
                          <p className="font-medium">{formatCurrency(call.payout)}</p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Call ID: {call.id}</p>
                        <p>Tracking Number: {call.trackingNumber}</p>
                        <p>Started: {new Date(call.startTime).toLocaleString()}</p>
                      </div>
                    </div>

                    {call.hasRecording && call.recordingUrl && (
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="text-xs">
                          Has Recording
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(call.recordingUrl!, "_blank")}
                          className="flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Play
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="raw-response">
            <Card>
              <CardHeader>
                <CardTitle>Raw API Response</CardTitle>
                <CardDescription>The complete response from the RingBA API with correct column names</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
