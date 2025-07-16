import { VocalyticsDebugger } from "@/components/vocalytics-debug"

export default function VocalyticsDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Vocalytics Debug Tool</h1>
      <VocalyticsDebugger />
    </div>
  )
}
