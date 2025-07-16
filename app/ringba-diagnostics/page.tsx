import { RingbaApiDiagnostics } from "@/components/ringba-api-diagnostics"

export default function RingbaDiagnosticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ringba API Diagnostics</h1>
          <p className="text-gray-600">Test and troubleshoot your Ringba API connection</p>
        </div>

        <RingbaApiDiagnostics />
      </div>
    </div>
  )
}
