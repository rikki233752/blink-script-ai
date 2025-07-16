"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Code, CheckCircle, XCircle } from "lucide-react"

export function PythonEquivalentTester() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const testPythonEquivalent = async () => {
    if (!file) {
      setError("Please select an audio file first")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("audio", file)

      console.log("🐍 Starting Python-equivalent test...")

      const response = await fetch("/api/deepgram/python-equivalent", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        console.log("✅ Python-equivalent test successful:", data.data)
      } else {
        setError(data.error || "Unknown error occurred")
        console.error("❌ Python-equivalent test failed:", data.error)
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`)
      console.error("❌ Network error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-green-600" />
            Python Code Equivalent Test
          </CardTitle>
          <div className="text-sm text-gray-600">
            <p>This replicates your exact Python code:</p>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-x-auto">
              {`import requests

url = "https://api.deepgram.com/v1/listen"
headers = {
    "Authorization": "Token 826b863658186408cc422feb47b5fe93809d0eb7",
    "Content-Type": "audio/*"
}

with open("/path/to/youraudio.wav", "rb") as audio_file:
    response = requests.post(url, headers=headers, data=audio_file)

print(response.json())`}
            </pre>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <label htmlFor="audio-file" className="block text-sm font-medium text-gray-700 mb-2">
              Select Audio File (equivalent to opening file in Python)
            </label>
            <input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Test Button */}
          <Button onClick={testPythonEquivalent} disabled={!file || loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Making requests.post() call...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Execute Python Equivalent
              </>
            )}
          </Button>

          {/* Configuration Display */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Configuration Used:</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>URL:</strong> <code>https://api.deepgram.com/v1/listen</code>
                </div>
                <div>
                  <strong>API Key:</strong> <code>826b863658186408cc422feb47b5fe93809d0eb7</code>
                </div>
                <div>
                  <strong>Content-Type:</strong> <code>audio/*</code>
                </div>
                <div>
                  <strong>Method:</strong> <code>POST</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Python response.json() Output
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.deepgram_response?.results?.channels?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Channels</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.deepgram_response?.results?.channels?.[0]?.alternatives?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Alternatives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {result.deepgram_response?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Characters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(
                    (result.deepgram_response?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0) * 100
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>

            {/* Transcript */}
            {result.deepgram_response?.results?.channels?.[0]?.alternatives?.[0]?.transcript && (
              <div>
                <h4 className="font-semibold mb-2">Transcript:</h4>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  {result.deepgram_response.results.channels[0].alternatives[0].transcript}
                </div>
              </div>
            )}

            {/* API Response Details */}
            <div>
              <h4 className="font-semibold mb-2">API Response Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>API Key Used:</strong>
                  <Badge variant="outline" className="ml-2">
                    {result.api_key_used}
                  </Badge>
                </div>
                <div>
                  <strong>Endpoint:</strong>
                  <Badge variant="outline" className="ml-2">
                    {result.endpoint_used}
                  </Badge>
                </div>
                <div>
                  <strong>File Name:</strong>
                  <Badge variant="outline" className="ml-2">
                    {result.file_info.name}
                  </Badge>
                </div>
                <div>
                  <strong>File Size:</strong>
                  <Badge variant="outline" className="ml-2">
                    {(result.file_info.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              </div>
            </div>

            {/* Raw JSON Response */}
            <details className="border rounded p-3">
              <summary className="font-semibold cursor-pointer">Raw JSON Response (click to expand)</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(result.deepgram_response, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
