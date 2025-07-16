"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, TestTube, CheckCircle, XCircle, Phone } from "lucide-react"

export function RingbaCorrectFormatTester() {
  const [campaignId, setCampaignId] = useState("CAadf75cf7aca64185b86baf836c62c3dd")
  const [startDate, setStartDate] = useState("2025-01-01")
  const [endDate, setEndDate] = useState("2025-06-09")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testCorrectFormat = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/ringba/fetch-call-logs", {
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
            <Phone className="h-5 w-5" />
            Ringba Call Logs - Correct Format Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <TestTube className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Testing with Correct API Format:</strong> Using the exact payload structure you provided with
              filters array and proper column names.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="campaignId">Campaign ID</Label>
              <Input
                id="campaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="CAadf75cf7aca64185b86baf836c62c3dd"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="2025-01-01"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="2025-06-09"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">API Request Preview:</h4>
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {`POST https://api.ringba.com/v2/RA8e9b7b0388ea4968868bf2351b647158/calllogs
Authorization: Bearer [YOUR_API_KEY]
Content-Type: application/json

{
  "startDate": "${startDate}",
  "endDate": "${endDate}",
  "pageSize": 100,
  "filters": [
    {
      "column": "campaignId",
      "operator": "Equals", 
      "value": "${campaignId}"
    }
  ]
}`}
            </pre>
          </div>

          <Button onClick={testCorrectFormat} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Correct Format...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Call Logs with Correct Format
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
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Success!</strong> Found {result.totalCalls} call logs, {result.callsWithRecordings} with
                    recordings.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.totalCalls}</div>
                    <div className="text-sm text-blue-800">Total Calls</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.callsWithRecordings}</div>
                    <div className="text-sm text-green-800">With Recordings</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{result.dataSource}</div>
                    <div className="text-sm text-purple-800">Data Source</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{campaignId.substring(0, 8)}...</div>
                    <div className="text-sm text-orange-800">Campaign</div>
                  </div>
                </div>

                {result.data && result.data.length > 0 && (
                  <div>
                    <Label>Sample Call Log (First Result)</Label>
                    <Textarea
                      value={JSON.stringify(result.data[0], null, 2)}
                      readOnly
                      className="h-64 font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>API call failed:</strong> {result.error}
                  {result.status && <div className="mt-1">Status: {result.status}</div>}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Full Response</Label>
              <Textarea value={JSON.stringify(result, null, 2)} readOnly className="h-64 font-mono text-sm" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
