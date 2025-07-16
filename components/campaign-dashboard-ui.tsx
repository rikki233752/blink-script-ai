"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Plus,
  Download,
  Search,
  ArrowUpDown,
  Filter,
  Maximize2,
  Info,
  Loader2,
  Phone,
  CircleCheck,
  Clock,
  BarChart3,
  FileText,
  Mic,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CampaignData {
  id: string
  name: string
  averageScore: number
  totalCalls: number
  qcApproved: number
  qcRejected: number
  completedCalls: number
  skippedCalls: number
  audioDuration: number
  status: "active" | "paused" | "completed"
  createdAt: string
}

interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

interface MetricsSummary {
  totalAverageScore: number
  accountHours: number
  totalCalls: number
  avgCallDuration: number
  commissionable: number
  cpa: number
  revenue: number
  skipped: number
  completed: number
  qcApproved: number
  qcRejected: number
}

interface CampaignInfo {
  name: string
  color: string
}

export function CampaignDashboardUI() {
  const [activeTab, setActiveTab] = useState("avgScore")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [chartCampaigns, setChartCampaigns] = useState<CampaignInfo[]>([])
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMetricsLoading, setIsMetricsLoading] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const { toast } = useToast()

  // Form state for creating campaigns
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    targetCalls: "",
    budget: "",
    description: "",
  })

  // Fetch metrics data
  const fetchMetrics = useCallback(async () => {
    setIsMetricsLoading(true)
    try {
      const response = await fetch(
        `/api/campaigns/metrics?fromDate=${format(dateRange.from, "yyyy-MM-dd")}&toDate=${format(dateRange.to, "yyyy-MM-dd")}&metric=${activeTab}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setChartData(result.data.chartData || [])
        setSummary(result.data.summary || null)
        setChartCampaigns(result.data.campaigns || [])
      } else {
        throw new Error(result.error || "Failed to fetch metrics")
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      toast({
        title: "Error",
        description: "Failed to load metrics data",
        variant: "destructive",
      })
      // Set default values on error
      setChartData([])
      setSummary(null)
      setChartCampaigns([])
    } finally {
      setIsMetricsLoading(false)
    }
  }, [dateRange, activeTab, toast])

  // Fetch campaigns list
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy: sortColumn || "createdAt",
        sortOrder: sortDirection,
        page: currentPage.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/campaigns?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setCampaigns(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error(result.error || "Failed to fetch campaigns")
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      })
      setCampaigns([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, sortColumn, sortDirection, currentPage, toast])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.targetCalls || !newCampaign.budget) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCampaign.name,
          targetCalls: Number.parseInt(newCampaign.targetCalls),
          budget: Number.parseFloat(newCampaign.budget),
          description: newCampaign.description,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setIsCreateDialogOpen(false)
        setNewCampaign({ name: "", targetCalls: "", budget: "", description: "" })
        toast({
          title: "Success",
          description: "Campaign created successfully!",
        })
        // Refresh the campaigns list
        fetchCampaigns()
        fetchMetrics()
      } else {
        throw new Error(result.error || "Failed to create campaign")
      }
    } catch (error) {
      console.error("Failed to create campaign:", error)
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportCampaign = async () => {
    try {
      setIsExporting(true)

      const response = await fetch("/api/campaigns/export?format=csv")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `campaigns_export_${format(new Date(), "yyyy-MM-dd")}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Export completed successfully!",
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Error",
        description: "Export failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range"
    if (!dateRange.to) return format(dateRange.from, "yyyy-MM-dd")
    return `${format(dateRange.from, "yyyy-MM-dd")} ~ ${format(dateRange.to, "yyyy-MM-dd")}`
  }

  const getTabLabel = (tabId: string) => {
    const labels = {
      avgScore: "Avg. Score",
      audioHr: "Audio (hr)",
      totalCalls: "Total Calls",
      skipped: "Skipped",
      completed: "Completed",
      qcApproved: "QC Approved",
      qcRejected: "QC Rejected",
    }
    return labels[tabId as keyof typeof labels] || tabId
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "paused":
        return "bg-amber-500"
      case "completed":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <Info className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-gray-300 text-gray-700">
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        from: range.from,
                        to: range.to || range.from,
                      })
                      setIsCalendarOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-gray-200 text-gray-900">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      className="bg-white border-gray-300"
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetCalls">Target Calls *</Label>
                    <Input
                      id="targetCalls"
                      type="number"
                      value={newCampaign.targetCalls}
                      onChange={(e) => setNewCampaign({ ...newCampaign, targetCalls: e.target.value })}
                      className="bg-white border-gray-300"
                      placeholder="Enter target number of calls"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget *</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                      className="bg-white border-gray-300"
                      placeholder="Enter budget amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      className="bg-white border-gray-300"
                      placeholder="Enter campaign description"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Create Campaign
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={handleExportCampaign}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Campaign
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex">
                {["avgScore", "audioHr", "totalCalls", "skipped", "completed", "qcApproved", "qcRejected"].map(
                  (tab) => (
                    <button
                      key={tab}
                      className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                        activeTab === tab
                          ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {getTabLabel(tab)}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="p-6">
              <div className="h-80">
                {isMetricsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No chart data available</p>
                    <p className="text-sm text-gray-400">Select a different date range or metric</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                        axisLine={{ stroke: "#d1d5db" }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                        axisLine={{ stroke: "#d1d5db" }}
                        domain={activeTab === "avgScore" ? [0, 5] : ["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          color: "#374151",
                        }}
                      />
                      <Legend />
                      {chartCampaigns.map((campaign) => (
                        <Line
                          key={campaign.name}
                          type="monotone"
                          dataKey={campaign.name}
                          stroke={campaign.color}
                          strokeWidth={2}
                          dot={{ fill: campaign.color, strokeWidth: 0, r: 4 }}
                          activeDot={{ fill: campaign.color, strokeWidth: 2, r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-6">
            {summary ? (
              <>
                {/* Total Average Score */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CircleCheck className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Total Average Score</span>
                  </div>

                  <div className="flex justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#e5e7eb" strokeWidth="8" />
                        {summary.totalAverageScore > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="transparent"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            strokeDasharray={`${(summary.totalAverageScore / 5) * 283} 283`}
                            strokeDashoffset="0"
                            transform="rotate(-90 50 50)"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-700">
                          {Math.round((summary.totalAverageScore / 5) * 100)}
                        </span>
                        <span className="text-xl font-bold text-gray-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Hours */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Account Hours</span>
                  </div>
                  <div className="text-4xl font-bold text-gray-700">{Math.round(summary.accountHours)}</div>
                </div>

                {/* Total Calls */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Total Calls</span>
                  </div>
                  <div className="text-4xl font-bold text-gray-700">{summary.totalCalls.toLocaleString()}</div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-gray-500">Avg. Call Duration</div>
                      <div className="text-lg font-semibold text-gray-700">{summary.avgCallDuration.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Commissionable</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {summary.commissionable.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">CPA</div>
                      <div className="text-lg font-semibold text-blue-600">${summary.cpa.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Revenue</div>
                      <div className="text-lg font-semibold text-blue-600">${summary.revenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Skipped</div>
                      <div className="text-lg font-semibold text-gray-700">{summary.skipped.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Completed</div>
                      <div className="text-lg font-semibold text-gray-700">{summary.completed.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Quality Control */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Quality Control</span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "QC Approved", value: summary.qcApproved || 1, color: "#10b981" },
                              { name: "QC Rejected", value: summary.qcRejected || 0, color: "#ef4444" },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-xs text-green-600">QC Approved: {summary.qcApproved}</div>
                        <div className="text-xs text-red-500">QC Rejected: {summary.qcRejected}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2">Loading metrics...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="bg-white border-gray-300">
                <Filter className="h-4 w-4 text-gray-400" />
              </Button>
              <Button variant="outline" size="icon" className="bg-white border-gray-300">
                <Maximize2 className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-gray-50">
                  <TableHead className="text-gray-600 font-medium">
                    <button className="flex items-center" onClick={() => handleSort("id")}>
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    <button className="flex items-center" onClick={() => handleSort("name")}>
                      CAMPAIGN NAME
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    <button className="flex items-center" onClick={() => handleSort("status")}>
                      STATUS
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    <button className="flex items-center" onClick={() => handleSort("createdAt")}>
                      CREATED AT
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">TOTAL CALLS</TableHead>
                  <TableHead className="text-gray-600 font-medium">AVERAGE SCORE</TableHead>
                  <TableHead className="text-gray-600 font-medium">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-10 w-10 text-gray-300" />
                        <p className="text-lg font-medium">No campaigns found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or create a new campaign</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-gray-200 hover:bg-gray-50">
                      <TableCell className="text-blue-600 font-mono font-medium">{campaign.id}</TableCell>
                      <TableCell className="text-gray-900 font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`}></div>
                          <a href="#" className="hover:text-blue-600 hover:underline">
                            {campaign.name}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === "active"
                              ? "bg-green-100 text-green-800"
                              : campaign.status === "paused"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-700">{campaign.totalCalls?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="text-gray-700">{campaign.averageScore?.toFixed(1) || "0.0"}</div>
                          <Progress
                            value={(campaign.averageScore || 0) * 20}
                            className="h-1.5 bg-gray-100"
                            indicatorClassName="bg-blue-500"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300">
                            <Phone className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300">
                            <FileText className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="outline" className="h-8 px-3 border-gray-300 text-blue-600 hover:bg-blue-50">
                            <Mic className="h-4 w-4 mr-1" />
                            Calls
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * 10, totalPages * 10)}</span> of{" "}
                  <span className="font-medium">{totalPages * 10}</span> results
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CampaignDashboardUI
