"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CheckCircle, FileText, RefreshCw, Search } from "lucide-react"

export function RingbaCalllogsDetailTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [params, setParams] = useState({
    campaignId: "",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
    endDate: new Date().toISOString().split("T")[0], // today
    pageSize: "100",
    pageNumber: "1",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setParams((prev) => ({ ...prev, [name]: value }))
  }

  const testCalllogsDetail = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/ringba/calllogs-detail-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: params.campaignId,
          startDate: params.startDate,
          endDate: params.endDate,
          pageSize: Number.parseInt(params.pageSize),
          pageNumber: Number.parseInt(params.pageNumber),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to test calllogs/detail endpoint")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("Error testing calllogs/detail:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Ringba calllogs/detail Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Campaign ID</label>
                <Input
                  name="campaignId"
                  placeholder="e.g., CAadf75cf7aca64185b86baf836c62c3dd"
                  value={params.campaignId}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input name="startDate" type="date" value={params.startDate} onChange={handleInputChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input name="endDate" type="date" value={params.endDate} onChange={handleInputChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Page Size</label>
                <Input name="pageSize" type="number" value={params.pageSize} onChange={handleInputChange} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Page Number</label>
                <Input name="pageNumber" type="number" value={params.pageNumber} onChange={handleInputChange} />
              </div>
            </div>

            <Button onClick={testCalllogsDetail} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Test calllogs/detail Endpoint
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="formatted">
              <TabsList>
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
                <TabsTrigger value="raw">Raw Response</TabsTrigger>
                <TabsTrigger value="request">Request</TabsTrigger>
              </TabsList>
              <TabsContent value="formatted" className="space-y-4">
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-green-800 font-medium">✅ Successfully tested calllogs/detail endpoint!</p>
                  <p className="text-green-700 text-sm mt-1">Endpoint: {result.endpoint}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Call Logs Found:</h3>
                  <p className="text-lg font-bold">
                    {Array.isArray(result.data)
                      ? result.data.length
                      : Array.isArray(result.data?.callLogs)
                        ? result.data.callLogs.length
                        : Array.isArray(result.data?.calls)
                          ? result.data.calls.length
                          : Array.isArray(result.data?.items)
                            ? result.data.items.length
                            : "Unknown"}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Response Structure:</h3>
                  <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(Object.keys(result.data), null, 2)}
                  </pre>
                </div>
              </TabsContent>
              <TabsContent value="raw">
                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </TabsContent>
              <TabsContent value="request">
                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-96">
                  {JSON.stringify(result.requestPayload, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
