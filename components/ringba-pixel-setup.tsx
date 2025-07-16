"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, Activity, BarChart3, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PixelSetupProps {
  userId?: string
}

interface CallEvent {
  id: string
  call_id: string
  campaign_id: string
  event_type: string
  caller_number: string
  target_number: string
  call_duration: number
  conversion_value: number
  timestamp: string
}

interface CallEventStats {
  totalEvents: number
  eventsByType: Record<string, number>
  totalConversions: number
  totalRevenue: number
  averageCallDuration: number
}

export default function RingbaPixelSetup({ userId }: PixelSetupProps) {
  const [pixelUrl, setPixelUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [events, setEvents] = useState<CallEvent[]>([])
  const [stats, setStats] = useState<CallEventStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("setup")
  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      setPixelUrl(`${baseUrl}/api/ringba/pixel?user_id=${userId}`)
    }
  }, [userId])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Pixel URL copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const fetchEvents = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch("/api/ringba/pixel/events?limit=20")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!userId) return

    try {
      const response = await fetch("/api/ringba/pixel/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents()
    } else if (activeTab === "analytics") {
      fetchStats()
    }
  }, [activeTab, userId])

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ringba Pixel Integration
          </CardTitle>
          <CardDescription>Set up pixel tracking to capture call events from your Ringba campaigns</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Pixel URL</CardTitle>
              <CardDescription>Copy this URL and add it as a pixel in your Ringba campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixel-url">Pixel URL</Label>
                <div className="flex gap-2">
                  <Input id="pixel-url" value={pixelUrl} readOnly className="font-mono text-sm" />
                  <Button onClick={() => copyToClipboard(pixelUrl)} variant="outline" size="icon">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>How to add this pixel in Ringba:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Go to your Ringba Campaign</li>
                    <li>Navigate to "Pixels" section</li>
                    <li>Click "Add Pixel"</li>
                    <li>Select trigger (e.g., "Call Started", "Call Ended", "Conversion")</li>
                    <li>Set Method to "POST"</li>
                    <li>Paste the pixel URL above</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Event Types</CardTitle>
              <CardDescription>These event types will be automatically tracked when triggered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "call_started",
                  "call_ended",
                  "call_answered",
                  "call_hangup",
                  "conversion",
                  "lead_generated",
                  "sale_completed",
                  "call_transferred",
                  "voicemail_left",
                ].map((eventType) => (
                  <Badge key={eventType} variant="secondary">
                    {eventType.replace("_", " ").toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Call Events</h3>
            <Button onClick={fetchEvents} disabled={loading} size="sm">
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          <div className="space-y-3">
            {events.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No call events received yet</p>
                    <p className="text-sm">Events will appear here once your pixel starts receiving data</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.event_type === "conversion" ? "default" : "secondary"}>
                            {event.event_type.replace("_", " ").toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">Call ID: {event.call_id}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          {event.caller_number && (
                            <p>
                              <strong>From:</strong> {event.caller_number}
                            </p>
                          )}
                          {event.target_number && (
                            <p>
                              <strong>To:</strong> {event.target_number}
                            </p>
                          )}
                          {event.call_duration > 0 && (
                            <p>
                              <strong>Duration:</strong> {formatDuration(event.call_duration)}
                            </p>
                          )}
                          {event.conversion_value > 0 && (
                            <p>
                              <strong>Value:</strong> {formatCurrency(event.conversion_value)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Call Event Analytics</h3>
            <Button onClick={fetchStats} size="sm">
              Refresh
            </Button>
          </div>

          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.totalConversions}</div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{formatDuration(Math.round(stats.averageCallDuration))}</div>
                  <p className="text-sm text-muted-foreground">Avg Call Duration</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analytics data available yet</p>
                </div>
              </CardContent>
            </Card>
          )}

          {stats && Object.keys(stats.eventsByType).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.eventsByType).map(([eventType, count]) => (
                    <div key={eventType} className="flex justify-between items-center">
                      <Badge variant="outline">{eventType.replace("_", " ").toUpperCase()}</Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
