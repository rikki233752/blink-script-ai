"use client"

import { RingbaCampaignsDashboard } from "@/components/ringba-campaigns-dashboard"

export default function RingbaCampaignCallsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ringba Campaign Calls</h1>
        <p className="text-gray-600">Browse your Ringba campaigns and transcribe call recordings with Deepgram AI</p>
      </div>
      <RingbaCampaignsDashboard />
    </div>
  )
}
