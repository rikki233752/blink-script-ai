import { DeepgramStatusDashboard } from "@/components/deepgram-status-dashboard"

export default function DeepgramStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Deepgram API Status</h1>
            <p className="text-sm text-gray-600">Monitor and test your Deepgram integration</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DeepgramStatusDashboard />
      </div>
    </div>
  )
}
