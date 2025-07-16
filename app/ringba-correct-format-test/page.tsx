import { RingbaCorrectFormatTester } from "@/components/ringba-correct-format-tester"

export default function RingbaCorrectFormatTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ringba Call Logs - Correct Format Test</h1>
        <p className="text-gray-600">
          Testing call logs API with the exact format you provided: filters array with column/operator/value structure.
        </p>
      </div>

      <RingbaCorrectFormatTester />
    </div>
  )
}
