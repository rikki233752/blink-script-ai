import { RingbaAuthMethodTester } from "@/components/ringba-auth-method-tester"

export default function RingbaAuthTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">RingBA Authentication Tester</h1>
        <p className="text-gray-600 mt-2">
          Test different authentication methods to find the one that works with your RingBA API key.
        </p>
      </div>

      <RingbaAuthMethodTester />
    </div>
  )
}
