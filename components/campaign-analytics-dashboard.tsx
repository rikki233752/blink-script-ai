"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import {
  Plus,
  Download,
  Search,
  MoreHorizontal,
  X,
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
} from "lucide-react"

interface CampaignData {
  id: string
  name: string
  averageScore: number
  totalCalls: number
  qcApproved: number
  qcRejected: number
  completedCa: number
  avgCallDuration: number
  commissionable: number
  cpa: number
  revenue: number
  skipped: number
  completed: number
  accountHours: number
  status: "active" | "paused" | "completed"
  color: string
}

interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

const CAMPAIGN_COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#06b6d4"]

export function CampaignAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("avgScore")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2025, 5, 2), // June 2, 2025
    to: new Date(2025, 5, 2), // June 2, 2025
  })
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    setIsLoading(true)
    generateMockData()
      .then(() => setIsLoading(false))
      .catch(() => {
        console.error("Failed to load data.")
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    generateChartData()
  }, [campaigns, activeTab, dateRange])

  const generateMockData = useCallback(async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockCampaigns: CampaignData[] = [
          {
            id: "1",
            name: "Martell Group - ACA",
            averageScore: 4.2,
            totalCalls: 1250,
            qcApproved: 980,
            qcRejected: 45,
            completedCa: 1025,
            avgCallDuration: 8.5,
            commissionable: 850,
            cpa: 45.5,
            revenue: 125000,
            skipped: 225,
            completed: 1025,
            accountHours: 156.2,
            status: "active",
            color: "#f59e0b",
          },
          {
            id: "2",
            name: "Martell Group - Medicare",
            averageScore: 3.8,
            totalCalls: 890,
            qcApproved: 650,
            qcRejected: 78,
            completedCa: 728,
            avgCallDuration: 12.3,
            commissionable: 580,
            cpa: 52.3,
            revenue: 89500,
            skipped: 162,
            completed: 728,
            accountHours: 149.7,
            status: "active",
            color: "#ef4444",
          },
          {
            id: "3",
            name: "test",
            averageScore: 4.5,
            totalCalls: 2100,
            qcApproved: 1850,
            qcRejected: 125,
            completedCa: 1975,
            avgCallDuration: 6.8,
            commissionable: 1650,
            cpa: 28.75,
            revenue: 210000,
            skipped: 125,
            completed: 1975,
            accountHours: 223.4,
            status: "active",
            color: "#10b981",
          },
          {
            id: "4",
            name: "TEST - ACA Camp",
            averageScore: 4.1,
            totalCalls: 750,
            qcApproved: 620,
            qcRejected: 35,
            completedCa: 655,
            avgCallDuration: 15.2,
            commissionable: 520,
            cpa: 38.9,
            revenue: 67500,
            skipped: 95,
            completed: 655,
            accountHours: 166.3,
            status: "paused",
            color: "#3b82f6",
          },
        ]

        setCampaigns(mockCampaigns)
        resolve()
      }, 500)
    })
  }, [])

  const generateChartData = () => {
    const data: ChartDataPoint[] = []

    // Generate dates from May to June 2025
    const startDate = new Date(2025, 4, 1) // May 1, 2025
    const endDate = new Date(2025, 5, 3) // June 3, 2025

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
      const dataPoint: ChartDataPoint = {
        date: format(d, "MMM dd"),
      }

      campaigns.forEach((campaign) => {
        // Generate realistic data based on the campaign metrics
        let value = 0
        const randomFactor = 0.8 + Math.random() * 0.4 // Between 0.8 and 1.2

        switch (activeTab) {
          case "avgScore":
            // For average score, generate values between 0-5
            value = campaign.averageScore * randomFactor
            if (value > 5) value = 5
            break
          case "audioHr":
            value = (campaign.accountHours / 30) * randomFactor
            break
          case "totalCalls":
            value = (campaign.totalCalls / 30) * randomFactor
            break
          case "skipped":
            value = (campaign.skipped / 30) * randomFactor
            break
          case "completed":
            value = (campaign.completed / 30) * randomFactor
            break
          case "qcApproved":
            value = (campaign.qcApproved / 30) * randomFactor
            break
          case "qcRejected":
            value = (campaign.qcRejected / 30) * randomFactor
            break
          default:
            value = 0
        }

        dataPoint[campaign.name] = Number(value.toFixed(1))
      })

      data.push(dataPoint)
    }

    setChartData(data)
  }

  const getTotalMetrics = () => {
    return campaigns.reduce(
      (totals, campaign) => ({
        avgScore: totals.avgScore + campaign.averageScore * campaign.totalCalls,
        totalCalls: totals.totalCalls + campaign.totalCalls,
        accountHours: totals.accountHours + campaign.accountHours,
        avgCallDuration: totals.avgCallDuration + campaign.avgCallDuration * campaign.totalCalls,
        commissionable: totals.commissionable + campaign.commissionable,
        cpa: totals.cpa + campaign.cpa * campaign.totalCalls,
        revenue: totals.revenue + campaign.revenue,
        skipped: totals.skipped + campaign.skipped,
        completed: totals.completed + campaign.completed,
        qcApproved: totals.qcApproved + campaign.qcApproved,
        qcRejected: totals.qcRejected + campaign.qcRejected,
      }),
      {
        avgScore: 0,
        totalCalls: 0,
        accountHours: 0,
        avgCallDuration: 0,
        commissionable: 0,
        cpa: 0,
        revenue: 0,
        skipped: 0,
        completed: 0,
        qcApproved: 0,
        qcRejected: 0,
      },
    )
  }

  const totals = getTotalMetrics()
  const weightedAvgScore = totals.totalCalls > 0 ? totals.avgScore / totals.totalCalls : 0
  const weightedAvgDuration = totals.totalCalls > 0 ? totals.avgCallDuration / totals.totalCalls : 0
  const weightedAvgCpa = totals.totalCalls > 0 ? totals.cpa / totals.totalCalls : 0

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn as keyof CampaignData]
    const bValue = b[sortColumn as keyof CampaignData]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const handleCreateCampaign = () => {
    alert("Create Campaign functionality would be implemented here")
  }

  const handleExportCampaign = () => {
    alert("Export Campaign functionality would be implemented here")
  }

  const formatDateRange = () => {
    return `${format(dateRange.from, "yyyy-MM-dd")} ~ ${format(dateRange.to, "yyyy-MM-dd")}`
  }

  const clearDateRange = () => {
    // Reset to current date
    setDateRange({
      from: new Date(2025, 5, 2),
      to: new Date(2025, 5, 2),
    })
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
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-md">
              <div className="px-3 py-2">{formatDateRange()}</div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={clearDateRange}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2" onClick={handleCreateCampaign}>
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>

            <Button
              variant="outline"
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800 flex items-center gap-2"
              onClick={handleExportCampaign}
            >
              <Download className="h-4 w-4" />
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
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
                        ticks={activeTab === "avgScore" ? [0, 1, 2, 3, 4, 5] : undefined}
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
                      {campaigns.map((campaign) => (
                        <Line
                          key={campaign.id}
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
            {/* Total Average Score */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <CircleCheck className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Total Average Score</span>
              </div>

              <div className="flex justify-center">
                <div className="relative w-40 h-40">
                  {/* Circular gauge background */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="#374151" strokeWidth="10" />
                    {/* Progress arc - only show if we have data */}
                    {weightedAvgScore > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        strokeDasharray={`${(weightedAvgScore / 5) * 283} 283`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-gray-200">
                      {weightedAvgScore > 0 ? Math.round(weightedAvgScore * 100) / 100 : 0}
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
              <div className="text-5xl font-bold text-gray-200">{Math.round(totals.accountHours)}</div>
            </div>

            {/* Total Calls */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Total Calls</span>
              </div>
              <div className="text-5xl font-bold text-gray-200">{totals.totalCalls}</div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="text-sm text-gray-400">Avg. Call Duration</div>
                  <div className="text-2xl font-bold text-gray-200">{weightedAvgDuration.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Commissionable</div>
                  <div className="text-2xl font-bold text-blue-500">{totals.commissionable}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">CPA</div>
                  <div className="text-2xl font-bold text-blue-500">${weightedAvgCpa.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Revenue</div>
                  <div className="text-2xl font-bold text-blue-500">${totals.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Skipped</div>
                  <div className="text-2xl font-bold text-gray-200">{totals.skipped}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Completed</div>
                  <div className="text-2xl font-bold text-gray-200">{totals.completed}</div>
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
                  {/* QC gauge - green circle */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="#10b981" strokeWidth="10" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-sm text-green-400">QC Approved: {totals.qcApproved}</div>
                    <div className="text-sm text-red-400">QC Rejected: {totals.qcRejected}</div>
                  </div>
                </div>
              </div>
            </div>
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
                    <div className="flex gap-2 mt-1">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("totalCalls")}>
                      TOTAL CALLS
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                    <div className="flex gap-2 mt-1">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("qcApproved")}>
                      QC APPROVED
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                    <div className="flex gap-2 mt-1">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("qcRejected")}>
                      QC REJECTED
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                    <div className="flex gap-2 mt-1">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <button className="flex items-center" onClick={() => handleSort("completedCa")}>
                      COMPLETED CA
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                    <div className="flex gap-2 mt-1">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-400">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableCell className="text-gray-300 font-mono">All</TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input placeholder="Min" className="h-6 text-xs bg-gray-700 border-gray-600" />
                      <Input placeholder="Max" className="h-6 text-xs bg-gray-700 border-gray-600" />
                    </div>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>

                {sortedCampaigns.map((campaign) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
