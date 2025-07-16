"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format, subDays } from "date-fns"
import { AlertCircle, Bug, CheckCircle, ChevronDown, ChevronUp, Code, Loader2, RefreshCw, XCircle } from "lucide-react"

export default function RingbaCallLogsDebugPage() {
  const [campaignId, setCampaignId] = useState("CAadf75cf7aca64185b86baf836c62c3dd")
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const runDebugTest = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/ringba/debug-call-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          startDate,
          endDate,
        }),
      })

      const data = await response.json()
      setResults(data)

      if (!data.success) {
        setError(data.message || "Debug test failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("Debug test error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="h-8 w-8 text-red-600" />
            Ringba Call Logs Debug
          </h1>
          <p className="text-gray-600 mt-1">
            Test different API endpoints and authentication methods to diagnose call logs issues
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign ID</label>
              <Input
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="Enter campaign ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <Button onClick={runDebugTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Debug Tests...
              </>
            ) : (
              <>
                <Bug className="h-4 w-4 mr-2" />
                Run Debug Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Running comprehensive API tests...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-6">
          {/* Environment Check */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => toggleSection("envCheck")}>
              <CardTitle className="flex items-center justify-between">
                <span>Environment Check</span>
                {expandedSections.envCheck ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
            {expandedSections.envCheck && (
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">API Key</p>
                    <p className="text-sm">
                      {results.envCheck?.hasApiKey ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" /> Present ({results.envCheck.apiKeyLength} chars)
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500">
                          <XCircle className="h-3 w-3 mr-1" /> Missing
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account ID</p>
                    <p className="text-sm">
                      {results.envCheck?.hasAccountId ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" /> Present ({results.envCheck.accountIdLength} chars)
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500">
                          <XCircle className="h-3 w-3 mr-1" /> Missing
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Campaign ID</p>
                    <p className="text-sm">{results.envCheck?.campaignId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date Range</p>
                    <p className="text-sm">
                      {results.envCheck?.startDate} to {results.envCheck?.endDate}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Overall Result */}
          <Card className={results.success ? "border-green-500" : "border-red-500"}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                {results.success ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <h3 className="text-lg font-medium">
                    {results.success ? "Success! Found Working Method" : "All Methods Failed"}
                  </h3>
                  <p className="text-gray-600">{results.message}</p>
                </div>
              </div>

              {results.success && results.workingEndpoint && (
                <div className="mt-4 p-4 bg-green-50 rounded-md">
                  <h4 className="font-medium text-green-800">Working Configuration:</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Endpoint:</span> {results.workingEndpoint.name}
                    </div>
                    <div>
                      <span className="font-medium">Auth Method:</span> {results.workingEndpoint.auth}
                    </div>
                    <div>
                      <span className="font-medium">URL:</span>{" "}
                      <code className="text-xs bg-gray-100 p-1 rounded">{results.workingEndpoint.url}</code>
                    </div>
                    <div>
                      <span className="font-medium">Method:</span> {results.workingEndpoint.method}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => toggleSection("detailedResults")}>
              <CardTitle className="flex items-center justify-between">
                <span>Detailed Test Results</span>
                {expandedSections.detailedResults ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedSections.detailedResults && (
              <CardContent>
                <Tabs defaultValue="table">
                  <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-left">Endpoint</th>
                            <th className="p-2 text-left">Auth Method</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Response Time</th>
                            <th className="p-2 text-left">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.results?.map((result: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{result.endpoint}</td>
                              <td className="p-2">{result.auth}</td>
                              <td className="p-2">
                                {result.responseStatus} {result.responseStatusText}
                              </td>
                              <td className="p-2">{result.responseTime ? `${result.responseTime}ms` : "N/A"}</td>
                              <td className="p-2">
                                {result.success ? (
                                  <Badge className="bg-green-500">Success</Badge>
                                ) : (
                                  <Badge className="bg-red-500">Failed</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="raw">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-96">
                      <pre className="text-xs">{JSON.stringify(results.results, null, 2)}</pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>

          {/* Error Details */}
          {!results.success && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("errorDetails")}>
                <CardTitle className="flex items-center justify-between">
                  <span>Error Analysis</span>
                  {expandedSections.errorDetails ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.errorDetails && (
                <CardContent>
                  <Alert className="border-amber-200 bg-amber-50 mb-4">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Common Issues:</strong>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Invalid API key format or expired key</li>
                        <li>Incorrect Account ID</li>
                        <li>Campaign ID doesn't exist or is invalid</li>
                        <li>Date range too large or in wrong format</li>
                        <li>API permissions issues</li>
                        <li>Network connectivity problems</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {results.results?.map((result: any, index: number) => {
                      if (!result.success) {
                        return (
                          <div key={index} className="p-4 bg-gray-50 rounded-md">
                            <h4 className="font-medium">
                              {result.endpoint} with {result.auth}
                            </h4>
                            <div className="mt-2 text-sm">
                              <div>
                                <span className="font-medium">Status:</span> {result.responseStatus}{" "}
                                {result.responseStatusText}
                              </div>
                              {result.error && (
                                <div>
                                  <span className="font-medium">Error:</span> {result.error}
                                </div>
                              )}
                              {result.errorDetails && (
                                <div>
                                  <span className="font-medium">Details:</span> {result.errorDetails}
                                </div>
                              )}
                            </div>
                            {result.responseBody && (
                              <div className="mt-2">
                                <Button variant="outline" size="sm" onClick={() => toggleSection(`response-${index}`)}>
                                  {expandedSections[`response-${index}`] ? "Hide" : "Show"} Response
                                </Button>
                                {expandedSections[`response-${index}`] && (
                                  <div className="mt-2 bg-gray-900 text-gray-100 p-2 rounded-md overflow-auto max-h-40">
                                    <pre className="text-xs">{JSON.stringify(result.responseBody, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => toggleSection("recommendations")}>
              <CardTitle className="flex items-center justify-between">
                <span>Recommendations</span>
                {expandedSections.recommendations ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedSections.recommendations && (
              <CardContent>
                <div className="space-y-4">
                  {results.success ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Success!</strong> We found a working method to fetch call logs. Use the configuration
                        above in your application.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <strong>All methods failed.</strong> Here are some steps to resolve the issue:
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <h4 className="font-medium">Troubleshooting Steps:</h4>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Verify API Key:</strong> Check that your RINGBA_API_KEY environment variable is
                            correctly set and the key is valid.
                          </li>
                          <li>
                            <strong>Verify Account ID:</strong> Ensure your RINGBA_ACCOUNT_ID environment variable is
                            correct.
                          </li>
                          <li>
                            <strong>Check Campaign ID:</strong> Verify that the campaign ID exists and is accessible
                            with your API key.
                          </li>
                          <li>
                            <strong>Date Range:</strong> Try a smaller date range (e.g., last 7 days).
                          </li>
                          <li>
                            <strong>API Permissions:</strong> Ensure your API key has permissions to access call logs.
                          </li>
                          <li>
                            <strong>Network:</strong> Check if your server can reach the Ringba API endpoints.
                          </li>
                        </ol>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={runDebugTest}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Test Again
                    </Button>
                    <Button variant="outline" onClick={() => window.open("/ringba-campaigns", "_blank")}>
                      <Code className="h-4 w-4 mr-2" />
                      Check Campaigns Page
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
