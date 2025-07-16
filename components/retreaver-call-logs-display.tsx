"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Play,
  Pause,
  Download,
  Clock,
  User,
  MapPin,
  Calendar,
  RefreshCw,
  Volume2,
  VolumeX,
  ExternalLink,
  AlertCircle,
} from "lucide-react"

interface RetreaverCallLog {
  id: string
  campaign_id: string
  caller_id: string
  destination_number: string
  start_time: string
  end_time?: string
  duration: number
  status: string
  recording_url?: string
  tags?: string[]
  custom_data?: Record<string, any>
}

interface RetreaverCallLogsDisplayProps {
  calls: RetreaverCallLog[]
  loading: boolean
  campaignName?: string
  onRefresh?: () => void
}

export default function RetreaverCallLogsDisplay({
  calls,
  loading,
  campaignName,
  onRefresh,
}: RetreaverCallLogsDisplayProps) {
  const [playingCall, setPlayingCall] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (error) {
      console.error("Error parsing date:", dateString, error)
      return "Invalid Date"
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      answered: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      missed: "bg-red-100 text-red-800",
      busy: "bg-orange-100 text-orange-800",
      failed: "bg-red-100 text-red-800",
      unknown: "bg-gray-100 text-gray-800",
    }

    const normalizedStatus = status.toLowerCase()
    const colorClass = statusColors[normalizedStatus] || "bg-gray-100 text-gray-800"

    return <Badge className={colorClass}>{status}</Badge>
  }

  const handlePlayPause = async (callId: string, recordingUrl: string) => {
    try {
      if (playingCall === callId) {
        // Pause current audio
        const audio = audioElements[callId]
        if (audio) {
          audio.pause()
        }
        setPlayingCall(null)
      } else {
        // Stop any currently playing audio
        if (playingCall && audioElements[playingCall]) {
          audioElements[playingCall].pause()
        }

        // Create or get audio element
        let audio = audioElements[callId]
        if (!audio) {
          audio = new Audio(recordingUrl)
          audio.crossOrigin = "anonymous"
          setAudioElements((prev) => ({ ...prev, [callId]: audio }))

          audio.addEventListener("ended", () => {
            setPlayingCall(null)
          })

          audio.addEventListener("error", (e) => {
            console.error("Audio playback error:", e)
            setPlayingCall(null)
          })
        }

        // Play audio
        await audio.play()
        setPlayingCall(callId)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      setPlayingCall(null)
    }
  }

  const handleDownload = (recordingUrl: string, callId: string) => {
    try {
      const link = document.createElement("a")
      link.href = recordingUrl
      link.download = `call-recording-${callId}.mp3`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading recording:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading real call logs from Retreaver V2 API...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Phone className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Call Logs Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            No call logs were found for this campaign and date range from Retreaver V2 API.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">API Endpoint Used:</p>
            <code className="text-xs">GET https://api.retreaver.com/api/v2/calls.json?api_key=YOUR_API_KEY</code>
          </div>
          {onRefresh && (
            <Button onClick={onRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6 text-green-600" />
            Real Call Logs ({calls.length})
          </h2>
          {campaignName && (
            <p className="text-muted-foreground">
              Campaign: {campaignName} • Live call data from Retreaver V2 API with recordings
            </p>
          )}
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {calls.map((call) => (
          <Card key={call.id} className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    Call ID: {call.id}
                  </CardTitle>
                  <CardDescription>Campaign: {call.campaign_id}</CardDescription>
                </div>
                {getStatusBadge(call.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Caller ID</div>
                    <div className="text-sm text-muted-foreground">{call.caller_id || "Unknown"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Destination</div>
                    <div className="text-sm text-muted-foreground">{call.destination_number || "Unknown"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Start Time</div>
                    <div className="text-sm text-muted-foreground">{formatDate(call.start_time)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div className="text-sm text-muted-foreground">{formatDuration(call.duration)}</div>
                  </div>
                </div>
              </div>

              {/* Recording Section */}
              <div className="border-t pt-4">
                {call.recording_url ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-green-800">Recording Available</div>
                        <div className="text-xs text-green-600">Real audio recording from Retreaver</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handlePlayPause(call.id, call.recording_url!)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {playingCall === call.id ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button onClick={() => handleDownload(call.recording_url!, call.id)} size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button onClick={() => window.open(call.recording_url, "_blank")} size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                    <VolumeX className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-600">No recording available for this call</div>
                  </div>
                )}
              </div>

              {/* Tags and Custom Data */}
              {(call.tags && call.tags.length > 0) || (call.custom_data && Object.keys(call.custom_data).length > 0) ? (
                <div className="border-t pt-4 mt-4">
                  {call.tags && call.tags.length > 0 && (
                    <div className="mb-2">
                      <div className="text-sm font-medium mb-1">Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {call.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {call.custom_data && Object.keys(call.custom_data).length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-1">Custom Data:</div>
                      <div className="text-xs bg-gray-50 p-2 rounded font-mono">
                        {JSON.stringify(call.custom_data, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Info Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <AlertCircle className="h-4 w-4" />
            <span>
              Real call data fetched from Retreaver V2 API:
              <code className="ml-1 bg-blue-100 px-1 rounded text-xs">
                GET https://api.retreaver.com/api/v2/calls.json?api_key=YOUR_API_KEY
              </code>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
