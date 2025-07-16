import { RingbaCallLogsViewer } from "@/components/ringba-call-logs-viewer"

export default function RingbaCallLogsViewerPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RingBA Call Logs Viewer</h1>
      <RingbaCallLogsViewer />
    </div>
  )
}
