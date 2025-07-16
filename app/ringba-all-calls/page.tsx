import { AllRingbaCalls } from "@/components/all-ringba-calls"

export const metadata = {
  title: "All Ringba Call Logs",
  description: "View and manage all call logs from your Ringba campaigns",
}

export default function RingbaAllCallsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">All Ringba Call Logs</h1>
      <AllRingbaCalls />
    </div>
  )
}
