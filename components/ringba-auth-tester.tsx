"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Key, ExternalLink } from "lucide-react"

interface TestResult {
  endpoint: string
  authMethod: string
  status: number | string
  statusText?: string
  success: boolean
  data?: any
  error?: string
}

export function RingbaAuthTester() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [apiInfo, setApiInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("results")

  useEffect(() => {
    runTest()
  }, [])

  const runTest = async () => {
    setIsRunning(true)
    setResults([])

    try {
      const response = await fetch("/api/ringba/auth-test")
      const data = await response.json()

      setApiInfo({
        success: data.success,
        apiKeyLength: data.apiKeyLength,
        accountIdLength: data.accountIdLength,
        apiKeyPrefix: data.apiKeyPrefix,
        accountIdPrefix: data.accountIdPrefix,
        message: data.message,
      })

      setResults(data.testResults || [])
    } catch (error) {
      console.error("Error running auth test:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return <Badge className="bg-green-500 text-white">Success</Badge>
    } else {
      return <Badge className="bg-red-500 text-white">Failed</Badge>
    }
  }

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Ringba API Authentication Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={runTest} disabled={isRunning} className="bg-blue-600 hover:bg-blue-700">
                {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                {isRunning ? "Testing..." : "Test Authentication"}
              </Button>

              <div className="text-sm text-gray-600">
                This will test your Ringba API credentials with multiple authentication methods
              </div>
            </div>

            <a
              href="https://app.ringba.com/#/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              Open Ringba Dashboard <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>

          {apiInfo && (
            <Alert className={apiInfo.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {apiInfo.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={apiInfo.success ? "text-green-800" : "text-red-800"}>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{apiInfo.message}</strong>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <div>
                    API Key: {apiInfo.apiKeyPrefix} ({apiInfo.apiKeyLength} characters)
                  </div>
                  <div>
                    Account ID: {apiInfo.accountIdPrefix} ({apiInfo.accountIdLength} characters)
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="help">Troubleshooting</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4 pt-4">
              {isRunning ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">Testing authentication methods...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.success)}
                        <div>
                          <div className="font-medium">{result.authMethod}</div>
                          <div className="text-xs text-gray-500">{result.endpoint}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-600">
                          {result.status} {result.statusText}
                        </div>
                        {getStatusBadge(result.success)}
                      </div>
                    </div>
                  ))}

                  {results.every((r) => !r.success) && (
                    <Alert className="border-red-200 bg-red-50 mt-4">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>All authentication methods failed.</strong> Please check your API key and account ID.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No test results yet. Click "Test Authentication" to begin.
                </div>
              )}
            </TabsContent>

            <TabsContent value="help" className="pt-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">How to get your Ringba API credentials:</h3>
                  <ol className="space-y-2 text-sm text-blue-700">
                    <li>
                      1. Log into your Ringba dashboard at{" "}
                      <a href="https://app.ringba.com" target="_blank" rel="noopener noreferrer" className="underline">
                        app.ringba.com
                      </a>
                    </li>
                    <li>2. Go to Settings → API Keys</li>
                    <li>3. Create a new API key with "Campaigns" and "Calls" permissions</li>
                    <li>4. Copy your Account ID from the main dashboard</li>
                    <li>5. Set environment variables: RINGBA_API_KEY and RINGBA_ACCOUNT_ID</li>
                  </ol>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">Common authentication issues:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      • <strong>Invalid API Key</strong> - Regenerate your API key in Ringba dashboard
                    </li>
                    <li>
                      • <strong>Incorrect Account ID</strong> - Verify your account ID in Ringba dashboard
                    </li>
                    <li>
                      • <strong>Missing Permissions</strong> - Ensure API key has "Campaigns" and "Calls" permissions
                    </li>
                    <li>
                      • <strong>API Key Expired</strong> - API keys may expire; create a new one
                    </li>
                    <li>
                      • <strong>IP Restrictions</strong> - Check if your API key has IP restrictions
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">Example environment variables:</h3>
                  <div className="bg-white p-2 rounded border border-green-100 font-mono text-sm">
                    <div>RINGBA_API_KEY=09f0c9f0c033544593cea5409fad971c...</div>
                    <div>RINGBA_ACCOUNT_ID=RA8e9b7b0388ea4968868bf2351b647158</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
