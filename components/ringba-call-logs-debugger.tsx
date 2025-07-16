"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Search, Code } from "lucide-react"

export function RingbaCallLogsDebugger() {
  const [campaignId, setCampaignId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testCallLogsStructure = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/ringba/test-call-logs-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaignId || undefined,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (!data.success) {
        setError(data.error || "Failed to test call logs structure")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            RingBA Call Logs API Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Campaign ID (Optional)</label>
              <Input
                placeholder="Enter campaign ID to filter, or leave empty for all campaigns"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              />
            </div>
            <Button onClick={testCallLogsStructure} disabled={isLoading}>
              {isLoading ? "Testing..." : "Test API Structure"}
            </Button>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                  <div className="space-y-2">
                    <div>
                      <strong>Status:</strong> {result.status} | <strong>Success:</strong>{" "}
                      {result.isSuccessful ? "Yes" : "No"}
                    </div>
                    {result.message && (
                      <div>
                        <strong>Message:</strong> {result.message}
                      </div>
                    )}
                    {result.transactionId && (
                      <div>
                        <strong>Transaction ID:</strong> {result.transactionId}
                      </div>
                    )}
                    <div>
                      <strong>Total Records:</strong> {result.totalRecords}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {result.availableColumns && result.availableColumns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Columns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.availableColumns.map((column: string) => (
                        <Badge key={column} variant="outline">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.sampleRecord && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Sample Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(result.sampleRecord, null, 2)}
                      readOnly
                      className="font-mono text-sm h-64"
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raw API Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(result.rawResponse, null, 2)}
                    readOnly
                    className="font-mono text-sm h-64"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
