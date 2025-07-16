"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Key, Settings, ExternalLink } from "lucide-react"

interface DiagnosticResult {
  step: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export function RingbaApiDiagnostics() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])

    const diagnostics: DiagnosticResult[] = []

    // Step 1: Check environment variables
    try {
      const response = await fetch("/api/ringba/diagnostics")
      const envCheck = await response.json()

      diagnostics.push({
        step: "Environment Variables",
        status: envCheck.hasCredentials ? "success" : "error",
        message: envCheck.hasCredentials
          ? "✅ API credentials found"
          : "❌ Missing RINGBA_API_KEY or RINGBA_ACCOUNT_ID",
        details: envCheck,
      })
    } catch (error) {
      diagnostics.push({
        step: "Environment Variables",
        status: "error",
        message: "❌ Failed to check environment variables",
        details: error,
      })
    }

    setResults([...diagnostics])

    // Step 2: Test API connectivity
    try {
      const response = await fetch("/api/ringba/campaigns")
      const apiTest = await response.json()

      diagnostics.push({
        step: "API Connectivity",
        status: apiTest.success ? "success" : "error",
        message: apiTest.success
          ? `✅ Connected successfully (${apiTest.total} campaigns found)`
          : `❌ ${apiTest.error}`,
        details: apiTest,
      })
    } catch (error) {
      diagnostics.push({
        step: "API Connectivity",
        status: "error",
        message: "❌ Network error connecting to Ringba API",
        details: error,
      })
    }

    setResults([...diagnostics])

    // Step 3: Test specific endpoints
    const endpoints = ["/api/ringba/status", "/api/ringba/campaigns"]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        const result = await response.json()

        diagnostics.push({
          step: `Endpoint: ${endpoint}`,
          status: response.ok ? "success" : "error",
          message: response.ok ? `✅ ${endpoint} working` : `❌ ${endpoint} failed: ${result.error}`,
          details: result,
        })
      } catch (error) {
        diagnostics.push({
          step: `Endpoint: ${endpoint}`,
          status: "error",
          message: `❌ ${endpoint} error`,
          details: error,
        })
      }

      setResults([...diagnostics])
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500 text-white">Success</Badge>
      case "error":
        return <Badge className="bg-red-500 text-white">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ringba API Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={runDiagnostics} disabled={isRunning} className="bg-blue-600 hover:bg-blue-700">
              {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
              Run Diagnostics
            </Button>

            <div className="text-sm text-gray-600">
              This will test your Ringba API connection and identify any issues
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Diagnostic Results:</h3>

              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.step}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
            </div>
          )}

          <Alert className="border-blue-200 bg-blue-50">
            <Key className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p className="font-medium">🔑 How to get your Ringba API credentials:</p>
                <ol className="text-sm space-y-1 ml-4">
                  <li>1. Log into your Ringba dashboard</li>
                  <li>2. Go to Settings → API Keys</li>
                  <li>3. Create a new API key with "Campaigns" and "Calls" permissions</li>
                  <li>4. Copy your Account ID from the main dashboard</li>
                  <li>5. Set environment variables: RINGBA_API_KEY and RINGBA_ACCOUNT_ID</li>
                </ol>
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Ringba Dashboard
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
