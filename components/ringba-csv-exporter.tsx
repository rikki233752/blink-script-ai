"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Settings, CheckCircle, AlertCircle, Info, RefreshCw, Filter, Database } from "lucide-react"

interface ExportParams {
  startDate: string
  endDate: string
  campaignId: string
  columns: string[]
  format: string
  timezone: string
  limit: string
  offset: string
}

const AVAILABLE_COLUMNS = [
  { id: "callId", label: "Call ID", default: true },
  { id: "campaignId", label: "Campaign ID", default: true },
  { id: "campaignName", label: "Campaign Name", default: true },
  { id: "callerId", label: "Caller ID", default: true },
  { id: "calledNumber", label: "Called Number", default: true },
  { id: "trackingNumber", label: "Tracking Number", default: true },
  { id: "startTime", label: "Start Time", default: true },
  { id: "endTime", label: "End Time", default: true },
  { id: "duration", label: "Duration", default: true },
  { id: "ringTime", label: "Ring Time", default: false },
  { id: "status", label: "Status", default: true },
  { id: "disposition", label: "Disposition", default: true },
  { id: "direction", label: "Direction", default: true },
  { id: "agentName", label: "Agent Name", default: true },
  { id: "agentId", label: "Agent ID", default: false },
  { id: "revenue", label: "Revenue", default: true },
  { id: "cost", label: "Cost", default: true },
  { id: "profit", label: "Profit", default: true },
  { id: "callerCity", label: "Caller City", default: false },
  { id: "callerState", label: "Caller State", default: false },
  { id: "targetCity", label: "Target City", default: false },
  { id: "targetState", label: "Target State", default: false },
  { id: "recordingUrl", label: "Recording URL", default: false },
  { id: "recordingDuration", label: "Recording Duration", default: false },
  { id: "hasRecording", label: "Has Recording", default: false },
  { id: "sourceId", label: "Source ID", default: false },
  { id: "keywordId", label: "Keyword ID", default: false },
  { id: "tags", label: "Tags", default: false },
  { id: "customFields", label: "Custom Fields", default: false },
  { id: "notes", label: "Notes", default: false },
]

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
]

