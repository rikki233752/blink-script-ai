"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Phone, FileAudio, Calendar, RefreshCw, AlertTriangle, Code } from "lucide-react"

export function RingBAApiTester() {
  const [apiKey, setApiKey] = useState("")
  const [accountId, setAccountId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    error?: string
    data?: any
    responseTime?: number
  } | null>(null)
  const [callId, setCallId] = useState("")
  const [days, setDays] = useState("7")
  const [limit, setLimit] = useState("10")

  const testConnection = async () => {
    if (!apiKey || !accountId) {
      setTestResult({
        success: false,
        error: "Please enter both API key and account ID",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)
    const startTime = Date.now()

    try {
      const response = await fetch(`/api/ringba/status?apiKey=${apiKey}&accountId=${accountId}`)
      const data = await response.json()
      const responseTime = Date.now() - startTime

      setTestResult({
        success: data.success,
        error: data.error,
        data: data,
        responseTime,
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCalls = async () => {
    if (!apiKey || !accountId) {
      setTestResult({
        success: false,
        error: "Please enter both API key and account ID",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)
    const startTime = Date.now()

    try {
      const response = await fetch(
        `/api/ringba/calls?apiKey=${apiKey}&accountId=${accountId}&days=${days}&limit=${limit}`,
      )
      const data = await response.json()
      const responseTime = Date.now() - startTime

      setTestResult({
        success: data.success,
        error: data.error,
        data: data,
        responseTime,
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecording = async () => {
    if (!apiKey || !accountId || !callId) {
      setTestResult({
        success: false,
        error: "Please enter API key, account ID, and call ID",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)
    const startTime = Date.now()

    try {
      const response = await fetch(`/api/ringba/recording/${callId}?apiKey=${apiKey}&accountId=${accountId}`)
      const data = await response.json()
      const responseTime = Date.now() - startTime

      setTestResult({
        success: data.success,
        error: data.error,
        data: data,
        responseTime,
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            RingBA API Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your RingBA API key"
                className="mt-1"
                type="password"
              />
            </div>
            <div>
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Enter your RingBA account ID"
                className="mt-1"
              />
            </div>
          </div>

          <Tabs defaultValue="connection" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Connection Test</TabsTrigger>
              <TabsTrigger value="calls">Fetch Calls</TabsTrigger>
              <TabsTrigger value="recording">Get Recording</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={testConnection} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="calls" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="days">Days</Label>
                  <Input
                    id="days"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="Number of days"
                    className="mt-1"
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="limit">Limit</Label>
                  <Input
                    id="limit"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="Maximum number of calls"
                    className="mt-1"
                    type="number"
                  />
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <Button onClick={fetchCalls} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Fetch Calls
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="recording" className="mt-4">
              <div className="mb-4">
                <Label htmlFor="callId">Call ID</Label>
                <Input
                  id="callId"
                  value={callId}
                  onChange={(e) => setCallId(e.target.value)}
                  placeholder="Enter a call ID"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end mb-4">
                <Button onClick={fetchRecording} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <FileAudio className="h-4 w-4 mr-2" />
                      Get Recording
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {testResult && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-medium">Test Result</h3>
                {testResult.success ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
                {testResult.responseTime && (
                  <Badge variant="outline" className="ml-auto">
                    {testResult.responseTime}ms
                  </Badge>
                )}
              </div>

              {testResult.error && (
                <Alert className="border-red-200 bg-red-50 mb-4">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{testResult.error}</AlertDescription>
                </Alert>
              )}

              <div className="border rounded-md p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Response Data</h4>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    JSON
                  </Badge>
                </div>
                <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
