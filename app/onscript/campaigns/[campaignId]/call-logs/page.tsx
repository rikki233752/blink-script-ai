import { OnScriptCallLogs } from "@/components/onscript-call-logs"

export default function OnScriptCallLogsPage({ params }: { params: { campaignId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <OnScriptCallLogs campaignId={params.campaignId} />
    </div>
  )
}
