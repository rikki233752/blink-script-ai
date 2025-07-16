"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RefreshCw,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  BarChart3,
  Mic,
  FileText,
  ArrowUpDown,
} from "lucide-react"

interface CampaignMetrics {
  id: string
  campaignName: string
  status: string
  averageScore: number
  totalCalls: number
  qcApproved: number
  qcRejected: number
  completedCalls: number
  skippedCalls: number
  rejectedCalls: number
  audioDuration: number
  commissionable: number
  cpa: number
  revenue: number
  createdAt?: string
}

export function EnhancedRingBACampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchCampaigns = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ringba/campaigns-with-metrics")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch campaigns")
      }

      setCampaigns(data.data || [])
    } catch (err) {
      console.error("Error fetching campaigns:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500 text-white">active</Badge>
      case "paused":
        return <Badge className="bg-yellow-500 text-white">paused</Badge>
      case "inactive":
        return <Badge className="bg-gray-500 text-white">inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600"
    if (score >= 3.5) return "text-yellow-600"
    return "text-red-600"
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Calculate summary metrics
  const totalCalls = campaigns.reduce((sum, c) => sum + c.totalCalls, 0)
  const totalCompleted = campaigns.reduce((sum, c) => sum + c.completedCalls, 0)
  const totalSkipped = campaigns.reduce((sum, c) => sum + c.skippedCalls, 0)
  const totalQCApproved = campaigns.reduce((sum, c) => sum + c.qcApproved, 0)
  const totalQCRejected = campaigns.reduce((sum, c) => sum + c.qcRejected, 0)
  const totalAudioHours = campaigns.reduce((sum, c) => sum + c.audioDuration, 0) / 60
  const averageScore =
    campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.averageScore, 0) / campaigns.length : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-gray-500 mt-1">Manage and monitor your RingBA campaigns</p>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Campaigns</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchCampaigns}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-500 mt-1">2025-05-17 ~ 2025-06-16</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Campaign
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{totalCalls.toLocaleString()}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Audio (hr)</p>
                <p className="text-2xl font-bold">{Math.round(totalAudioHours)}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>{averageScore.toFixed(1)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">QC Approved</p>
                <p className="text-2xl font-bold text-green-600">{totalQCApproved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Skipped</p>
              <p className="text-3xl font-bold text-yellow-600">{totalSkipped}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{totalCompleted}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Quality Control</p>
              <div className="flex justify-center items-center mt-2">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${(totalQCApproved / (totalQCApproved + totalQCRejected)) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">
                      {Math.round((totalQCApproved / (totalQCApproved + totalQCRejected)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-green-600">Approved: {totalQCApproved}</span>
                <span className="text-red-600">Rejected: {totalQCRejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" onClick={fetchCampaigns} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      ID <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      CAMPAIGN NAME <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      STATUS <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-600">CREATED AT</th>
                  <th className="text-left p-4 font-medium text-gray-600">TOTAL CALLS</th>
                  <th className="text-left p-4 font-medium text-gray-600">AVERAGE SCORE</th>
                  <th className="text-left p-4 font-medium text-gray-600">QC STATUS</th>
                  <th className="text-left p-4 font-medium text-gray-600">CALL STATUS</th>
                  <th className="text-left p-4 font-medium text-gray-600">AUDIO DURATION</th>
                  <th className="text-left p-4 font-medium text-gray-600">REVENUE</th>
                  <th className="text-left p-4 font-medium text-gray-600">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign, index) => (
                  <tr key={campaign.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-4">
                      <span className="text-blue-600 font-medium">{campaign.id}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{campaign.campaignName}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(campaign.status)}</td>
                    <td className="p-4 text-gray-600">{campaign.createdAt || new Date().toLocaleDateString()}</td>
                    <td className="p-4 font-medium">{campaign.totalCalls.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`font-bold ${getScoreColor(campaign.averageScore)}`}>
                        {campaign.averageScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{campaign.qcApproved} approved</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>{campaign.qcRejected} rejected</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <div className="text-green-600">{campaign.completedCalls} completed</div>
                        <div className="text-yellow-600">{campaign.skippedCalls} skipped</div>
                        <div className="text-red-600">{campaign.rejectedCalls} rejected</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatDuration(campaign.audioDuration)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-bold text-green-600">{formatCurrency(campaign.revenue)}</div>
                        <div className="text-xs text-gray-500">{campaign.commissionable} commissionable</div>
                        <div className="text-xs text-gray-500">CPA: {formatCurrency(campaign.cpa)}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-blue-600">
                          Calls
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredCampaigns.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Campaigns Found</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No campaigns match your search criteria."
                  : "No RingBA campaigns were found for your account."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
