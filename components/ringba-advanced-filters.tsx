"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  RefreshCw,
  Phone,
  FileText,
  AlertCircle,
  Info,
  Plus,
  Trash,
  Filter,
  Calendar,
  PlayCircle,
  Clock,
  User,
  Download,
  Database,
} from "lucide-react"
import { format } from "date-fns"

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

interface FilterCondition {
  column: string
  value: string
  isNegativeMatch: boolean
  comparisonType: string
}

interface FilterGroup {
  anyConditionToMatch: FilterCondition[]
}

export function RingBAAdvancedFilters() {
  const [campaignId, setCampaignId] = useState("")
  const [reportStart, setReportStart] = useState("2024-01-01")
  const [reportEnd, setReportEnd] = useState("2025-06-11")
  const [callLogs, setCallLogs] = useState<TransformedCallLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [requestBody, setRequestBody] = useState<any>(null)

  // Advanced filters
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      anyConditionToMatch: [
        {
          column: "hasConnected",
          value: "yes",
          isNegativeMatch: false,
          comparisonType: "EQUALS",
        },
      ],
    },
  ])

  const columnOptions = [
    { value: "campaignId", label: "Campaign ID" },
    { value: "campaignName", label: "Campaign Name" },
    { value: "hasConnected", label: "Connected" },
    { value: "hasConverted", label: "Converted" },
    { value: "hasRecording", label: "Has Recording" },
    { value: "callLengthInSeconds", label: "Call Length" },
    { value: "inboundPhoneNumber", label: "Caller ID" },
    { value: "buyer", label: "Buyer" },
    { value: "targetName", label: "Target Name" },
    { value: "tag:Date:Day", label: "Day of Month" },
  ]

  const comparisonOptions = [
    { value: "EQUALS", label: "Equals" },
    { value: "NOT_EQUALS", label: "Not Equals" },
    { value: "CONTAINS", label: "Contains" },
    { value: "GREATER_THAN", label: "Greater Than" },
    { value: "LESS_THAN", label: "Less Than" },
  ]

  const addFilterGroup = () => {
    setFilterGroups([
      ...filterGroups,
      {
        anyConditionToMatch: [
          {
            column: "hasConnected",
            value: "yes",
            isNegativeMatch: false,
            comparisonType: "EQUALS",
          },
        ],
      },
    ])
  }

  const removeFilterGroup = (groupIndex: number) => {
    setFilterGroups(filterGroups.filter((_, index) => index !== groupIndex))
  }

  const addCondition = (groupIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].anyConditionToMatch.push({
      column: "hasConnected",
      value: "yes",
      isNegativeMatch: false,
      comparisonType: "EQUALS",
    })
    setFilterGroups(newGroups)
  }

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].anyConditionToMatch = newGroups[groupIndex].anyConditionToMatch.filter(
      (_, index) => index !== conditionIndex,
    )
    setFilterGroups(newGroups)
  }

  const updateCondition = (
    groupIndex: number,
    conditionIndex: number,
    field: keyof FilterCondition,
    value: string | boolean,
  ) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].anyConditionToMatch[conditionIndex][field] = value as any
    setFilterGroups(newGroups)
  }

  const fetchCallLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ringba/call-logs-advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaignId || undefined,
          reportStart: `${reportStart}T00:00:00Z`,
          reportEnd: `${reportEnd}T23:59:59Z`,
          filters: filterGroups,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCallLogs(result.callLogs || [])
        setRawResponse(result.rawResponse)
        setRequestBody(result.requestBody)
      } else {
        setError(result.error)
        setCallLogs([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch call logs")
      setCallLogs([])
    } finally {
      setLoading(false)
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
            RingBA Advanced Filters
          </h2>
          <p className="text-gray-600">Exact curl example implementation with complex filters</p>
        </div>
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

      {/* Filter Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="campaignId">Campaign ID (Optional)</Label>
                <Input
                  id="campaignId"
                  placeholder="e.g. CA6175a522bcab462f8a3c593340249ef0"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reportStart">Report Start</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input
                    id="reportStart"
                    type="date"
                    value={reportStart}
                    onChange={(e) => setReportStart(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="reportEnd">Report End</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input id="reportEnd" type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Filter Groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Filter Groups (AND between groups)</h3>
                <Button onClick={addFilterGroup} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter Group
                </Button>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Filter Logic:</strong> Conditions within a group are combined with OR. Multiple groups are
                  combined with AND.
                </AlertDescription>
              </Alert>

              {filterGroups.map((group, groupIndex) => (
                <Card key={groupIndex} className="border-2 border-dashed border-gray-200">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Group {groupIndex + 1} (OR between conditions)
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => addCondition(groupIndex)} size="sm" variant="ghost">
                          <Plus className="h-4 w-4" />
                        </Button>
                        {filterGroups.length > 1 && (
                          <Button
                            onClick={() => removeFilterGroup(groupIndex)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3 px-4">
                    {group.anyConditionToMatch.map((condition, conditionIndex) => (
                      <div key={conditionIndex} className="grid grid-cols-12 gap-2 mb-2 items-center">
                        <div className="col-span-3">
                          <Select
                            value={condition.column}
                            onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "column", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {columnOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={condition.comparisonType}
                            onValueChange={(value) =>
                              updateCondition(groupIndex, conditionIndex, "comparisonType", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Comparison" />
                            </SelectTrigger>
                            <SelectContent>
                              {comparisonOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Value"
                            value={condition.value}
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, "value", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Checkbox
                            id={`negative-${groupIndex}-${conditionIndex}`}
                            checked={condition.isNegativeMatch}
                            onCheckedChange={(checked) =>
                              updateCondition(groupIndex, conditionIndex, "isNegativeMatch", checked === true)
                            }
                          />
                          <Label htmlFor={`negative-${groupIndex}-${conditionIndex}`} className="text-sm">
                            Negate
                          </Label>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {group.anyConditionToMatch.length > 1 && (
                            <Button
                              onClick={() => removeCondition(groupIndex, conditionIndex)}
                              size="sm"
                              variant="ghost"
                              className="text-red-500 h-8 w-8 p-0"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={fetchCallLogs} disabled={loading} className="w-full md:w-auto">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Fetch Call Logs
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="calllogs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calllogs">
            <FileText className="h-4 w-4 mr-2" />
            Call Logs ({callLogs.length})
          </TabsTrigger>
          <TabsTrigger value="request">
            <Info className="h-4 w-4 mr-2" />
            Request Body
          </TabsTrigger>
          <TabsTrigger value="response">
            <Database className="h-4 w-4 mr-2" />
            Raw Response
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calllogs">
          <Card>
            <CardHeader>
              <CardTitle>Call Logs (Transformed)</CardTitle>
            </CardHeader>
            <CardContent>
              {callLogs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    {loading ? "Fetching call logs..." : "No call logs found. Try adjusting your filters."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callLogs.map((call) => (
                    <Card key={call.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{call.callerId}</h4>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{call.status}</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{call.disposition}</span>
                              {call.hasRecording && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center gap-1">
                                  <PlayCircle className="h-3 w-3" />
                                  Recording
                                </span>
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

        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>Request Body</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {requestBody ? JSON.stringify(requestBody, null, 2) : "No request made yet"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response">
          <Card>
            <CardHeader>
              <CardTitle>Raw API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {rawResponse ? JSON.stringify(rawResponse, null, 2) : "No response received yet"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
