"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { RingbaCampaignCalls } from "@/components/ringba-campaign-calls"
import { CompactDateFilter } from "@/components/compact-date-filter"
import { Phone, Search, AlertCircle, RefreshCw, PhoneCall, Users, TrendingUp, Activity } from "lucide-react"
import { format, isWithinInterval } from "date-fns"
import type { DateRange } from "react-day-picker"

interface Campaign {
  id: string
  name: string
  status: string
  callCount: number
  recordingCount: number
  lastCallDate: string
  revenue: number
  conversionRate: number
  avgCallDuration: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isFilterLoading, setIsFilterLoading] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [campaigns, searchTerm, dateRange])

  const fetchCampaigns = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("🔍 Fetching RingBA campaigns...")

      const response = await fetch("/api/ringba/campaigns-with-metrics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch campaigns")
      }

      const campaignsData = result.data || []
      setCampaigns(campaignsData)
      console.log(`✅ Loaded ${campaignsData.length} campaigns`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = campaigns

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply date range filter
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((campaign) => {
        if (!campaign.lastCallDate) return false
        const callDate = new Date(campaign.lastCallDate)
        return isWithinInterval(callDate, {
          start: dateRange.from!,
          end: dateRange.to!,
        })
      })
    }

    setFilteredCampaigns(filtered)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  const handleApplyFilter = () => {
    setIsFilterLoading(true)
    // Simulate filter processing
    setTimeout(() => {
      applyFilters()
      setIsFilterLoading(false)
    }, 500)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (selectedCampaign) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
            ← Back to Campaigns
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCampaign.name}</h1>
            <p className="text-gray-600">Campaign ID: {selectedCampaign.id}</p>
          </div>
        </div>

        <RingbaCampaignCalls campaignId={selectedCampaign.id} campaignName={selectedCampaign.name} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PhoneCall className="h-8 w-8 text-blue-600" />
            RingBA Campaigns
          </h1>
          <p className="text-gray-600 mt-1">
            {isLoading
              ? "Loading campaigns..."
              : `Successfully loaded ${campaigns.length} campaigns from your RingBA account.`}
          </p>
        </div>
        <Button onClick={fetchCampaigns} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Date Filter */}
      <div className="flex gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <CompactDateFilter
            onDateRangeChange={handleDateRangeChange}
            onApplyFilter={handleApplyFilter}
            isLoading={isFilterLoading}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <Badge variant="outline" className="text-blue-600">
          {filteredCampaigns.length} of {campaigns.length} campaigns
        </Badge>
      </div>

      {/* Error State */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Failed to load campaigns:</strong> {error}
              </div>
              <Button variant="outline" size="sm" onClick={fetchCampaigns}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Campaigns List */}
      {!isLoading && !error && (
        <>
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-gray-500">
                  {campaigns.length === 0
                    ? "No campaigns available in your RingBA account."
                    : "No campaigns match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                      <span className="truncate">{campaign.name}</span>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>{campaign.status}</Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">ID: {campaign.id}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Total Calls</p>
                          <p className="font-semibold">{campaign.callCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-600">Recordings</p>
                          <p className="font-semibold">{campaign.recordingCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-600">Revenue</p>
                          <p className="font-semibold">{formatCurrency(campaign.revenue)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-600">Conv. Rate</p>
                          <p className="font-semibold">{campaign.conversionRate}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Last Call Date */}
                    {campaign.lastCallDate && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">Last Call</p>
                        <p className="text-sm font-medium">
                          {format(new Date(campaign.lastCallDate), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <PhoneCall className="h-4 w-4 mr-2" />
                      View Call Logs ({campaign.recordingCount} ready for Deepgram AI transcription)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