export function RingbaCSVExporter() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<{
    type: "success" | "error" | "info" | null
    message: string
    details?: any
  }>({ type: null, message: "" })

  const [params, setParams] = useState<ExportParams>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    campaignId: "",
    columns: AVAILABLE_COLUMNS.filter((col) => col.default).map((col) => col.id),
    format: "csv",
    timezone: "UTC",
    limit: "1000",
    offset: "0",
  })

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      setParams((prev) => ({
        ...prev,
        columns: [...prev.columns, columnId],
      }))
    } else {
      setParams((prev) => ({
        ...prev,
        columns: prev.columns.filter((id) => id !== columnId),
      }))
    }
  }

  const handleSelectAllColumns = () => {
    setParams((prev) => ({
      ...prev,
      columns: AVAILABLE_COLUMNS.map((col) => col.id),
    }))
  }

  const handleSelectDefaultColumns = () => {
    setParams((prev) => ({
      ...prev,
      columns: AVAILABLE_COLUMNS.filter((col) => col.default).map((col) => col.id),
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportStatus({ type: null, message: "" })

    try {
      const queryParams = new URLSearchParams()

      if (params.startDate) queryParams.append("startDate", params.startDate)
      if (params.endDate) queryParams.append("endDate", params.endDate)
      if (params.campaignId) queryParams.append("campaignId", params.campaignId)
      if (params.columns.length > 0) queryParams.append("columns", params.columns.join(","))
      if (params.format) queryParams.append("format", params.format)
      if (params.timezone) queryParams.append("timezone", params.timezone)
      if (params.limit) queryParams.append("limit", params.limit)
      if (params.offset) queryParams.append("offset", params.offset)

      console.log("🔄 Starting CSV export with params:", Object.fromEntries(queryParams))

      const response = await fetch(`/api/ringba/calllogs/export/csv?${queryParams}`)

      console.log("📡 Export response status:", response.status)
      console.log("📡 Export response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`)
      }

      // Get export metadata from headers
      const exportMethod = response.headers.get("X-Export-Method") || "Unknown"
      const dataSource = response.headers.get("X-Data-Source") || "Unknown"
      const endpoint = response.headers.get("X-Export-Endpoint") || "Unknown"
      const note = response.headers.get("X-Export-Note")

      // Get the CSV data
      const csvData = await response.text()
      console.log("📊 CSV data received, length:", csvData.length)

      // Create and trigger download
      const blob = new Blob([csvData], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `ringba-calls-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show success status
      setExportStatus({
        type: dataSource === "REAL_RINGBA_CSV_API" ? "success" : "info",
        message:
          dataSource === "REAL_RINGBA_CSV_API"
            ? `✅ CSV export successful! Downloaded ${csvData.split("\n").length - 1} records.`
            : `⚠️ Using mock data - API connection failed. Downloaded sample CSV for development.`,
        details: {
          method: exportMethod,
          dataSource,
          endpoint,
          note,
          recordCount: csvData.split("\n").length - 1,
          fileSize: `${(csvData.length / 1024).toFixed(2)} KB`,
        },
      })
    } catch (error) {
      console.error("❌ CSV export error:", error)
      setExportStatus({
        type: "error",
        message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Download className="h-8 w-8 text-green-600" />
            Ringba CSV Export
          </h2>
          <p className="text-gray-600 mt-1">
            Export call logs from Ringba API in CSV format with customizable columns and filters
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Database className="h-4 w-4 mr-1" />
          API: /v2/{"{accountId}"}/calllogs/export/csv
        </Badge>
      </div>

      {/* Export Status */}
      {exportStatus.type && (
        <Alert
          className={`${
            exportStatus.type === "success"
              ? "border-green-200 bg-green-50"
              : exportStatus.type === "info"
                ? "border-yellow-200 bg-yellow-50"
                : "border-red-200 bg-red-50"
          }`}
        >
          {exportStatus.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : exportStatus.type === "info" ? (
            <Info className="h-4 w-4 text-yellow-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              exportStatus.type === "success"
                ? "text-green-800"
                : exportStatus.type === "info"
                  ? "text-yellow-800"
                  : "text-red-800"
            }
          >
            <div>{exportStatus.message}</div>
            {exportStatus.details && (
              <div className="mt-2 text-xs space-y-1">
                <div>
                  <strong>Method:</strong> {exportStatus.details.method}
                </div>
                <div>
                  <strong>Data Source:</strong> {exportStatus.details.dataSource}
                </div>
                <div>
                  <strong>Records:</strong> {exportStatus.details.recordCount}
                </div>
                <div>
                  <strong>File Size:</strong> {exportStatus.details.fileSize}
                </div>
                {exportStatus.details.note && (
                  <div>
                    <strong>Note:</strong> {exportStatus.details.note}
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Export Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={params.startDate}
                  onChange={(e) => setParams((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={params.endDate}
                  onChange={(e) => setParams((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Campaign Filter */}
            <div>
              <Label htmlFor="campaignId">Campaign ID (Optional)</Label>
              <Input
                id="campaignId"
                placeholder="Filter by specific campaign ID..."
                value={params.campaignId}
                onChange={(e) => setParams((prev) => ({ ...prev, campaignId: e.target.value }))}
              />
            </div>

            {/* Timezone */}
            <div>
              <Label>Timezone</Label>
              <Select
                value={params.timezone}
                onValueChange={(value) => setParams((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Limit and Offset */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="1000"
                  value={params.limit}
                  onChange={(e) => setParams((prev) => ({ ...prev, limit: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="offset">Offset</Label>
                <Input
                  id="offset"
                  type="number"
                  placeholder="0"
                  value={params.offset}
                  onChange={(e) => setParams((prev) => ({ ...prev, offset: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Column Selection ({params.columns.length} selected)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectDefaultColumns}>
                  Default
                </Button>
                <Button size="sm" variant="outline" onClick={handleSelectAllColumns}>
                  Select All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {AVAILABLE_COLUMNS.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={params.columns.includes(column.id)}
                    onCheckedChange={(checked) => handleColumnToggle(column.id, checked as boolean)}
                  />
                  <Label htmlFor={column.id} className="text-sm font-normal cursor-pointer flex-1">
                    {column.label}
                    {column.default && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Default
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Ready to Export</h3>
              <p className="text-sm text-gray-600">
                Export {params.columns.length} columns from {params.startDate} to {params.endDate}
                {params.campaignId && ` for campaign ${params.campaignId}`}
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting || params.columns.length === 0}
              size="lg"
              className="min-w-[150px]"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
