import { CampaignCallFetcher } from "@/components/campaign-call-fetcher"

export default function CampaignCallsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Campaign Call Logs</h1>

      <CampaignCallFetcher
        campaignId="CA44105a090ea24f0bbfdd5a823af7b2ec"
        startDate="2024-06-01T00:00:00Z"
        endDate="2025-06-10T23:59:59Z"
      />
    </div>
  )
}
