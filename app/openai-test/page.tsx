import { OpenAITest } from "@/components/openai-test"

export default function OpenAITestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OpenAI API Integration Test</h1>
          <p className="mt-2 text-gray-600">
            Test your OpenAI API key configuration and verify the connection is working properly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <OpenAITest />
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">How to Set Up OpenAI API Key</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>
                  Go to{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAI API Keys
                  </a>
                </li>
                <li>Create a new API key</li>
                <li>Copy the key (starts with sk-...)</li>
                <li>Add it to your environment variables as OPENAI_API_KEY</li>
                <li>Restart your application</li>
                <li>Click the test button above</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">What This Test Does</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                <li>Checks if OPENAI_API_KEY environment variable exists</li>
                <li>Makes a test API call to OpenAI</li>
                <li>Verifies the API key is valid and working</li>
                <li>Shows usage information and model details</li>
                <li>Provides troubleshooting guidance if issues are found</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-4 text-green-900">Used For Call Analysis</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-green-800">
                <li>Intent detection and classification</li>
                <li>Sentiment analysis of conversations</li>
                <li>Business conversion analysis</li>
                <li>Call disposition determination</li>
                <li>Coaching insights generation</li>
                <li>Summary and report generation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
