"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Copy } from "lucide-react"

export default function RingbaCalllogsTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testCalllogsAPI = async () => {
    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/ringba/calllogs-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: "2025-03-01T00:00:00Z",
          endDate: "2025-06-07T23:59:59Z",
          campaignId: "CA17d81331537e4d47a888c431661b0bab",
          pageSize: 100,
          pageIndex: 0,
        }),
      })

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Ringba Calllogs API Tester</h1>
        <p className="text-muted-foreground">
          Test the exact Ringba calllogs API format with different endpoints and authentication methods
        </p>

        <Button onClick={testCalllogsAPI} disabled={isLoading} size="lg" className="w-full max-w-md">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Ringba Calllogs API...
            </>
          ) : (
            "Test Ringba Calllogs API"
          )}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Success Result */}
          {results.success && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Success! Found Working Configuration
                </CardTitle>
                <CardDescription>The following endpoint and authentication method worked successfully</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700">Working Endpoint:</h4>
                    <code className="text-sm bg-green-100 p-2 rounded block mt-1">{results.workingEndpoint}</code>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700">Working Auth Method:</h4>
                    <Badge variant="outline" className="mt-1">
                      {results.workingAuth}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-green-700">Request Body Used:</h4>
                  <div className="relative">
                    <pre className="text-xs bg-green-100 p-3 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(results.requestBody, null, 2)}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(JSON.stringify(results.requestBody, null, 2))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {results.result?.data && (
                  <div>
                    <h4 className="font-semibold text-green-700">Response Data Structure:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {results.result.dataStructure.map((key: string) => (
                        <Badge key={key} variant="secondary">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Failure Results */}
          {!results.success && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  No Working Configuration Found
                </CardTitle>
                <CardDescription>All tested endpoints and authentication methods failed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-700">Request Body Tested:</h4>
                  <pre className="text-xs bg-red-100 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(results.requestBody, null, 2)}
                  </pre>
                </div>

                {results.troubleshooting && (
                  <div>
                    <h4 className="font-semibold text-red-700">Troubleshooting Info:</h4>
                    <div className="bg-red-100 p-3 rounded mt-1 space-y-2">
                      <p>
                        <strong>Account ID:</strong> {results.troubleshooting.accountId}
                      </p>
                      <p>
                        <strong>API Key Length:</strong> {results.troubleshooting.apiKeyLength}
                      </p>
                      <p>
                        <strong>API Key Prefix:</strong> {results.troubleshooting.apiKeyPrefix}
                      </p>

                      <div>
                        <strong>Possible Issues:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {results.troubleshooting.possibleIssues.map((issue: string, index: number) => (
                            <li key={index} className="text-sm">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Results */}
                {results.results && (
                  <div>
                    <h4 className="font-semibold text-red-700">Detailed Test Results:</h4>
                    <div className="space-y-2 mt-2 max-h-96 overflow-y-auto">
                      {results.results.map((result: any, index: number) => (
                        <div key={index} className="bg-red-100 p-2 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {result.authMethod} - {result.endpoint.split("/").pop()}
                            </span>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.status || "Error"}
                            </Badge>
                          </div>
                          {result.error && <p className="text-red-600 mt-1 text-xs">{result.error}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
