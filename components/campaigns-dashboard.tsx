"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PlusIcon, RefreshCw, Target, Phone, DollarSign, BarChart4 } from "lucide-react"
import { format } from "date-fns"
import { CampaignCreationModal } from "./campaign-creation-modal"
import { Skeleton } from "@/components/ui/skeleton"

interface Campaign {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "completed" | "draft"
  type?: string
  targetCalls?: number
  budget?: number
  startDate: string | Date
  endDate?: string | Date
  createdAt: string | Date
}

export function CampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("list")

  const fetchCampaigns = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/campaigns")

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

  const handleRefresh = () => {
    fetchCampaigns()
  }

  const handleCreateSuccess = () => {
    fetchCampaigns()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "paused":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Paused
          </Badge>
        )
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "lead-generation":
        return <Phone className="h-4 w-4 text-blue-500" />
      case "sales":
        return <DollarSign className="h-4 w-4 text-green-500" />
      case "support":
        return <Target className="h-4 w-4 text-purple-500" />
      case "survey":
        return <BarChart4 className="h-4 w-4 text-orange-500" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-gray-100 p-6 mb-6">
        <Target className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
      <p className="text-gray-500 mb-6 text-center">
        Get started by creating your first campaign to track and manage your sales efforts.
      </p>
      <Button onClick={() => setIsModalOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Create Your First Campaign
      </Button>
    </div>
  )

  const renderCampaignsList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                {getTypeIcon(campaign.type)}
                <CardTitle className="text-lg ml-2">{campaign.name}</CardTitle>
              </div>
              {getStatusBadge(campaign.status)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {campaign.description || "No description provided"}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  Start Date:
                </span>
                <span>
                  {campaign.startDate instanceof Date
                    ? format(campaign.startDate, "MMM d, yyyy")
                    : format(new Date(campaign.startDate), "MMM d, yyyy")}
                </span>
              </div>

              {campaign.targetCalls && (
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-1" />
                    Target Calls:
                  </span>
                  <span>{campaign.targetCalls.toLocaleString()}</span>
                </div>
              )}

              {campaign.budget && (
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center">
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    Budget:
                  </span>
                  <span>${campaign.budget.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-4 pt-4 border-t">
              <Button variant="outline" size="sm">
                View Details
              </Button>
              <Button variant="secondary" size="sm">
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Campaign analytics will be displayed here. Select a campaign to view detailed analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const renderPerformanceTab = () => (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Campaign performance metrics will be displayed here. Select a campaign to view detailed performance data.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderErrorState = () => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Campaigns</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Campaigns</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="list">Campaign List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {isLoading
              ? renderLoadingState()
              : error
                ? renderErrorState()
                : campaigns.length === 0
                  ? renderEmptyState()
                  : renderCampaignsList()}
          </TabsContent>

          <TabsContent value="analytics">{renderAnalyticsTab()}</TabsContent>

          <TabsContent value="performance">{renderPerformanceTab()}</TabsContent>
        </Tabs>
      </div>

      <CampaignCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}
