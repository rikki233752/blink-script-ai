import { OnScriptCampaignCallLogs } from "@/components/onscript-campaign-call-logs"

interface PageProps {
  params: {
    campaignId: string
  }
  searchParams: {
    campaignName?: string
  }
}

export default function CampaignCallLogsPage({ params, searchParams }: PageProps) {
  return (
    <OnScriptCampaignCallLogs
      campaignId={params.campaignId}
      campaignName={searchParams.campaignName || `Campaign ${params.campaignId}`}
    />
  )
}
