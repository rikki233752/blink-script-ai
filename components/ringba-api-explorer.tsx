"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, Search, RefreshCw, AlertTriangle } from "lucide-react"

export function RingbaApiExplorer() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testDirectApi = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/ringba/direct-test")
      const data = await response.json()
      setResults(data)

      if (!data.success) {
        setError("No working endpoints found. See details below.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-600" />
            RingBA API Explorer
          </h2>
          <p className="text-gray-600">Discover the correct RingBA API structure</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This will test basic RingBA API endpoints without requiring an account ID.
          </p>
          <Button onClick={testDirectApi} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Test Base API Endpoints
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>
              {results.success ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Found Working Endpoints!
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  No Working Endpoints Found
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">Recommendations:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {results.recommendations?.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Test Results:</h3>
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
                  {results.results?.map((result: any, i: number) => (
                    <div key={i} className="p-3 border-b border-gray-200 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{result.endpoint}</span>
                        <span className={result.success ? "text-green-600" : "text-red-600"}>
                          {result.status || (result.error ? "Error" : "Unknown")}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs">{result.auth && `Auth: ${result.auth}`}</div>
                      {result.error && <div className="text-red-500 text-xs mt-1">{result.error}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-md">
                <h3 className="font-medium mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  Next Steps:
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Contact RingBA support to confirm your account ID</li>
                  <li>Ask for their latest API documentation</li>
                  <li>Verify your API key has the necessary permissions</li>
                  <li>Consider using RingBA's official SDK if available</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
