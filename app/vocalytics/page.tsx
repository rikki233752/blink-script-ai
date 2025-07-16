"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, Filter } from "lucide-react"
import type { VocalyticsReport } from "@/lib/vocalytics-utils"
import { EnhancedVocalyticsDashboard } from "@/components/enhanced-vocalytics-dashboard"

export default function VocalyticsPage() {
  const [reports, setReports] = useState<VocalyticsReport[]>([])
  const [selectedReport, setSelectedReport] = useState<VocalyticsReport | null>(null)
  const [timeRange, setTimeRange] = useState("7d")
  const [agentFilter, setAgentFilter] = useState("all")

  useEffect(() => {
    loadVocalyticsReports()
  }, [])

  const loadVocalyticsReports = () => {
    // Load reports from localStorage or API
    const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
    const vocalyticsReports = uploadedCalls
      .filter((call: any) => call.analysis?.vocalyticsReport)
      .map((call: any) => call.analysis.vocalyticsReport)

    setReports(vocalyticsReports)
    if (vocalyticsReports.length > 0) {
      setSelectedReport(vocalyticsReports[0])
    }
  }

  const calculateAverageScore = () => {
    if (reports.length === 0) return 0
    return Math.round(reports.reduce((sum, report) => sum + report.overallScore, 0) / reports.length)
  }

  const getTrendDirection = () => {
    if (reports.length < 2) return "stable"
    const recent = reports.slice(-3).reduce((sum, report) => sum + report.overallScore, 0) / Math.min(3, reports.length)
    const older =
      reports.slice(0, -3).reduce((sum, report) => sum + report.overallScore, 0) / Math.max(1, reports.length - 3)

    if (recent > older + 5) return "improving"
    if (recent < older - 5) return "declining"
    return "stable"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Mic className="h-8 w-8 text-blue-600" />
                Vocalytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Advanced vocal and speech pattern analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-48 bg-white border-gray-300">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="top-performers">Top Performers</SelectItem>
                  <SelectItem value="needs-coaching">Needs Coaching</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="bg-white border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <EnhancedVocalyticsDashboard reports={reports} />
      </div>
    </div>
  )
}
