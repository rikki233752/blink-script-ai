"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, TestTube, CheckCircle, XCircle } from "lucide-react"

export function RingbaCallLogsTester() {
  const [campaignId, setCampaignId] = useState("CAf7d9211d22bc44a6b9070c974dc78ba1")
  const [startDate, setStartDate] = useState("2024-05-01T00:00:00Z")
  const [endDate, setEndDate] = useState("2024-05-31T23:59:59Z")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testCallLogsAPI = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/ringba/test-call-logs", {
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
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: String(error),
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
            <TestTube className="h-5 w-5" />
            Ringba Call Logs API Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="campaignId">Campaign ID</Label>
              <Input
                id="campaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="CAf7d9211d22bc44a6b9070c974dc78ba1"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="2024-05-01T00:00:00Z"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="2024-05-31T23:59:59Z"
              />
            </div>
          </div>

          <Button onClick={testCallLogsAPI} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing API...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Call Logs API
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              API Response
              <Badge variant={result.success ? "default" : "destructive"}>{result.status || "Error"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  API call successful! Status: {result.status}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  API call failed: {result.error || result.statusText}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Request Payload</Label>
              <Textarea
                value={JSON.stringify(result.requestPayload, null, 2)}
                readOnly
                className="h-32 font-mono text-sm"
              />
            </div>

            <div>
              <Label>Raw Response</Label>
              <Textarea
                value={
                  typeof result.rawResponse === "string"
                    ? result.rawResponse
                    : JSON.stringify(result.rawResponse, null, 2)
                }
                readOnly
                className="h-64 font-mono text-sm"
              />
            </div>

            {result.parsedResponse && (
              <div>
                <Label>Parsed Response Structure</Label>
                <Textarea
                  value={JSON.stringify(result.parsedResponse, null, 2)}
                  readOnly
                  className="h-64 font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
