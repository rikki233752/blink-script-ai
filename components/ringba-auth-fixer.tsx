"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, AlertTriangle, Key, RefreshCw } from "lucide-react"

export function RingbaAuthFixer() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [accountId, setAccountId] = useState("")
  const [manualTestSuccess, setManualTestSuccess] = useState(false)

  const testAuth = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/ringba/auth-fix")
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || "Failed to find working authentication method")
        setResults(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testManualCredentials = async () => {
    if (!apiKey || !accountId) {
      setError("Please enter both API Key and Account ID")
      return
    }

    setIsLoading(true)
    setError(null)
    setManualTestSuccess(false)

    try {
      // Call our server-side API instead of direct RingBA API
      const response = await fetch("/api/ringba/test-manual-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          accountId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setManualTestSuccess(true)
      } else {
        setError(`API test failed: ${data.error}`)
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
            <Key className="h-6 w-6 text-blue-600" />
            RingBA Authentication Fixer
          </h2>
          <p className="text-gray-600">Find the correct authentication method for your RingBA API</p>
        </div>
      </div>

      <Tabs defaultValue="auto">
        <TabsList>
          <TabsTrigger value="auto">Auto-Detect</TabsTrigger>
          <TabsTrigger value="manual">Manual Test</TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Detect Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                This will test multiple authentication methods and API endpoints using your environment variables.
              </p>
              <Button onClick={testAuth} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Test Authentication Methods
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
                      Working Authentication Found!
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-2" />
                      No Working Authentication Found
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.success ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <h3 className="font-medium text-green-800 mb-2">Working Combination:</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Endpoint:</span> {results.workingCombination.endpoint}
                        </div>
                        <div>
                          <span className="font-medium">Auth Method:</span> {results.workingCombination.authMethod}
                        </div>
                        <div>
                          <span className="font-medium">Headers:</span>
                          <pre className="mt-1 p-2 bg-green-100 rounded overflow-x-auto text-xs">
                            {JSON.stringify(results.workingCombination.headers, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-md">
                      <h3 className="font-medium mb-2">Next Steps:</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Update your RingBA integration code to use this authentication method</li>
                        <li>Test your integration with the working endpoint format</li>
                        <li>Save these settings for future reference</li>
                      </ol>
                    </div>
                  </div>
                ) : (
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
                              <span className="font-medium">{result.authMethod}</span>
                              <span className={result.success ? "text-green-600" : "text-red-600"}>
                                {result.status || "Error"}
                              </span>
                            </div>
                            <div className="text-gray-600 text-xs truncate">{result.endpoint}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Credentials Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your RingBA API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="Enter your RingBA Account ID"
                  />
                </div>
                <Button onClick={testManualCredentials} disabled={isLoading || !apiKey || !accountId}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Test Credentials
                </Button>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {manualTestSuccess && (
                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Success!</strong> Your credentials are working correctly.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Common RingBA API Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>
                    <strong>API Key Format:</strong> RingBA API keys typically start with "sk_" and are 32-64 characters
                    long
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>
                    <strong>Account ID Format:</strong> Make sure you're using the correct account ID, not the user ID
                    or campaign ID
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>
                    <strong>API Permissions:</strong> Your API key needs "Read" permissions for Campaigns and Call Logs
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>
                    <strong>IP Restrictions:</strong> Check if your API key has IP restrictions that might be blocking
                    access
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>
                    <strong>API Version:</strong> RingBA may have updated their API. Check their documentation for the
                    latest endpoints
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
