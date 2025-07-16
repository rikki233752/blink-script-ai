"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bug, CheckCircle, XCircle } from "lucide-react"

interface DebugResult {
  endpoint: string
  status: "success" | "error" | "loading"
  data?: any
  error?: string
  timestamp: string
}

export function DebugPanel() {
  const [results, setResults] = useState<DebugResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const testEndpoint = async (endpoint: string, name: string) => {
    const result: DebugResult = {
      endpoint: name,
      status: "loading",
      timestamp: new Date().toISOString(),
    }

    setResults((prev) => [...prev, result])

    try {
      const response = await fetch(endpoint)
      const data = await response.json()

      setResults((prev) =>
        prev.map((r) =>
          r.timestamp === result.timestamp
            ? {
                ...r,
                status: response.ok ? "success" : "error",
                data,
                error: response.ok ? undefined : `HTTP ${response.status}`,
              }
            : r,
        ),
      )
    } catch (error) {
      setResults((prev) =>
        prev.map((r) =>
          r.timestamp === result.timestamp
            ? { ...r, status: "error", error: error instanceof Error ? error.message : "Unknown error" }
            : r,
        ),
      )
    }
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    await testEndpoint("/api/health-check", "Health Check")
    await testEndpoint("/api/onscript/fetch-recordings?limit=5", "OnScript Recordings")
    await testEndpoint("/api/campaigns/list?limit=5", "Campaigns List")

    setIsRunning(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          API Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run API Tests"
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.endpoint}</span>
                  <div className="flex items-center gap-2">
                    {result.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {result.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {result.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                    <Badge
                      variant={
                        result.status === "success"
                          ? "default"
                          : result.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {result.status}
                    </Badge>
                  </div>
                </div>

                {result.error && <div className="text-sm text-red-600 mb-2">Error: {result.error}</div>}

                {result.data && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600">View Response</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
