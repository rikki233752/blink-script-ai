"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Key, Server, Globe } from "lucide-react"

interface TestResult {
  endpoint: string
  status?: number
  statusText?: string
  success: boolean
  headers?: Record<string, string>
  data?: any
  error?: string
}

interface CredentialTestResponse {
  success: boolean
  credentials: {
    hasApiKey: boolean
    apiKeyLength: number
    apiKeyPrefix: string
    accountId: string
  }
  testResults: TestResult[]
  recommendations: string[]
  error?: string
}

export function RingbaCredentialTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<CredentialTestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testCredentials = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/ringba/test-credentials")
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || "Failed to test credentials")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (success: boolean, status?: number) => {
    if (success) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
        </Badge>
      )
    } else if (status === 401 || status === 403) {
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          Auth Failed
        </Badge>
      )
    } else if (status === 404) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Not Found
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-6 w-6 text-blue-600" />
            RingBA Credential Tester
          </h2>
          <p className="text-gray-600">Test your RingBA API credentials and connectivity</p>
        </div>
        <Button onClick={testCredentials} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Test Credentials
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Credentials Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Credential Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Key:</span>
                    {results.credentials.hasApiKey ? (
                      <Badge className="bg-green-500 text-white">✓ Present</Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white">✗ Missing</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Key Length:</span>
                    <span className="text-sm text-gray-600">{results.credentials.apiKeyLength} characters</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Key Preview:</span>
                    <span className="text-sm font-mono text-gray-600">{results.credentials.apiKeyPrefix}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account ID:</span>
                    <span className="text-sm font-mono text-gray-600">{results.credentials.accountId}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                API Endpoint Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.testResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">{result.endpoint}</span>
                      </div>
                      {getStatusBadge(result.success, result.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <span className="text-gray-600">
                          {result.status} {result.statusText}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Success:</span>{" "}
                        <span className={result.success ? "text-green-600" : "text-red-600"}>
                          {result.success ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Response:</span>{" "}
                        <span className="text-gray-600">
                          {result.error ? "Error" : typeof result.data === "object" ? "JSON" : "Text"}
                        </span>
                      </div>
                    </div>

                    {result.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}

                    {result.data && typeof result.data === "object" && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <strong>Response Data:</strong>
                        <pre className="mt-1 overflow-x-auto">{JSON.stringify(result.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Troubleshooting Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
