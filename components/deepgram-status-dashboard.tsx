"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Loader2, Mic, Settings, Zap, Globe, Key, CreditCard } from "lucide-react"

interface DeepgramStatus {
  connected: boolean
  transcriptionReady: boolean
  error?: string
  config?: any
  projects?: number
  testResult?: any
}

export function DeepgramStatusDashboard() {
  const [status, setStatus] = useState<DeepgramStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [testingTranscription, setTestingTranscription] = useState(false)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/deepgram/test")
      const result = await response.json()

      if (result.success) {
        setStatus({
          connected: true,
          transcriptionReady: false,
          config: result.data.config,
          projects: result.data.projects,
        })
      } else {
        setStatus({
          connected: false,
          transcriptionReady: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      setStatus({
        connected: false,
        transcriptionReady: false,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const testTranscription = async () => {
    setTestingTranscription(true)
    try {
      const response = await fetch("/api/deepgram/test", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                transcriptionReady: true,
                testResult: result.data.testResult,
              }
            : null,
        )
      } else {
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                transcriptionReady: false,
                error: result.error,
              }
            : null,
        )
      }
    } catch (error: any) {
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              transcriptionReady: false,
              error: error.message,
            }
          : null,
      )
    } finally {
      setTestingTranscription(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            Deepgram API Status Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Connection</p>
                    <div className="flex items-center gap-2 mt-1">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : status?.connected ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={status?.connected ? "default" : "destructive"}>
                        {loading ? "Testing..." : status?.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </div>
                  <Globe className={`h-8 w-8 ${status?.connected ? "text-green-600" : "text-gray-400"}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transcription Ready</p>
                    <div className="flex items-center gap-2 mt-1">
                      {testingTranscription ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : status?.transcriptionReady ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <Badge variant={status?.transcriptionReady ? "default" : "secondary"}>
                        {testingTranscription ? "Testing..." : status?.transcriptionReady ? "Ready" : "Not Tested"}
                      </Badge>
                    </div>
                  </div>
                  <Zap className={`h-8 w-8 ${status?.transcriptionReady ? "text-green-600" : "text-gray-400"}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Projects Available</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold text-blue-600">{status?.projects ?? "—"}</span>
                    </div>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Details */}
          {status?.config && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  Configuration Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Base URL</p>
                    <p className="text-blue-600 font-mono text-xs">{status.config.baseUrl}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Model</p>
                    <p className="text-green-600 font-semibold">{status.config.model}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Language</p>
                    <p className="text-purple-600 font-semibold">{status.config.language}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Features</p>
                    <p className="text-orange-600 font-semibold">{status.config.features.length} enabled</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-medium text-gray-600 mb-2">Enabled Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {status.config.features.map((feature: string) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          {status?.testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mic className="h-4 w-4" />
                  Transcription Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Channels Detected</p>
                    <p className="text-xl font-bold text-blue-600">{status.testResult.channels}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Confidence Score</p>
                    <p className="text-xl font-bold text-green-600">
                      {(status.testResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Transcript Generated</p>
                    <p className="text-xl font-bold text-purple-600">{status.testResult.hasTranscript ? "✓" : "✗"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {status?.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {status.error}
                <div className="mt-2 text-sm">
                  <p>Common solutions:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Verify DEEPGRAM_API_KEY is set in environment variables</li>
                    <li>Check that your API key is valid and active</li>
                    <li>Ensure you have sufficient credits in your Deepgram account</li>
                    <li>Verify network connectivity to api.deepgram.com</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={checkConnection} disabled={loading} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>

            <Button onClick={testTranscription} disabled={!status?.connected || testingTranscription} variant="outline">
              {testingTranscription ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mic className="h-4 w-4 mr-2" />
              )}
              Test Transcription
            </Button>

            <Button onClick={() => window.open("https://console.deepgram.com", "_blank")} variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Deepgram Console
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <p className="font-medium text-gray-900">1. Get your Deepgram API Key:</p>
            <p className="text-gray-600">
              Visit{" "}
              <a
                href="https://console.deepgram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                console.deepgram.com
              </a>{" "}
              and create an API key
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-900">2. Set Environment Variable:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs font-mono">DEEPGRAM_API_KEY=your_api_key_here</code>
          </div>

          <div>
            <p className="font-medium text-gray-900">3. Verify Setup:</p>
            <p className="text-gray-600">Use the test buttons above to verify your configuration</p>
          </div>

          <div>
            <p className="font-medium text-gray-900">4. API Endpoint:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs font-mono">https://api.deepgram.com/v1/listen</code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
