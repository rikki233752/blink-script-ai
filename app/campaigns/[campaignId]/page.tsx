import { RingbaCampaignCalls } from "@/components/ringba-campaign-calls"

interface CampaignPageProps {
  params: {
    campaignId: string
  }
  searchParams: {
    campaignName?: string
  }
}

export default function CampaignPage({ params, searchParams }: CampaignPageProps) {
  const { campaignId } = params
  const campaignName = searchParams.campaignName || `Campaign ${campaignId}`

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <a href="/campaigns" className="hover:text-blue-600">
              Campaigns
            </a>
            <span>/</span>
            <span className="text-gray-900 font-medium">{campaignName}</span>
          </nav>
        </div>

        <RingbaCampaignCalls campaignId={campaignId} campaignName={campaignName} />
      </div>
    </div>
  )
}
