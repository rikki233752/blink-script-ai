"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface DebugResponse {
  success: boolean
  error?: string
  debug: {
    request?: {
      url: string
      method: string
      headers: Record<string, string>
      body: any
    }
    response?: {
      status: number
      statusText: string
      headers: Record<string, string>
      data: any
    }
    hasAccountId?: boolean
    hasApiKey?: boolean
    accountId?: string
  }
}

export function RingbaRequestDebugger() {
  const [campaignId, setCampaignId] = useState("")
  const [campaignName, setCampaignName] = useState("Medi (2) - Tier 2")
  const [debugResult, setDebugResult] = useState<DebugResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const debugRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ringba/debug-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          campaignName,
        }),
      })

      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      setDebugResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {},
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter campaign name to filter by"
            />
          </div>

          <div>
            <Label htmlFor="campaignId">Campaign ID (Optional)</Label>
            <Input
              id="campaignId"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="Enter campaign ID"
            />
          </div>

          <Button onClick={debugRequest} disabled={loading}>
            {loading ? "Debugging..." : "Debug API Request"}
          </Button>
        </CardContent>
      </Card>

      {debugResult && (
        <div className="space-y-4">
          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${debugResult.debug.hasAccountId ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>Account ID: {debugResult.debug.hasAccountId ? "Set" : "Missing"}</span>
                  {debugResult.debug.accountId && (
                    <span className="text-gray-500">({debugResult.debug.accountId})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${debugResult.debug.hasApiKey ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>API Key: {debugResult.debug.hasApiKey ? "Set" : "Missing"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          {debugResult.debug.request && (
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>URL</Label>
                    <Input value={debugResult.debug.request.url} readOnly />
                  </div>

                  <div>
                    <Label>Method</Label>
                    <Input value={debugResult.debug.request.method} readOnly />
                  </div>

                  <div>
                    <Label>Headers</Label>
                    <Textarea value={JSON.stringify(debugResult.debug.request.headers, null, 2)} readOnly rows={4} />
                  </div>

                  <div>
                    <Label>Request Body</Label>
                    <Textarea value={JSON.stringify(debugResult.debug.request.body, null, 2)} readOnly rows={10} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Details */}
          {debugResult.debug.response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Response Details
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      debugResult.debug.response.status < 300
                        ? "bg-green-100 text-green-800"
                        : debugResult.debug.response.status < 400
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {debugResult.debug.response.status} {debugResult.debug.response.statusText}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Response Headers</Label>
                    <Textarea value={JSON.stringify(debugResult.debug.response.headers, null, 2)} readOnly rows={6} />
                  </div>

                  <div>
                    <Label>Response Data</Label>
                    <Textarea
                      value={
                        typeof debugResult.debug.response.data === "string"
                          ? debugResult.debug.response.data
                          : JSON.stringify(debugResult.debug.response.data, null, 2)
                      }
                      readOnly
                      rows={15}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          {debugResult.error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 p-4 rounded">
                  <pre className="text-red-800 whitespace-pre-wrap">{debugResult.error}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
