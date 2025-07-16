"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Filter,
  Phone,
  Clock,
  CheckCircle,
  CreditCard,
  X,
  CalendarIcon,
  BarChart3,
  CalendarDays,
  User,
} from "lucide-react"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"

interface CallData {
  id: string
  fileName: string
  date: string
  duration: number
  agentName?: string
  customerName?: string
  callType?: string
  analysis: {
    overallScore: number
    overallRating: string
    sentimentAnalysis: {
      agentSentiment: { overall: string; confidence: number }
      customerSentiment: { overall: string; confidence: number }
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
    }
    agentPerformance?: {
      communicationSkills: number
      problemSolving: number
      productKnowledge: number
      customerService: number
    }
    preciseScoring?: {
      overallScore: number
      categoryScores: Record<string, number>
    }
  }
}

interface AgentData {
  id: string
  name: string
  calls: CallData[]
  averageScore: number
  totalCalls: number
  totalMinutes: number
  totalCompleted: number
  traits: {
    vocalCharacteristics: number
    conversationFlow: number
    emotionalIntelligence: number
    professionalism: number
  }
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface FilterState {
  dateRange: { from: Date; to: Date } | null
  campaign: string
  agent: string
}

const TRAIT_CATEGORIES = [
  { id: "vocalCharacteristics", name: "Vocal Characteristics", color: "bg-blue-500" },
  { id: "conversationFlow", name: "Conversation Flow", color: "bg-green-500" },
  { id: "emotionalIntelligence", name: "Emotional Intelligence and Adaptability", color: "bg-purple-500" },
  { id: "professionalism", name: "Professionalism and Etiquette", color: "bg-orange-500" },
]

const PERFORMANCE_RANGES = [
  { label: "Poor", range: "(0-40%)", color: "bg-red-500" },
  { label: "Average", range: "(40-60%)", color: "bg-yellow-500" },
  { label: "Excellent", range: "(60-100%)", color: "bg-green-500" },
]

const TRAIT_FILTERS = ["All", "Improving", "Declining", "Unchanged"]

export function ReportsDashboard() {
  const [callData, setCallData] = useState<CallData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: null,
    campaign: "",
    agent: "",
  })
  const [selectedTraitFilter, setSelectedTraitFilter] = useState("All")
  const [currentPeriod, setCurrentPeriod] = useState({
    start: format(subDays(new Date(), 30), "MMM dd, yyyy"),
    end: format(new Date(), "MMM dd, yyyy"),
  })
  const [previousPeriod, setPreviousPeriod] = useState({
    start: format(subDays(new Date(), 60), "MMM dd, yyyy"),
    end: format(subDays(new Date(), 31), "MMM dd, yyyy"),
  })

  // Load call data and generate agents
  useEffect(() => {
    loadCallData()
    generateCampaigns()
  }, [])

  useEffect(() => {
    if (callData.length > 0) {
      generateAgents()
    }
  }, [callData])

  const loadCallData = () => {
    try {
      const storedCalls = localStorage.getItem("uploadedCalls")
      if (storedCalls) {
        const calls = JSON.parse(storedCalls)
        const enhancedCalls = calls.map((call: any, index: number) => ({
          ...call,
          agentName: call.agentName || `Agent ${(index % 5) + 1}`,
          customerName: call.customerName || `Customer ${index + 1}`,
        }))
        setCallData(enhancedCalls)
      }
    } catch (error) {
      console.error("Error loading call data:", error)
    }
  }

  const generateCampaigns = () => {
    const mockCampaigns: Campaign[] = [
      { id: "1", name: "Medicare Campaign", status: "active" },
      { id: "2", name: "Insurance Sales", status: "active" },
      { id: "3", name: "Lead Generation", status: "paused" },
      { id: "4", name: "Customer Support", status: "active" },
    ]
    setCampaigns(mockCampaigns)
  }

  const generateAgents = () => {
    const agentGroups = callData.reduce(
      (acc, call) => {
        const agentName = call.agentName || "Unknown Agent"
        if (!acc[agentName]) {
          acc[agentName] = []
        }
        acc[agentName].push(call)
        return acc
      },
      {} as Record<string, CallData[]>,
    )

    const agentData: AgentData[] = Object.entries(agentGroups).map(([name, calls], index) => {
      const totalScore = calls.reduce((sum, call) => sum + call.analysis.overallScore, 0)
      const averageScore = totalScore / calls.length
      const totalMinutes = calls.reduce((sum, call) => sum + call.duration, 0) / 60
      const totalCompleted = calls.filter((call) => call.analysis.businessConversion.conversionAchieved).length

      // Generate trait scores based on call performance
      const baseScore = averageScore * 10 // Convert to percentage
      const traits = {
        vocalCharacteristics: Math.min(100, baseScore + Math.random() * 20 - 10),
        conversationFlow: Math.min(100, baseScore + Math.random() * 20 - 10),
        emotionalIntelligence: Math.min(100, baseScore + Math.random() * 20 - 10),
        professionalism: Math.min(100, baseScore + Math.random() * 20 - 10),
      }

      return {
        id: (index + 1).toString(),
        name,
        calls,
        averageScore: Math.round(averageScore * 10) / 10,
        totalCalls: calls.length,
        totalMinutes: Math.round(totalMinutes),
        totalCompleted,
        traits,
      }
    })

    setAgents(agentData)
  }

  const applyFilters = () => {
    if (!filters.dateRange || !filters.campaign) {
      return
    }

    // Filter agents based on campaign and date range
    const filteredAgents = agents.filter((agent) => {
      // In a real app, you'd filter based on actual campaign assignments
      return true
    })

    if (filters.agent) {
      const agent = filteredAgents.find((a) => a.id === filters.agent)
      setSelectedAgent(agent || null)
    } else {
      setSelectedAgent(filteredAgents[0] || null)
    }

    setFilterOpen(false)
  }

  const clearFilters = () => {
    setFilters({
      dateRange: null,
      campaign: "",
      agent: "",
    })
    setSelectedAgent(null)
  }

  const hasFiltersApplied = filters.dateRange || filters.campaign || filters.agent

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Select an Agent</h2>
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="text-sm text-gray-600">
                  <p>Filter agent performance data based on the parameters below. To load data, you must select:</p>
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    <li>
                      <strong>Date Range</strong> - Select the period for which to view performance data
                    </li>
                    <li>
                      <strong>Campaign</strong> - Choose a specific campaign to analyze
                    </li>
                    <li>
                      <strong>Agent (Optional)</strong> - Select a specific agent or view all agents in the campaign
                    </li>
                  </ol>
                  <p className="mt-2 text-xs text-gray-500">
                    <strong>Note:</strong> Agents will only load after selecting both a campaign and date range.
                  </p>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">Date Range</h3>
                    <p className="text-sm text-gray-600">
                      Select the date range for which you want to view agent performance data. Required to populate
                      agent list.
                    </p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.from ? (
                          filters.dateRange.to ? (
                            <>
                              {format(filters.dateRange.from, "yyyy-MM-dd")} ~{" "}
                              {format(filters.dateRange.to, "yyyy-MM-dd")}
                            </>
                          ) : (
                            format(filters.dateRange.from, "yyyy-MM-dd")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                        {filters.dateRange && (
                          <X
                            className="ml-auto h-4 w-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFilters((prev) => ({ ...prev, dateRange: null }))
                            }}
                          />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={filters.dateRange?.from}
                        selected={filters.dateRange || undefined}
                        onSelect={(range) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: range as { from: Date; to: Date } | null,
                          }))
                        }
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Campaigns */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">Campaigns</h3>
                    <p className="text-sm text-gray-600">
                      Select the campaign you want to view agent performance data for. Required to populate agent list.
                    </p>
                  </div>
                  <Select
                    value={filters.campaign}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, campaign: value, agent: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Agent Name */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">Agent Name</h3>
                    <p className="text-sm text-gray-600">
                      Select an agent to view their performance data. Agents list will populate after selecting a
                      campaign and date range.
                    </p>
                  </div>
                  <Select
                    value={filters.agent}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, agent: value }))}
                    disabled={!filters.campaign || !filters.dateRange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
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

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-6">
                  <Button
                    onClick={applyFilters}
                    disabled={!filters.dateRange || !filters.campaign}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filter Status */}
      <div className="text-sm text-gray-600">
        {hasFiltersApplied ? (
          <p>
            Showing data for{" "}
            {filters.agent
              ? agents.find((a) => a.id === filters.agent)?.name
              : campaigns.find((c) => c.id === filters.campaign)?.name || "selected campaign"}{" "}
            {filters.dateRange &&
              `from ${format(filters.dateRange.from, "MMM dd, yyyy")} to ${format(filters.dateRange.to, "MMM dd, yyyy")}`}
          </p>
        ) : (
          <p>No filters applied</p>
        )}
        <p className="text-xs mt-1">Use the Filter button to select an agent, campaign, and date range.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Score Card Score</p>
                <p className="text-2xl font-bold">
                  {selectedAgent ? `${Math.round(selectedAgent.averageScore * 10)}%` : "0%"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{selectedAgent ? selectedAgent.totalCalls : "0"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Minutes</p>
                <p className="text-2xl font-bold">{selectedAgent ? selectedAgent.totalMinutes : "0"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Completed</p>
                <p className="text-2xl font-bold">{selectedAgent ? selectedAgent.totalCompleted : "0"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Top 10 Traits */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 traits</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAgent ? (
                <div className="space-y-4">
                  {TRAIT_CATEGORIES.map((category) => {
                    const score = selectedAgent.traits[category.id as keyof typeof selectedAgent.traits]
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm font-semibold">{Math.round(score)}%</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No traits data available</p>
                  <p className="text-sm text-gray-400 mt-1">Apply filters to view top traits for an agent</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Traits Progress and Coaching */}
          <Card>
            <CardHeader>
              <CardTitle>Traits Progress and Coaching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Select a category to view detailed trait analysis:</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Green badge: Number of improving traits</li>
                  <li>• Red badge: Number of declining traits</li>
                  <li>• Gray badge: Number of unchanged traits</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Select a category</h4>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Category View
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Date Range
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {TRAIT_FILTERS.map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedTraitFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTraitFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    Compare performance across time periods: Select date ranges to analyze how traits have changed over
                    time. The current period shows recent performance, while the previous period provides a baseline for
                    comparison.
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    Comparing current period{" "}
                    <strong>
                      ({currentPeriod.start} - {currentPeriod.end})
                    </strong>{" "}
                    with previous period{" "}
                    <strong>
                      ({previousPeriod.start} - {previousPeriod.end})
                    </strong>
                    .
                  </p>
                </div>

                {selectedAgent ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Traits progress analysis available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Detailed coaching recommendations based on {selectedAgent.name}'s performance
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No traits progress data available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Apply filters to view traits progress and coaching options
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Overall Score */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${selectedAgent ? selectedAgent.averageScore * 25.1 : 0} 251.2`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-in-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {selectedAgent ? `${Math.round(selectedAgent.averageScore * 10)}%` : "0%"}
                    </span>
                    <span className="text-sm text-gray-500">Overall Score</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Ranges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PERFORMANCE_RANGES.map((range) => (
                  <div key={range.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${range.color}`}></div>
                    <span className="text-sm">
                      <span className="font-medium">{range.label}</span>
                      <span className="text-gray-500 ml-1">{range.range}</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
