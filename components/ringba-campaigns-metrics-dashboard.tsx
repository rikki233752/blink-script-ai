"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Phone, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

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
}

export function RingBACampaignsMetricsDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "paused":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Paused
          </Badge>
        )
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">RingBA Campaigns</h2>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">RingBA Campaigns</h2>
          <p className="text-gray-500 mt-1">Comprehensive campaign metrics and performance data</p>
        </div>
        <Button onClick={fetchCampaigns} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Campaigns Found</h3>
              <p className="text-gray-500">No RingBA campaigns were found for your account.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Header Row */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-4 text-sm font-medium text-gray-600">
                <div>Campaign</div>
                <div>Status</div>
                <div>Avg Score</div>
                <div>Total Calls</div>
                <div>QC Status</div>
                <div>Call Status</div>
                <div>Audio Duration</div>
                <div>Revenue</div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Rows */}
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-4 items-center">
                  {/* Campaign Name & ID */}
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{campaign.campaignName}</div>
                    <div className="text-xs text-gray-500">ID: {campaign.id}</div>
                  </div>

                  {/* Status */}
                  <div>{getStatusBadge(campaign.status)}</div>

                  {/* Average Score */}
                  <div className="space-y-1">
                    <div className={`font-bold text-lg ${getScoreColor(campaign.averageScore)}`}>
                      {campaign.averageScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">out of 5.0</div>
                  </div>

                  {/* Total Calls */}
                  <div className="space-y-1">
                    <div className="font-bold text-lg">{campaign.totalCalls.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">total calls</div>
                  </div>

                  {/* QC Status */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-medium">{campaign.qcApproved}</span>
                      <span className="text-xs text-gray-500">approved</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span className="text-sm font-medium">{campaign.qcRejected}</span>
                      <span className="text-xs text-gray-500">rejected</span>
                    </div>
                  </div>

                  {/* Call Status */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">{campaign.completedCalls}</span>
                      <span className="text-xs text-gray-500">completed</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">{campaign.skippedCalls}</span>
                      <span className="text-xs text-gray-500">skipped</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">{campaign.rejectedCalls}</span>
                      <span className="text-xs text-gray-500">rejected</span>
                    </div>
                  </div>

                  {/* Audio Duration */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatDuration(campaign.audioDuration)}</span>
                    </div>
                    <div className="text-xs text-gray-500">audio time</div>
                  </div>

                  {/* Revenue & Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">{formatCurrency(campaign.revenue)}</span>
                    </div>
                    <div className="text-xs text-gray-500">{campaign.commissionable} commissionable</div>
                    <div className="text-xs text-gray-500">CPA: {formatCurrency(campaign.cpa)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {campaigns.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
                <div className="text-sm text-blue-600">Total Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {campaigns.reduce((sum, c) => sum + c.totalCalls, 0).toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">Total Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {campaigns.reduce((sum, c) => sum + c.completedCalls, 0).toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">Completed Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {campaigns.reduce((sum, c) => sum + c.commissionable, 0).toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">Commissionable</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(campaigns.reduce((sum, c) => sum + c.audioDuration, 0))}
                </div>
                <div className="text-sm text-blue-600">Total Audio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(campaigns.reduce((sum, c) => sum + c.revenue, 0))}
                </div>
                <div className="text-sm text-blue-600">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
