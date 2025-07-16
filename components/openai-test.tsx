"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Key, Zap, Clock } from "lucide-react"

interface TestResult {
  success: boolean
  status: string
  message?: string
  error?: string
  testResponse?: string
  model?: string
  usage?: any
  apiKeyPrefix?: string
  httpStatus?: number
  details?: string
  timestamp: string
}

export function OpenAITest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const testOpenAI = async () => {
    setTesting(true)
    setResult(null)

    try {
      console.log("🧪 Testing OpenAI API integration...")

      const response = await fetch("/api/test-openai", {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        console.log("✅ OpenAI API test successful:", data)
      } else {
        console.error("❌ OpenAI API test failed:", data)
      }
    } catch (error: any) {
      console.error("❌ Test request failed:", error)
      setResult({
        success: false,
        status: "request_failed",
        error: `Test request failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = () => {
    if (!result) return null

    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (result.status === "missing_key") {
      return <Key className="h-5 w-5 text-orange-600" />
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusColor = () => {
    if (!result) return "gray"

    switch (result.status) {
      case "working":
        return "green"
      case "missing_key":
        return "orange"
      case "invalid_key":
        return "red"
      case "rate_limit":
        return "yellow"
      case "quota_exceeded":
        return "red"
      default:
        return "red"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          OpenAI API Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>This test verifies that your OpenAI API key is properly configured and working.</p>
          <p className="mt-1">It will make a simple API call to test the connection.</p>
        </div>

        <Button onClick={testOpenAI} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Testing OpenAI API...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Test OpenAI Integration
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge
                variant={result.success ? "default" : "destructive"}
                className={`${
                  getStatusColor() === "green"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : getStatusColor() === "orange"
                      ? "bg-orange-100 text-orange-800 border-orange-200"
                      : getStatusColor() === "yellow"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                {result.status.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>

            {/* Success Message */}
            {result.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p>
                      <strong>✅ OpenAI API is working correctly!</strong>
                    </p>
                    <p>{result.message}</p>
                    {result.testResponse && (
                      <div className="bg-white p-2 rounded border">
                        <strong>Test Response:</strong> "{result.testResponse}"
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {!result.success && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p>
                      <strong>❌ OpenAI API Test Failed</strong>
                    </p>
                    <p>{result.error}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Error Details</summary>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">{result.details}</pre>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* API Details */}
            {result.success && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {result.model && (
                  <div>
                    <strong>Model:</strong>
                    <Badge variant="outline" className="ml-2">
                      {result.model}
                    </Badge>
                  </div>
                )}
                {result.apiKeyPrefix && (
                  <div>
                    <strong>API Key:</strong>
                    <Badge variant="outline" className="ml-2">
                      {result.apiKeyPrefix}
                    </Badge>
                  </div>
                )}
                {result.usage && (
                  <div>
                    <strong>Tokens Used:</strong>
                    <Badge variant="outline" className="ml-2">
                      {result.usage.total_tokens || 0}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Troubleshooting */}
            {!result.success && (
              <div className="bg-gray-50 p-3 rounded border text-sm">
                <h4 className="font-medium mb-2">Troubleshooting:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {result.status === "missing_key" && (
                    <>
                      <li>Add your OpenAI API key to the environment variables</li>
                      <li>Set OPENAI_API_KEY in your deployment settings</li>
                      <li>Restart your application after adding the key</li>
                    </>
                  )}
                  {result.status === "invalid_key" && (
                    <>
                      <li>Check that your OpenAI API key is correct</li>
                      <li>Verify the key hasn't expired</li>
                      <li>Make sure you're using the correct format (sk-...)</li>
                    </>
                  )}
                  {result.status === "quota_exceeded" && (
                    <>
                      <li>Check your OpenAI billing and usage limits</li>
                      <li>Add payment method to your OpenAI account</li>
                      <li>Verify your account has sufficient credits</li>
                    </>
                  )}
                  {result.status === "rate_limit" && (
                    <>
                      <li>Wait a moment and try again</li>
                      <li>Check your OpenAI usage limits</li>
                      <li>Consider upgrading your OpenAI plan</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Test completed at: {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
