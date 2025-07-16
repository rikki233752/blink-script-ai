"use client"

import { DeepgramStatus } from "@/components/deepgram-status"
import { ApiKeySetup } from "@/components/api-key-setup"
import { FastLargeFileUpload } from "@/components/fast-large-file-upload"
import { DebugModeToggle } from "@/components/debug-mode-toggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

export default function DiagnosticsPage() {
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)

  const handleTranscriptionComplete = (result: any) => {
    setTranscriptionResult(result)
    console.log("🎉 Fast transcription completed:", result)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Diagnostics</h1>
        <div className="text-sm text-gray-500">Fast Large File Processing • Enhanced API</div>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">API Status</TabsTrigger>
          <TabsTrigger value="setup">API Setup</TabsTrigger>
          <TabsTrigger value="test">Fast Test</TabsTrigger>
          <TabsTrigger value="debug">Debug Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <DeepgramStatus />
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <ApiKeySetup />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fast Large File Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <FastLargeFileUpload onTranscriptionComplete={handleTranscriptionComplete} />
            </CardContent>
          </Card>

          {transcriptionResult && (
            <Card>
              <CardHeader>
                <CardTitle>Fast Processing Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance Metrics */}
                  {transcriptionResult.performance && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm text-blue-600">Processing Speed</div>
                        <div className="font-bold text-blue-900">{transcriptionResult.performance.processingSpeed}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm text-green-600">File Size</div>
                        <div className="font-bold text-green-900">{transcriptionResult.performance.fileSize}</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="text-sm text-purple-600">Total Time</div>
                        <div className="font-bold text-purple-900">{transcriptionResult.performance.totalTime}ms</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded">
                        <div className="text-sm text-orange-600">Overall Score</div>
                        <div className="font-bold text-orange-900">
                          {transcriptionResult.data?.analysis?.overallScore}/10
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transcript Preview */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Transcript Preview:</h4>
                    <p className="text-sm text-gray-700">
                      {transcriptionResult.data?.transcript?.substring(0, 300)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <DebugModeToggle />
        </TabsContent>
      </Tabs>
    </div>
  )
}
