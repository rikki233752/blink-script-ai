"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useCampaigns } from "@/hooks/use-campaigns"
import { useMetrics } from "@/hooks/use-metrics"
import {
  Plus,
  Download,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  ArrowUpDown,
  Filter,
  Maximize2,
  Info,
  Loader2,
  Phone,
  CircleCheck,
  Clock,
  BarChart3,
  CalendarIcon,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function FullStackCampaignsDashboard() {
  const [activeTab, setActiveTab] = useState("avgScore")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2025, 5, 2), // June 2, 2025
    to: new Date(2025, 5, 2), // June 2, 2025
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Form state for creating campaigns
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    targetCalls: "",
    budget: "",
    description: "",
  })

  // API hooks
  const {
    campaigns,
    loading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
    createCampaign,
  } = useCampaigns({
    search: searchTerm,
    sortBy: sortColumn || undefined,
    sortOrder: sortDirection,
  })

  const {
    chartData,
    summary,
    campaigns: chartCampaigns,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useMetrics({
    metric: activeTab,
    fromDate: format(dateRange.from, "yyyy-MM-dd"),
    toDate: format(dateRange.to, "yyyy-MM-dd"),
  })

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
      alert("Please fill in all required fields")
      return
    }

    const result = await createCampaign({
      name: newCampaign.name,
      targetCalls: Number.parseInt(newCampaign.targetCalls),
      budget: Number.parseFloat(newCampaign.budget),
      description: newCampaign.description,
    })

    if (result) {
      setIsCreateDialogOpen(false)
      setNewCampaign({ name: "", targetCalls: "", budget: "", description: "" })
      alert("Campaign created successfully!")
    }
  }

  const handleExportCampaign = async () => {
    try {
      setIsExporting(true)

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "csv",
          dateRange,
          campaigns: campaigns.map((c) => c.id),
          metrics: [activeTab],
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Trigger download
        const downloadResponse = await fetch("/api/export?format=csv")
        const blob = await downloadResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "campaigns_export.csv"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        alert("Export completed successfully!")
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range"
    if (!dateRange.to) return format(dateRange.from, "yyyy-MM-dd")
    return `${format(dateRange.from, "yyyy-MM-dd")} ~ ${format(dateRange.to, "yyyy-MM-dd")}`
  }

  if (campaignsError || metricsError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{campaignsError || metricsError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <Info className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                    !dateRange && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        from: range.from,
                        to: range.to || range.from,
                      })
                      // Trigger metrics refetch when date range changes
                      refetchMetrics()
                    }
                  }}
                  numberOfMonths={2}
                  className="bg-gray-800 text-white"
                />
              </PopoverContent>
            </Popover>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white">
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
                      className="bg-gray-700 border-gray-600"
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
                      className="bg-gray-700 border-gray-600"
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
                      className="bg-gray-700 border-gray-600"
                      placeholder="Enter budget amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Enter campaign description"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700">
                      Create Campaign
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800 flex items-center gap-2"
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
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-700">
              <div className="flex">
                {[
                  { id: "avgScore", label: "Avg. Score" },
                  { id: "audioHr", label: "Audio (hr)" },
                  { id: "totalCalls", label: "Total Calls" },
                  { id: "skipped", label: "Skipped" },
                  { id: "completed", label: "Completed" },
                  { id: "qcApproved", label: "QC Approved" },
                  { id: "qcRejected", label: "QC Rejected" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === tab.id
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="p-6">
              <div className="h-80">
                {metricsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartData.length === 0 || !chartData[0] || Object.keys(chartData[0]).length <= 1 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-gray-400 mb-2">No data available</div>
                        <div className="text-gray-500 text-sm">
                          Create campaigns and complete calls to see analytics
                        </div>
                      </div>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#4b5563" }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#4b5563" }}
                          domain={activeTab === "avgScore" ? [0, 5] : ["auto", "auto"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#ffffff",
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
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-6">
            {summary && (
              <>
                {/* Total Average Score */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CircleCheck className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Total Average Score</span>
                  </div>

                  <div className="flex justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#374151" strokeWidth="10" />
                        {summary.totalAverageScore > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="transparent"
                            stroke="#3b82f6"
                            strokeWidth="10"
                            strokeDasharray={`${(summary.totalAverageScore / 5) * 283} 283`}
                            strokeDashoffset="0"
                            transform="rotate(-90 50 50)"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-gray-200">
                          {Math.round((summary.totalAverageScore / 5) * 100)}
                        </span>
                        <span className="text-4xl font-bold text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Hours */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Account Hours</span>
                  </div>
                  <div className="text-5xl font-bold text-gray-200">{Math.round(summary.accountHours)}</div>
                </div>

                {/* Total Calls */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Total Calls</span>
                  </div>
                  <div className="text-5xl font-bold text-gray-200">{summary.totalCalls.toLocaleString()}</div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <div className="text-sm text-gray-400">Avg. Call Duration</div>
                      <div className="text-2xl font-bold text-gray-200">{summary.avgCallDuration.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Commissionable</div>
                      <div className="text-2xl font-bold text-blue-500">{summary.commissionable.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">CPA</div>
                      <div className="text-2xl font-bold text-blue-500">${summary.cpa.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Revenue</div>
                      <div className="text-2xl font-bold text-blue-500">${summary.revenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Skipped</div>
                      <div className="text-2xl font-bold text-gray-200">{summary.skipped.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Completed</div>
                      <div className="text-2xl font-bold text-gray-200">{summary.completed.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Quality Control */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Quality Control</span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#10b981" strokeWidth="10" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-sm text-green-400">QC Approved: {summary.qcApproved.toLocaleString()}</div>
                        <div className="text-sm text-red-400">QC Rejected: {summary.qcRejected.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 w-64 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="bg-gray-700 border-gray-600">
                <Filter className="h-4 w-4 text-gray-400" />
              </Button>
              <Button variant="outline" size="icon" className="bg-gray-700 border-gray-600">
                <Maximize2 className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("id")}>
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("name")}>
                      CAMPAIGN NAME
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("averageScore")}>
                      AVERAGE SCORE
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("totalCalls")}>
                      TOTAL CALLS
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("qcApproved")}>
                      QC APPROVED
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("qcRejected")}>
                      QC REJECTED
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("completedCa")}>
                      COMPLETED CA
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-gray-400">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                      No campaign data available. Create a campaign to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-gray-700 hover:bg-gray-800">
                      <TableCell className="text-gray-300 font-mono">{campaign.id}</TableCell>
                      <TableCell className="text-white font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-white">{campaign.averageScore.toFixed(1)}</TableCell>
                      <TableCell className="text-white">{campaign.totalCalls.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{campaign.qcApproved.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{campaign.qcRejected.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{campaign.completedCa.toLocaleString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              {campaign.status === "active" ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Resume
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
