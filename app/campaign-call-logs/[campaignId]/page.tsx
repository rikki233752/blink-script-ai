"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone } from "lucide-react"
import { RingbaCampaignCalls } from "@/components/ringba-campaign-calls"
import Link from "next/link"

export default function CampaignCallLogsPage() {
  const params = useParams()
  const campaignId = params.campaignId as string
  const [campaignName, setCampaignName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch campaign details to get the name
    const fetchCampaignDetails = async () => {
      try {
        const response = await fetch(`/api/ringba/campaigns`)
        const result = await response.json()

        if (result.success && result.data) {
          const campaign = result.data.find((c: any) => c.id === campaignId)
          if (campaign) {
            setCampaignName(campaign.name)
          }
        }
      } catch (error) {
        console.error("Failed to fetch campaign details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (campaignId) {
      fetchCampaignDetails()
    }
  }, [campaignId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/ringba-campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-8 w-8 text-blue-600" />
              Call Logs
            </h1>
            <p className="text-gray-600">Campaign: {campaignName || campaignId} • Transcribe with Deepgram AI</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Campaign Call Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RingbaCampaignCalls campaignId={campaignId} campaignName={campaignName || campaignId} />
        </CardContent>
      </Card>
    </div>
  )
}
