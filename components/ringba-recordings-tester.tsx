"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle, Copy, PlayCircle, Calendar, Phone } from "lucide-react"

export default function RingbaRecordingsTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [testParams, setTestParams] = useState({
    startDate: "2025-03-01T00:00:00Z",
    endDate: "2025-06-07T23:59:59Z",
    campaignId: "CA17d81331537e4d47a888c431661b0bab",
    pageSize: 50,
    pageIndex: 0,
  })

  const testRecordingsAPI = async () => {
    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/ringba/calllogs-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testParams),
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <PlayCircle className="h-8 w-8 text-blue-600" />
          Ringba Call Recordings Fetcher
        </h1>
        <p className="text-muted-foreground">Test and fetch call logs with recordings from your Ringba account</p>
      </div>

      {/* Test Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Test Parameters
          </CardTitle>
          <CardDescription>Configure the parameters for fetching call logs with recordings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={testParams.startDate.slice(0, -1)}
                onChange={(e) => setTestParams({ ...testParams, startDate: e.target.value + "Z" })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={testParams.endDate.slice(0, -1)}
                onChange={(e) => setTestParams({ ...testParams, endDate: e.target.value + "Z" })}
              />
            </div>
            <div>
              <Label htmlFor="campaignId">Campaign ID (Optional)</Label>
              <Input
                id="campaignId"
                placeholder="Leave empty for all campaigns"
                value={testParams.campaignId}
                onChange={(e) => setTestParams({ ...testParams, campaignId: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pageSize">Page Size</Label>
              <Input
                id="pageSize"
                type="number"
                min="1"
                max="1000"
                value={testParams.pageSize}
                onChange={(e) => setTestParams({ ...testParams, pageSize: Number.parseInt(e.target.value) || 50 })}
              />
            </div>
          </div>

          <Button onClick={testRecordingsAPI} disabled={isLoading} size="lg" className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Ringba Recordings API...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Fetch Call Logs with Recordings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Success Result */}
          {results.success && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Success! Found Call Logs with Recordings
                </CardTitle>
                <CardDescription>Successfully connected to Ringba API and found call data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700">Working Endpoint:</h4>
                    <code className="text-sm bg-green-100 p-2 rounded block mt-1 break-all">
                      {results.workingEndpoint}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700">Authentication:</h4>
                    <Badge variant="outline" className="mt-1">
                      {results.workingAuth}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700">Recordings Found:</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <PlayCircle className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-lg">{results.result?.recordingsFound || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-green-700">Request Body Used:</h4>
                  <div className="relative">
                    <pre className="text-xs bg-green-100 p-3 rounded mt-1 overflow-x-auto max-h-40">
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

                {results.result?.dataStructure && (
                  <div>
                    <h4 className="font-semibold text-green-700">Response Data Structure:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {results.result.dataStructure.map((key: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {results.result?.data && (
                  <div>
                    <h4 className="font-semibold text-green-700">Sample Response Data:</h4>
                    <div className="relative">
                      <pre className="text-xs bg-green-100 p-3 rounded mt-1 overflow-x-auto max-h-60">
                        {JSON.stringify(results.result.data, null, 2).substring(0, 2000)}
                        {JSON.stringify(results.result.data, null, 2).length > 2000 && "\n... (truncated)"}
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(JSON.stringify(results.result.data, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Test Summary */}
                <div className="bg-green-100 p-3 rounded">
                  <h4 className="font-semibold text-green-700 mb-2">Test Summary:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Tests:</span> {results.summary?.totalTests || 0}
                    </div>
                    <div>
                      <span className="font-medium">Successful:</span> {results.summary?.successfulTests || 0}
                    </div>
                    <div>
                      <span className="font-medium">Failed:</span> {results.summary?.failedTests || 0}
                    </div>
                  </div>
                </div>
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
                  <h4 className="font-semibold text-red-700">Request Parameters Tested:</h4>
                  <pre className="text-xs bg-red-100 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(results.requestBody || testParams, null, 2)}
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

                {/* Test Summary */}
                {results.summary && (
                  <div className="bg-red-100 p-3 rounded">
                    <h4 className="font-semibold text-red-700 mb-2">Test Summary:</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Tests:</span> {results.summary.totalTests}
                      </div>
                      <div>
                        <span className="font-medium">Successful:</span> {results.summary.successfulTests}
                      </div>
                      <div>
                        <span className="font-medium">Failed:</span> {results.summary.failedTests}
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
                              {result.authMethod} - {result.endpoint}
                            </span>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.status || "Error"}
                            </Badge>
                          </div>
                          {result.error && <p className="text-red-600 mt-1 text-xs">{result.error}</p>}
                          {result.recordingsFound !== undefined && (
                            <p className="text-green-600 mt-1 text-xs">Recordings found: {result.recordingsFound}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Results Summary */}
          {results.allResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  All Test Results Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.allResults.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{result.endpoint}</span>
                        <span className="text-xs text-gray-500 ml-2">({result.authMethod})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.recordingsFound !== undefined && (
                          <span className="text-xs text-green-600">{result.recordingsFound} recordings</span>
                        )}
                        <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                          {result.status || "Error"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
