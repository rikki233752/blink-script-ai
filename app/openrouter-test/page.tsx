import { OpenRouterComprehensiveTest } from "@/components/openrouter-comprehensive-test"

export default function OpenRouterTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">OpenRouter API Test</h1>
        <p className="text-gray-600">
          Test the OpenRouter API integration with GPT-4o Mini for comprehensive call analysis.
        </p>
      </div>
      <OpenRouterComprehensiveTest />
    </div>
  )
}
