"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays } from "date-fns"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download, RefreshCw, X, CalendarIcon, Filter } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface CampaignData {
  date: string
  avgScore: number
  audioHours: number
  totalCalls: number
  skipped: number
  completed: number
  qcApproved: number
  qcRejected: number
}

interface Campaign {
  id: string
  name: string
}

interface Agent {
  id: string
  name: string
}

export function CampaignsAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("avgScore")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all")
  const [selectedAgent, setSelectedAgent] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<CampaignData[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // Generate mock data for the dashboard
  useEffect(() => {
    // Mock campaigns
    setCampaigns([
      { id: "all", name: "All Campaigns" },
      { id: "camp1", name: "Sales Outreach Q2" },
      { id: "camp2", name: "Customer Retention" },
      { id: "camp3", name: "New Product Launch" },
      { id: "camp4", name: "Support Excellence" },
    ])

    // Mock agents
    setAgents([
      { id: "all", name: "All Agents" },
      { id: "agent1", name: "Alex Johnson" },
      { id: "agent2", name: "Sam Rivera" },
      { id: "agent3", name: "Jordan Smith" },
      { id: "agent4", name: "Taylor Wong" },
    ])

    generateMockData()
  }, [])

  // Regenerate data when filters change
  useEffect(() => {
    generateMockData()
  }, [selectedCampaign, selectedAgent, dateRange])

  const generateMockData = () => {
    setIsLoading(true)

    // Create date range array
    const dates: Date[] = []
    const currentDate = new Date(dateRange.from)
    while (currentDate <= dateRange.to) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Generate random data for each date
    const newData: CampaignData[] = dates.map((date) => {
      // Base values that will be modified by filters
      const baseAvgScore = 3 + Math.random() * 2 // Between 3 and 5
      const baseAudioHours = 5 + Math.random() * 15 // Between 5 and 20
      const baseTotalCalls = 50 + Math.floor(Math.random() * 150) // Between 50 and 200

      // Apply campaign and agent "filters" to make data look different
      const campaignMultiplier = selectedCampaign === "all" ? 1 : 0.7 + Math.random() * 0.6
      const agentMultiplier = selectedAgent === "all" ? 1 : 0.8 + Math.random() * 0.4

      const totalCalls = Math.floor(baseTotalCalls * campaignMultiplier * agentMultiplier)
      const skipped = Math.floor(totalCalls * (0.05 + Math.random() * 0.1)) // 5-15% skipped
      const completed = totalCalls - skipped
      const qcApproved = Math.floor(completed * (0.7 + Math.random() * 0.25)) // 70-95% approved
      const qcRejected = completed - qcApproved

      return {
        date: format(date, "MMM dd"),
        avgScore: Number.parseFloat((baseAvgScore * campaignMultiplier * agentMultiplier).toFixed(2)),
        audioHours: Number.parseFloat((baseAudioHours * campaignMultiplier * agentMultiplier).toFixed(1)),
        totalCalls,
        skipped,
        completed,
        qcApproved,
        qcRejected,
      }
    })

    setData(newData)
    setTimeout(() => setIsLoading(false), 800) // Simulate loading delay
  }

  const handleRefresh = () => {
    generateMockData()
  }

  const handleExport = () => {
    // In a real app, this would generate and download a CSV file
    alert("Exporting data to CSV...")
  }

  const getTabData = () => {
    switch (activeTab) {
      case "avgScore":
        return data.map((d) => ({ date: d.date, value: d.avgScore }))
      case "audioHours":
        return data.map((d) => ({ date: d.date, value: d.audioHours }))
      case "totalCalls":
        return data.map((d) => ({ date: d.date, value: d.totalCalls }))
      case "skipped":
        return data.map((d) => ({ date: d.date, value: d.skipped }))
      case "completed":
        return data.map((d) => ({ date: d.date, value: d.completed }))
      case "qcApproved":
        return data.map((d) => ({ date: d.date, value: d.qcApproved }))
      case "qcRejected":
        return data.map((d) => ({ date: d.date, value: d.qcRejected }))
      default:
        return data.map((d) => ({ date: d.date, value: d.avgScore }))
    }
  }

  const getTabColor = () => {
    switch (activeTab) {
      case "avgScore":
        return "#3b82f6" // blue
      case "audioHours":
        return "#10b981" // green
      case "totalCalls":
        return "#6366f1" // indigo
      case "skipped":
        return "#f59e0b" // amber
      case "completed":
        return "#10b981" // green
      case "qcApproved":
        return "#10b981" // green
      case "qcRejected":
        return "#ef4444" // red
      default:
        return "#3b82f6" // blue
    }
  }

  const getTabLabel = () => {
    switch (activeTab) {
      case "avgScore":
        return "Average Score"
      case "audioHours":
        return "Audio Hours"
      case "totalCalls":
        return "Total Calls"
      case "skipped":
        return "Skipped Calls"
      case "completed":
        return "Completed Calls"
      case "qcApproved":
        return "QC Approved"
      case "qcRejected":
        return "QC Rejected"
      default:
        return "Average Score"
    }
  }

  const getAverageValue = () => {
    if (data.length === 0) return 0

    let sum = 0
    switch (activeTab) {
      case "avgScore":
        sum = data.reduce((acc, d) => acc + d.avgScore, 0)
        return (sum / data.length).toFixed(2)
      case "audioHours":
        sum = data.reduce((acc, d) => acc + d.audioHours, 0)
        return (sum / data.length).toFixed(1)
      case "totalCalls":
        sum = data.reduce((acc, d) => acc + d.totalCalls, 0)
        return Math.round(sum / data.length)
      case "skipped":
        sum = data.reduce((acc, d) => acc + d.skipped, 0)
        return Math.round(sum / data.length)
      case "completed":
        sum = data.reduce((acc, d) => acc + d.completed, 0)
        return Math.round(sum / data.length)
      case "qcApproved":
        sum = data.reduce((acc, d) => acc + d.qcApproved, 0)
        return Math.round(sum / data.length)
      case "qcRejected":
        sum = data.reduce((acc, d) => acc + d.qcRejected, 0)
        return Math.round(sum / data.length)
      default:
        sum = data.reduce((acc, d) => acc + d.avgScore, 0)
        return (sum / data.length).toFixed(2)
    }
  }

  const getProgressValue = () => {
    switch (activeTab) {
      case "avgScore":
        return (Number.parseFloat(getAverageValue() as string) / 5) * 100 // Assuming max score is 5
      case "audioHours":
        return Math.min((Number.parseFloat(getAverageValue() as string) / 20) * 100, 100) // Assuming 20 hours is max
      case "totalCalls":
        return Math.min((Number.parseInt(getAverageValue() as string) / 200) * 100, 100) // Assuming 200 calls is max
      case "skipped":
        // For negative metrics, lower is better
        const skippedRate =
          data.length > 0
            ? data.reduce((acc, d) => acc + d.skipped, 0) / data.reduce((acc, d) => acc + d.totalCalls, 0)
            : 0
        return 100 - skippedRate * 100
      case "completed":
        const completedRate =
          data.length > 0
            ? data.reduce((acc, d) => acc + d.completed, 0) / data.reduce((acc, d) => acc + d.totalCalls, 0)
            : 0
        return completedRate * 100
      case "qcApproved":
        const approvedRate =
          data.length > 0
            ? data.reduce((acc, d) => acc + d.qcApproved, 0) / data.reduce((acc, d) => acc + d.completed, 0)
            : 0
        return approvedRate * 100
      case "qcRejected":
        // For negative metrics, lower is better
        const rejectedRate =
          data.length > 0
            ? data.reduce((acc, d) => acc + d.qcRejected, 0) / data.reduce((acc, d) => acc + d.completed, 0)
            : 0
        return 100 - rejectedRate * 100
      default:
        return (Number.parseFloat(getAverageValue() as string) / 5) * 100
    }
  }

  const getProgressLabel = () => {
    switch (activeTab) {
      case "avgScore":
        return `${getAverageValue()}/5`
      case "audioHours":
        return `${getAverageValue()} hrs`
      case "totalCalls":
      case "skipped":
      case "completed":
      case "qcApproved":
      case "qcRejected":
        return getAverageValue()
      default:
        return getAverageValue()
    }
  }

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return ""
    if (format(dateRange.from, "yyyy-MM-dd") === format(dateRange.to, "yyyy-MM-dd")) {
      return format(dateRange.from, "yyyy-MM-dd")
    }
    return `${format(dateRange.from, "yyyy-MM-dd")} ~ ${format(dateRange.to, "yyyy-MM-dd")}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <div className="flex items-center gap-2">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange(range)
                    setIsDatePickerOpen(false)
                  }
                }}
                numberOfMonths={2}
              />
              <div className="flex items-center justify-end gap-2 p-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsDatePickerOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setIsDatePickerOpen(false)}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => setDateRange({ from: new Date(), to: new Date() })}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <Card className="bg-background border-border">
            <CardHeader className="p-4 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Select Campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Select Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start mb-6 bg-background border-b border-border rounded-none h-auto p-0 overflow-x-auto">
                  <TabsTrigger
                    value="avgScore"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none py-2 px-4"
                  >
                    Avg. Score
                  </TabsTrigger>
                  <TabsTrigger
                    value="audioHours"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none py-2 px-4"
                  >
                    Audio (hr)
                  </TabsTrigger>
                  <TabsTrigger
                    value="totalCalls"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none py-2 px-4"
                  >
                    Total Calls
                  </TabsTrigger>
                  <TabsTrigger
                    value="skipped"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none py-2 px-4"
                  >
                    Skipped
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none py-2 px-4"
                  >
                    Completed
                  </TabsTrigger>
                  <TabsTrigger
                    value="qcApproved"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none py-2 px-4"
                  >
                    QC Approved
                  </TabsTrigger>
                  <TabsTrigger
                    value="qcRejected"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 rounded-none py-2 px-4"
                  >
                    QC Rejected
                  </TabsTrigger>
                </TabsList>

                <div className="h-[300px] w-full">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading data...</p>
                      </div>
                    </div>
                  ) : data.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium">No data available</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters or date range</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getTabData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getTabColor()} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={getTabColor()} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis dataKey="date" tick={{ fill: "#888" }} axisLine={{ stroke: "#333" }} />
                        <YAxis tick={{ fill: "#888" }} axisLine={{ stroke: "#333" }} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "0.375rem",
                            color: "#f3f4f6",
                          }}
                          formatter={(value) => [value, getTabLabel()]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={getTabColor()}
                          fillOpacity={1}
                          fill="url(#colorGradient)"
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-background border-border h-full">
            <CardHeader className="p-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                Total {getTabLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-700"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-blue-500"
                      strokeWidth="8"
                      strokeDasharray={`${getProgressValue()} 251.2`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      style={{
                        transformOrigin: "center",
                        transform: "rotate(-90deg)",
                        transition: "stroke-dasharray 1s ease-in-out",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold">{getProgressLabel()}</div>
                      <div className="text-sm text-gray-400 mt-1">Average</div>
                    </div>
                  </div>
                </div>

                <div className="w-full mt-8 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Conversion Rate</span>
                      <span>{Math.round(30 + Math.random() * 40)}%</span>
                    </div>
                    <Progress value={30 + Math.random() * 40} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Agent Efficiency</span>
                      <span>{Math.round(50 + Math.random() * 40)}%</span>
                    </div>
                    <Progress value={50 + Math.random() * 40} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Customer Satisfaction</span>
                      <span>{Math.round(60 + Math.random() * 30)}%</span>
                    </div>
                    <Progress value={60 + Math.random() * 30} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
