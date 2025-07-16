"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, CheckCircle, XCircle, Info } from "lucide-react"

interface ColumnDiscoveryResult {
  success: boolean
  data?: any
  error?: string
  endpoint?: string
  method?: string
}

export function RingbaColumnDiscoverer() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ColumnDiscoveryResult | null>(null)

  const discoverColumns = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/ringba/discover-columns")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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
            <Search className="h-5 w-5" />
            RingBA Column Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This tool will discover the available columns in your RingBA call logs API to fix the "Unknown value column"
            errors.
          </p>

          <Button onClick={discoverColumns} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Discovering Available Columns...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Discover Available Columns
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
              Discovery Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Method:</strong> {result.method}
                    <br />
                    <strong>Endpoint:</strong> {result.endpoint}
                  </AlertDescription>
                </Alert>

                {result.data?.availableFields && (
                  <div>
                    <h4 className="font-medium mb-2">Available Fields:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.data.availableFields.map((field: string) => (
                        <Badge key={field} variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.data?.sampleData && (
                  <div>
                    <h4 className="font-medium mb-2">Sample Response:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data.sampleData, null, 2)}
                    </pre>
                  </div>
                )}

                {result.data && !result.data.availableFields && !result.data.sampleData && (
                  <div>
                    <h4 className="font-medium mb-2">Raw Response:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error:</strong> {result.error}
                  {result.endpoint && (
                    <>
                      <br />
                      <strong>Endpoint:</strong> {result.endpoint}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
