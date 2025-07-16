"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RingBASyncButton } from "@/components/ringba-sync-button"
import { Search, ArrowUpDown, Clock, RefreshCw } from "lucide-react"

interface Call {
  id: string
  externalId?: string
  fileName: string
  date: string
  duration: number
  analysis: {
    intent?: string
    sentiment?: string
    rating?: number
    converted?: boolean
  }
  transcript: string
  provider: string
  automated?: boolean
  integrationSource?: string
  ringbaData?: {
    direction?: string
    callerNumber?: string
    calledNumber?: string
    campaignId?: string
    agentId?: string
    disposition?: string
  }
}

export function CallActivityFeed() {
  const [calls, setCalls] = useState<Call[]>([])
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([])
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortDirection, setSortDirection] = useState("desc")
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load calls from localStorage
  useEffect(() => {
    const loadCalls = () => {
      setIsLoading(true)
      try {
        const storedCalls = localStorage.getItem("uploadedCalls")
        if (storedCalls) {
          const parsedCalls = JSON.parse(storedCalls)
          setCalls(parsedCalls)
        }
      } catch (error) {
        console.error("Failed to load calls:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCalls()

    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(loadCalls, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...calls]

    // Apply source filter
    if (filter === "ringba") {
      result = result.filter((call) => call.integrationSource === "RingBA")
    } else if (filter === "manual") {
      result = result.filter((call) => !call.integrationSource)
    } else if (filter === "inbound") {
      result = result.filter((call) => call.ringbaData?.direction === "inbound")
    } else if (filter === "outbound") {
      result = result.filter((call) => call.ringbaData?.direction === "outbound")
    } else if (filter === "converted") {
      result = result.filter((call) => call.analysis?.converted === true)
    } else if (filter === "not-converted") {
      result = result.filter((call) => call.analysis?.converted === false)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (call) =>
          call.fileName.toLowerCase().includes(query) ||
          call.ringbaData?.callerNumber?.toLowerCase().includes(query) ||
          call.ringbaData?.calledNumber?.toLowerCase().includes(query) ||
          call.analysis?.intent?.toLowerCase().includes(query) ||
          call.transcript.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === "duration") {
        comparison = a.duration - b.duration
      } else if (sortBy === "rating") {
        comparison = (a.analysis?.rating || 0) - (b.analysis?.rating || 0)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredCalls(result)
  }, [calls, filter, searchQuery, sortBy, sortDirection])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    }

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  }

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return "bg-gray-100 text-gray-800"

    switch (sentiment.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      case "neutral":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-gray-500"

    if (rating >= 8) return "text-green-600"
    if (rating >= 5) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Call Activity</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-blue-50" : ""}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "text-blue-500" : ""}`} />
            {autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
          </Button>
          <RingBASyncButton variant="outline" size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by phone, file name, or intent..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="ringba">RingBA Only</SelectItem>
                  <SelectItem value="manual">Manual Uploads</SelectItem>
                  <SelectItem value="inbound">Inbound Calls</SelectItem>
                  <SelectItem value="outbound">Outbound Calls</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="not-converted">Not Converted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Call list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No calls found matching your criteria</div>
          ) : (
            <div className="space-y-3">
              {filteredCalls.map((call) => (
                <Card key={call.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Left side - Call info */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{call.ringbaData?.callerNumber || call.fileName}</h3>
                            {call.integrationSource && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                RingBA
                              </Badge>
                            )}
                            {call.ringbaData?.direction && (
                              <Badge variant={call.ringbaData.direction === "inbound" ? "default" : "secondary"}>
                                {call.ringbaData.direction === "inbound" ? "Inbound" : "Outbound"}
                              </Badge>
                            )}
                          </div>

                          {call.ringbaData?.calledNumber && (
                            <p className="text-sm text-gray-500 mt-1">To: {call.ringbaData.calledNumber}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(call.date)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{formatDuration(call.duration)}</span>
                        </div>

                        {call.analysis?.intent && <Badge variant="outline">Intent: {call.analysis.intent}</Badge>}

                        {call.analysis?.sentiment && (
                          <Badge variant="outline" className={getSentimentColor(call.analysis.sentiment)}>
                            {call.analysis.sentiment}
                          </Badge>
                        )}

                        {call.analysis?.converted !== undefined && (
                          <Badge variant={call.analysis.converted ? "default" : "destructive"}>
                            {call.analysis.converted ? "Converted" : "Not Converted"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right side - Rating */}
                    <div className="bg-gray-50 p-4 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Rating</div>
                        <div className={`text-2xl font-bold ${getRatingColor(call.analysis?.rating)}`}>
                          {call.analysis?.rating?.toFixed(1) || "N/A"}
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
