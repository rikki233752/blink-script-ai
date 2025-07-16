import { RingbaColumnDiscoverer } from "@/components/ringba-column-discoverer"

export default function RingbaColumnDiscoveryPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RingBA Column Discovery</h1>
          <p className="text-gray-600 mt-2">
            Discover the available columns in your RingBA API to fix column name errors.
          </p>
        </div>

        <RingbaColumnDiscoverer />
      </div>
    </div>
  )
}
