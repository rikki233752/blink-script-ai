"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Key, Server } from "lucide-react"

export default function RingbaAuthDebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testAuth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ringba/test-auth")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Key className="h-8 w-8 text-blue-600" />
            Ringba Authentication Debug
          </h1>
          <p className="text-gray-600">Test Ringba API authentication and endpoints</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Authentication Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAuth} disabled={isLoading} className="mb-4">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Ringba Authentication"
            )}
          </Button>

          {results && (
            <div className="space-y-4">
              <Alert className={results.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {results.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={results.success ? "text-green-800" : "text-red-800"}>
                    {results.success ? "Authentication successful!" : "Authentication failed"}
                  </AlertDescription>
                </div>
              </Alert>

              {results.environment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Environment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">API Key:</span>{" "}
                        <Badge variant={results.environment.hasApiKey ? "default" : "destructive"}>
                          {results.environment.hasApiKey ? "Present" : "Missing"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">API Key Length:</span> {results.environment.apiKeyLength}
                      </div>
                      <div>
                        <span className="font-medium">Account ID:</span> {results.environment.accountId || "Missing"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.results && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Endpoint Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.results.map((result: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{result.endpoint}</span>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "Success" : "Failed"}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              Status: {result.status} {result.statusText}
                            </div>

                            {result.success && result.dataType && (
                              <div>
                                Data: {result.dataType} ({result.dataLength} items)
                              </div>
                            )}

                            {result.errorBody && <div className="text-red-600">Error: {result.errorBody}</div>}

                            {result.sampleData && (
                              <details className="mt-2">
                                <summary className="cursor-pointer font-medium">Sample Data</summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                  {JSON.stringify(result.sampleData, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.error && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Error Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-red-50 p-4 rounded overflow-auto">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
