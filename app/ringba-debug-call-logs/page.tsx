import { RingbaCallLogsDebugger } from "@/components/ringba-call-logs-debugger"

export default function RingbaDebugCallLogsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">RingBA Call Logs API Debugger</h1>
        <p className="text-gray-600 mt-2">
          Test the RingBA call logs API to discover available columns and data structure
        </p>
      </div>

      <RingbaCallLogsDebugger />
    </div>
  )
}
