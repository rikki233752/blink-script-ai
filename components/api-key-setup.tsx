"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Key, CheckCircle, XCircle, Copy } from "lucide-react"

export function ApiKeySetup() {
  const [apiKey, setApiKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({
        success: false,
        message: "Please enter an API key",
      })
      return
    }

    setIsValidating(true)
    try {
      // Test the API key by making a direct call
      const response = await fetch("https://api.deepgram.com/v1/projects", {
        headers: {
          Authorization: `Token ${apiKey.trim()}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setValidationResult({
          success: true,
          message: "✅ API key is valid and ready for fast large file processing!",
          data: {
            projects: data.projects?.length || 0,
            capabilities: ["200MB file support", "Enhanced processing", "Real-time analysis"],
          },
        })
      } else if (response.status === 401) {
        setValidationResult({
          success: false,
          message: "❌ Invalid API key. Please check your Deepgram API key.",
        })
      } else {
        setValidationResult({
          success: false,
          message: `❌ API error: ${response.status}. Please try again.`,
        })
      }
    } catch (error: any) {
      setValidationResult({
        success: false,
        message: `❌ Connection error: ${error.message}`,
      })
    } finally {
      setIsValidating(false)
    }
  }

  const copyEnvVariable = () => {
    const envText = `DEEPGRAM_API_KEY=${apiKey.trim()}`
    navigator.clipboard.writeText(envText)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Deepgram API Key Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-2">
          <label htmlFor="api-key" className="text-sm font-medium">
            Enter your new Deepgram API Key:
          </label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Deepgram API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={validateApiKey}
              disabled={isValidating || !apiKey.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isValidating ? "Validating..." : "Validate"}
            </Button>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <Alert className={validationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {validationResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={validationResult.success ? "text-green-800" : "text-red-800"}>
              {validationResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Details */}
        {validationResult?.success && validationResult.data && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {validationResult.data.capabilities.map((capability: string, index: number) => (
                <Badge key={index} className="bg-green-100 text-green-800 justify-center">
                  {capability}
                </Badge>
              ))}
            </div>

            {/* Environment Variable Setup */}
            <div className="bg-gray-50 p-3 rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Environment Variable:</span>
                <Button size="sm" variant="outline" onClick={copyEnvVariable}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <code className="text-xs bg-white p-2 rounded border block">DEEPGRAM_API_KEY={apiKey.trim()}</code>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 border-t pt-4">
          <h4 className="font-medium mb-2">Setup Instructions:</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Get your API key from{" "}
              <a
                href="https://console.deepgram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Deepgram Console
              </a>
            </li>
            <li>Enter the API key above and click "Validate"</li>
            <li>Copy the environment variable and add it to your deployment</li>
            <li>Restart your application to apply the changes</li>
            <li>Test with large files up to 200MB</li>
          </ol>
        </div>

        {/* Features */}
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Enhanced Features with New API:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Fast processing of files up to 200MB</li>
            <li>• Enhanced accuracy with Nova-2 model</li>
            <li>• Real-time sentiment and topic analysis</li>
            <li>• Optimized for call center transcription</li>
            <li>• Professional-grade speech recognition</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
