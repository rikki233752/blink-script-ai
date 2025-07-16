"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CircleStopIcon as Stop,
  Target,
  Phone,
  Filter,
  DollarSign,
  Search,
  BarChart3,
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"

interface Campaign {
  id: string
  name: string
  description: string
  type: "outbound" | "inbound" | "mixed"
  status: "draft" | "active" | "paused" | "completed" | "archived"
  startDate: string
  endDate: string
  targetAudience: string
  goals: {
    totalCalls: number
    conversionRate: number
    revenue: number
  }
  metrics: {
    totalCalls: number
    completedCalls: number
    conversionRate: number
    averageScore: number
    revenue: number
    cost: number
    roi: number
  }
  script: {
    opening: string
    keyPoints: string[]
    objectionHandling: string[]
    closing: string
  }
  agents: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface CampaignCall {
  id: string
  campaignId: string
  agentId: string
  agentName: string
  customerName: string
  customerPhone: string
  date: string
  duration: number
  outcome: "connected" | "no-answer" | "busy" | "voicemail" | "callback"
  disposition: "sale" | "interested" | "not-interested" | "callback" | "dnc"
  score: number
  revenue: number
  notes: string
}

const CAMPAIGN_TYPES = [
  { value: "outbound", label: "Outbound Sales" },
  { value: "inbound", label: "Inbound Support" },
  { value: "mixed", label: "Mixed Campaign" },
]

const CAMPAIGN_STATUSES = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "active", label: "Active", color: "green" },
  { value: "paused", label: "Paused", color: "yellow" },
  { value: "completed", label: "Completed", color: "blue" },
  { value: "archived", label: "Archived", color: "gray" },
]

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignCalls, setCampaignCalls] = useState<CampaignCall[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Form state for creating/editing campaigns
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: "",
    description: "",
    type: "outbound",
    status: "draft",
    startDate: new Date().toISOString(),
    endDate: addDays(new Date(), 30).toISOString(),
    targetAudience: "",
    goals: {
      totalCalls: 1000,
      conversionRate: 15,
      revenue: 50000,
    },
    script: {
      opening: "",
      keyPoints: [],
      objectionHandling: [],
      closing: "",
    },
    agents: [],
    tags: [],
  })

  useEffect(() => {
    loadCampaigns()
    loadCampaignCalls()
  }, [])

  const loadCampaigns = () => {
    // In a real implementation, this would fetch from an API
    const mockCampaigns: Campaign[] = []
    setCampaigns(mockCampaigns)
  }

  const loadCampaignCalls = () => {
    // In a real implementation, this would fetch from an API
    const mockCalls: CampaignCall[] = []
    setCampaignCalls(mockCalls)
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    const matchesType = typeFilter === "all" || campaign.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      ...(formData as Campaign),
      metrics: {
        totalCalls: 0,
        completedCalls: 0,
        conversionRate: 0,
        averageScore: 0,
        revenue: 0,
        cost: 0,
        roi: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCampaigns([...campaigns, newCampaign])
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleUpdateCampaign = () => {
    if (!selectedCampaign) return

    const updatedCampaigns = campaigns.map((campaign) =>
      campaign.id === selectedCampaign.id
        ? { ...campaign, ...formData, updatedAt: new Date().toISOString() }
        : campaign,
    )

    setCampaigns(updatedCampaigns)
    setIsEditDialogOpen(false)
    setSelectedCampaign(null)
    resetForm()
  }

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter((campaign) => campaign.id !== campaignId))
    setCampaignCalls(campaignCalls.filter((call) => call.campaignId !== campaignId))
  }

  const handleStatusChange = (campaignId: string, newStatus: Campaign["status"]) => {
    const updatedCampaigns = campaigns.map((campaign) =>
      campaign.id === campaignId ? { ...campaign, status: newStatus, updatedAt: new Date().toISOString() } : campaign,
    )
    setCampaigns(updatedCampaigns)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "outbound",
      status: "draft",
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), 30).toISOString(),
      targetAudience: "",
      goals: {
        totalCalls: 1000,
        conversionRate: 15,
        revenue: 50000,
      },
      script: {
        opening: "",
        keyPoints: [],
        objectionHandling: [],
        closing: "",
      },
      agents: [],
      tags: [],
    })
  }

  const getStatusColor = (status: Campaign["status"]) => {
    const statusConfig = CAMPAIGN_STATUSES.find((s) => s.value === status)
    return statusConfig?.color || "gray"
  }

  const getCampaignProgress = (campaign: Campaign) => {
    const totalDays = differenceInDays(new Date(campaign.endDate), new Date(campaign.startDate))
    const elapsedDays = differenceInDays(new Date(), new Date(campaign.startDate))
    return Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
  }

  const getCampaignCalls = (campaignId: string) => {
    return campaignCalls.filter((call) => call.campaignId === campaignId)
  }

  const getCampaignPerformanceData = (campaign: Campaign) => {
    const calls = getCampaignCalls(campaign.id)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    return last7Days.map((date) => {
      const daysCalls = calls.filter((call) => format(new Date(call.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
      return {
        date: format(date, "MMM dd"),
        calls: daysCalls.length,
        conversions: daysCalls.filter((call) => call.disposition === "sale").length,
        revenue: daysCalls.reduce((sum, call) => sum + call.revenue, 0),
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Campaign Management
          </h2>
          <p className="text-gray-600">Create, manage, and track your sales and marketing campaigns</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Campaign["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your campaign objectives and strategy"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Describe your target audience"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalCalls">Target Calls</Label>
                  <Input
                    id="totalCalls"
                    type="number"
                    value={formData.goals?.totalCalls}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goals: { ...formData.goals!, totalCalls: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="conversionRate">Target Conversion %</Label>
                  <Input
                    id="conversionRate"
                    type="number"
                    value={formData.goals?.conversionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goals: { ...formData.goals!, conversionRate: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="revenue">Target Revenue</Label>
                  <Input
                    id="revenue"
                    type="number"
                    value={formData.goals?.revenue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goals: { ...formData.goals!, revenue: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="opening">Opening Script</Label>
                <Textarea
                  id="opening"
                  value={formData.script?.opening}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      script: { ...formData.script!, opening: e.target.value },
                    })
                  }
                  placeholder="Enter your opening script"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="closing">Closing Script</Label>
                <Textarea
                  id="closing"
                  value={formData.script?.closing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      script: { ...formData.script!, closing: e.target.value },
                    })
                  }
                  placeholder="Enter your closing script"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>Create Campaign</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {CAMPAIGN_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CAMPAIGN_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-green-600">
                  {campaigns.filter((c) => c.status === "active").length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.metrics.totalCalls, 0).toLocaleString()}
                </p>
              </div>
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Campaign List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                  <p className="text-gray-500 mb-4">
                    {campaigns.length === 0
                      ? "Get started by creating your first campaign to track and manage your sales efforts."
                      : "No campaigns match your current filters. Try adjusting your search criteria."}
                  </p>
                  {campaigns.length === 0 && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            <p className="text-gray-600 text-sm">{campaign.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`bg-${getStatusColor(campaign.status)}-500`}>{campaign.status}</Badge>
                          <Badge variant="outline">{campaign.type}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaign(campaign)
                              setFormData(campaign)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteCampaign(campaign.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{campaign.metrics.totalCalls}</p>
                          <p className="text-sm text-gray-600">Total Calls</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{campaign.metrics.conversionRate}%</p>
                          <p className="text-sm text-gray-600">Conversion Rate</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{campaign.metrics.averageScore}</p>
                          <p className="text-sm text-gray-600">Avg Score</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">
                            ${campaign.metrics.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Revenue</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{campaign.metrics.roi}%</p>
                          <p className="text-sm text-gray-600">ROI</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Campaign Progress</span>
                          <span>{Math.round(getCampaignProgress(campaign))}%</span>
                        </div>
                        <Progress value={getCampaignProgress(campaign)} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{format(new Date(campaign.startDate), "MMM dd, yyyy")}</span>
                          <span>{format(new Date(campaign.endDate), "MMM dd, yyyy")}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                          {campaign.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {campaign.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(campaign.id, "paused")}
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          {campaign.status === "paused" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(campaign.id, "active")}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          {(campaign.status === "active" || campaign.status === "paused") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(campaign.id, "completed")}
                            >
                              <Stop className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={
                        campaigns.length === 0
                          ? [{ name: "No Data", value: 1 }]
                          : CAMPAIGN_STATUSES.map((status) => ({
                              name: status.label,
                              value: campaigns.filter((c) => c.status === status.value).length,
                            }))
                      }
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={campaigns.length === 0 ? false : ({ name, value }) => `${name}: ${value}`}
                    >
                      {(campaigns.length === 0 ? [{ color: "#e5e7eb" }] : CAMPAIGN_STATUSES).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={campaigns.length === 0 ? "#e5e7eb" : CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Campaign Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={CAMPAIGN_TYPES.map((type) => ({
                      type: type.label,
                      revenue: campaigns
                        .filter((c) => c.type === type.value)
                        .reduce((sum, c) => sum + c.metrics.revenue, 0),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            {campaigns.filter((c) => c.status === "active").length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Campaigns</h3>
                  <p className="text-gray-500">Create and activate campaigns to view performance trends.</p>
                </CardContent>
              </Card>
            ) : (
              campaigns
                .filter((c) => c.status === "active")
                .map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <CardTitle>{campaign.name} - Performance Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getCampaignPerformanceData(campaign)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="calls" stroke="#3b82f6" name="Calls" />
                          <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Campaign Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Campaign["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCampaign}>Update Campaign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
