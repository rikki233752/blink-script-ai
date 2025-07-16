"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Key, Shield } from "lucide-react"

interface TestResult {
  method: string
  status?: number
  statusText?: string
  success: boolean
  errorBody?: string
  errorJson?: any
  dataType?: string
  dataLength?: number
  sampleData?: any
  error?: string
}

interface TestResponse {
  success: boolean
  results: TestResult[]
  workingMethods: TestResult[]
  environment: {
    hasApiKey: boolean
    apiKeyLength: number
    apiKeyPrefix: string
    accountId: string
  }
  summary: {
    totalMethods: number
    successfulMethods: number
    failedMethods: number
  }
}

export default function RingbaAuthTestPage() {
  const [testResults, setTestResults] = useState<TestResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAuthTest = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ringba/test-auth-methods")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Test failed")
      }

      setTestResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runAuthTest()
  }, [])

  const getStatusBadge = (result: TestResult) => {
    if (result.success) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Ringba Authentication Test
          </h1>
          <p className="text-gray-600">Comprehensive test of different authentication methods</p>
        </div>
        <Button onClick={runAuthTest} disabled={isLoading}>
          {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
          {isLoading ? "Testing..." : "Run Test"}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {testResults && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{testResults.summary.totalMethods}</div>
                  <div className="text-sm text-gray-600">Total Methods</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{testResults.summary.successfulMethods}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{testResults.summary.failedMethods}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{testResults.environment.apiKeyLength}</div>
                  <div className="text-sm text-gray-600">API Key Length</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Environment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>API Key: {testResults.environment.apiKeyPrefix}</div>
                  <div>Account ID: {testResults.environment.accountId}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Results</TabsTrigger>
              <TabsTrigger value="working">Working Methods</TabsTrigger>
              <TabsTrigger value="failed">Failed Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {testResults.results.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{result.method}</h3>
                      {getStatusBadge(result)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Status:</span> {result.status || "N/A"} {result.statusText}
                      </div>
                      {result.dataType && (
                        <div>
                          <span className="font-medium">Data:</span> {result.dataType} ({result.dataLength} items)
                        </div>
                      )}
                      {result.error && (
                        <div className="text-red-600">
                          <span className="font-medium">Error:</span> {result.error}
                        </div>
                      )}
                    </div>

                    {result.errorBody && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                        <span className="font-medium text-red-800">Error Response:</span>
                        <pre className="mt-1 text-red-700">{result.errorBody}</pre>
                      </div>
                    )}

                    {result.sampleData && (
                      <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                        <span className="font-medium text-green-800">Sample Data:</span>
                        <pre className="mt-1 text-green-700">{JSON.stringify(result.sampleData, null, 2)}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="working" className="space-y-4">
              {testResults.workingMethods.length === 0 ? (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    No authentication methods worked. Please check your API credentials.
                  </AlertDescription>
                </Alert>
              ) : (
                testResults.workingMethods.map((result, index) => (
                  <Card key={index} className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-green-800">{result.method}</h3>
                        <Badge className="bg-green-500 text-white">✅ Working</Badge>
                      </div>
                      <div className="text-sm text-green-700">
                        Status: {result.status} {result.statusText}
                      </div>
                      {result.sampleData && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                          <pre>{JSON.stringify(result.sampleData, null, 2)}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="failed" className="space-y-4">
              {testResults.results
                .filter((r) => !r.success)
                .map((result, index) => (
                  <Card key={index} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-red-800">{result.method}</h3>
                        <Badge className="bg-red-500 text-white">❌ Failed</Badge>
                      </div>
                      <div className="text-sm text-red-700">
                        Status: {result.status || "N/A"} {result.statusText}
                      </div>
                      {result.errorBody && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                          <pre className="text-red-700">{result.errorBody}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
