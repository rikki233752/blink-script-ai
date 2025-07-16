"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AuthTestResult {
  method: string
  status: number
  success: boolean
  headers: Record<string, string>
  response: any
  callLogsTest?: {
    status: number
    success: boolean
    response: any
  }
  error?: string
}

interface AuthTestResponse {
  success: boolean
  workingMethods: AuthTestResult[]
  allResults: AuthTestResult[]
  recommendations: string[]
  error?: string
}

export function RingbaAuthMethodTester() {
  const [testResult, setTestResult] = useState<AuthTestResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const testAuthMethods = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ringba/test-auth-methods", {
        method: "POST",
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        workingMethods: [],
        allResults: [],
        recommendations: [],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RingBA Authentication Method Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAuthMethods} disabled={loading}>
            {loading ? "Testing Authentication Methods..." : "Test All Auth Methods"}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <div className="space-y-4">
          {/* Working Methods */}
          {testResult.workingMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✅ Working Authentication Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResult.workingMethods.map((method, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {method.method}
                        </Badge>
                        <Badge variant="outline">Status: {method.status}</Badge>
                      </div>

                      {method.callLogsTest && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={
                              method.callLogsTest.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }
                          >
                            Call Logs: {method.callLogsTest.status} {method.callLogsTest.success ? "✅" : "❌"}
                          </Badge>
                        </div>
                      )}

                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Headers:</strong>
                        <pre className="bg-gray-50 p-2 rounded mt-1 text-xs overflow-x-auto">
                          {JSON.stringify(method.headers, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Results */}
          <Card>
            <CardHeader>
              <CardTitle>All Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResult.allResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.method}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>{result.status || "Error"}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">{result.success ? "✅ Success" : "❌ Failed"}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {testResult.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Error */}
          {testResult.error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 p-4 rounded">
                  <pre className="text-red-800 whitespace-pre-wrap">{testResult.error}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
