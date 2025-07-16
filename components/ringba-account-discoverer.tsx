"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, Search, RefreshCw, User } from "lucide-react"

export function RingbaAccountDiscoverer() {
  const [isLoading, setIsLoading] = useState(false)
  const [discoveryResults, setDiscoveryResults] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [testAccountId, setTestAccountId] = useState("")

  const discoverAccount = async () => {
    setIsLoading(true)
    setError(null)
    setDiscoveryResults(null)

    try {
      const response = await fetch("/api/ringba/discover-account")
      const data = await response.json()
      setDiscoveryResults(data)

      if (!data.success) {
        setError("Failed to discover account structure")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testAccountFormat = async () => {
    if (!testAccountId.trim()) {
      setError("Please enter an account ID to test")
      return
    }

    setIsLoading(true)
    setError(null)
    setTestResults(null)

    try {
      const response = await fetch("/api/ringba/test-account-formats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: testAccountId.trim(),
        }),
      })

      const data = await response.json()
      setTestResults(data)

      if (!data.success) {
        setError("No working endpoints found for this account ID")
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
            <User className="h-6 w-6 text-blue-600" />
            RingBA Account Discoverer
          </h2>
          <p className="text-gray-600">Find your correct account ID and available endpoints</p>
        </div>
      </div>

      <Tabs defaultValue="discover">
        <TabsList>
          <TabsTrigger value="discover">Auto-Discover</TabsTrigger>
          <TabsTrigger value="test">Test Account ID</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discover Account Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                This will attempt to discover your account information and available endpoints.
              </p>
              <Button onClick={discoverAccount} disabled={isLoading}>
                <Search className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Discover Account Info
              </Button>
            </CardContent>
          </Card>

          {discoveryResults && (
            <Card>
              <CardHeader>
                <CardTitle>Discovery Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {discoveryResults.accountInfo.accountIds.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <h3 className="font-medium text-green-800 mb-2">Found Account IDs:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {discoveryResults.accountInfo.accountIds.map((id: string, i: number) => (
                          <li key={i} className="font-mono">
                            {id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {discoveryResults.accountInfo.availableEndpoints.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <h3 className="font-medium text-blue-800 mb-2">Available Endpoints:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {discoveryResults.accountInfo.availableEndpoints.map((endpoint: string, i: number) => (
                          <li key={i} className="font-mono text-xs">
                            {endpoint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {discoveryResults.accountInfo.userInfo && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                      <h3 className="font-medium mb-2">User Information:</h3>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(discoveryResults.accountInfo.userInfo, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-2">All Test Results:</h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                      {discoveryResults.results?.map((result: any, i: number) => (
                        <div key={i} className="p-3 border-b border-gray-200 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs">{result.endpoint}</span>
                            <span className={result.success ? "text-green-600" : "text-red-600"}>
                              {result.status || (result.error ? "Error" : "Unknown")}
                            </span>
                          </div>
                          {result.success && <div className="text-green-600 text-xs">✅ Available</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Specific Account ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testAccountId">Account ID</Label>
                  <Input
                    id="testAccountId"
                    value={testAccountId}
                    onChange={(e) => setTestAccountId(e.target.value)}
                    placeholder="Enter account ID (e.g., RA8e9b7b0388ea4968868bf2351b647158)"
                  />
                </div>
                <Button onClick={testAccountFormat} disabled={isLoading || !testAccountId.trim()}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Test Account ID
                </Button>
              </div>
            </CardContent>
          </Card>

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {testResults.success ? (
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
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-medium">Total Tested</div>
                      <div className="text-2xl font-bold">{testResults.summary?.totalTested || 0}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="font-medium text-green-800">Successful</div>
                      <div className="text-2xl font-bold text-green-600">{testResults.summary?.successful || 0}</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="font-medium text-red-800">Failed</div>
                      <div className="text-2xl font-bold text-red-600">{testResults.summary?.failed || 0}</div>
                    </div>
                  </div>

                  {testResults.workingEndpoints?.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <h3 className="font-medium text-green-800 mb-2">Working Endpoints:</h3>
                      <ul className="space-y-1 text-sm">
                        {testResults.workingEndpoints.map((result: any, i: number) => (
                          <li key={i} className="font-mono text-xs p-2 bg-green-100 rounded">
                            {result.endpoint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
    </div>
  )
}
