"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Mic, Clock, User } from "lucide-react"
import Link from "next/link"

interface CampaignCallSummary {
  campaignId: string
  campaignName: string
  totalCalls: number
  callsWithRecordings: number
  totalDuration: number
  lastCallDate: string
  status: string
}

export function CampaignCallLogsOverview() {
  const [campaigns, setCampaigns] = useState<CampaignCallSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCampaignCallSummaries()
  }, [])

  const fetchCampaignCallSummaries = async () => {
    try {
      const response = await fetch("/api/ringba/campaigns")
      const result = await response.json()

      if (result.success && result.data) {
        // Transform campaign data to include call summaries
        const summaries = result.data.map((campaign: any) => ({
          campaignId: campaign.id,
          campaignName: campaign.name,
          totalCalls: campaign.totalCalls || 0,
          callsWithRecordings: Math.floor((campaign.totalCalls || 0) * 0.3), // Estimate
          totalDuration: (campaign.totalCalls || 0) * 180, // Estimate 3 min average
          lastCallDate: campaign.updatedAt || campaign.createdAt,
          status: campaign.isActive ? "active" : "inactive",
        }))
        setCampaigns(summaries)
      }
    } catch (error) {
      console.error("Failed to fetch campaign call summaries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Call Logs</h2>
          <p className="text-gray-600">View and transcribe call logs organized by campaign</p>
        </div>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.campaignId} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.campaignName}</h3>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>{campaign.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{campaign.totalCalls} total calls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      <span>{campaign.callsWithRecordings} with recordings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(campaign.totalDuration)} total duration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Campaign ID: {campaign.campaignId.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <Link href={`/campaign-call-logs/${campaign.campaignId}`}>
                    <Button variant="default" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      View Call Logs
                    </Button>
                  </Link>
                  {campaign.callsWithRecordings > 0 && (
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      Transcribe All ({campaign.callsWithRecordings})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Phone className="h-16 w-16 mx-auto text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-500">Set up your Ringba integration to start viewing campaign call logs.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
