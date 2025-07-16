"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertTriangle, FileAudio } from "lucide-react"
import { DeepgramDirectClient } from "@/lib/deepgram-direct"

interface EnhancedFileUploadProps {
  onTranscriptionComplete: (result: any) => void
  apiKey: string
}

export function EnhancedFileUpload({ onTranscriptionComplete, apiKey }: EnhancedFileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      const fileSize = file.size / (1024 * 1024) // MB
      console.log(`📁 Processing file: ${file.name} (${fileSize.toFixed(2)}MB)`)

      if (fileSize > 50) {
        // 50MB limit with new API key
        throw new Error("File too large. Current limit is 50MB with your new API key.")
      }

      let transcriptionResult

      if (fileSize <= 4) {
        // Small file - use server route
        setStage("Processing via server...")
        transcriptionResult = await processViaServer(file, setProgress)
      } else if (fileSize <= 50) {
        // Medium file - direct API with new key
        setStage("Processing via direct API (50MB support)...")
        transcriptionResult = await processViaDirect(file, apiKey, setProgress)
      } else {
        throw new Error("File exceeds 50MB limit. Please contact support for larger files.")
      }

      setStage("Analyzing transcript...")
      setProgress(90)

      // Process the transcription result
      const analysisResult = await analyzeTranscript(transcriptionResult, file)

      setProgress(100)
      setStage("Complete!")

      onTranscriptionComplete(analysisResult)
    } catch (err: any) {
      console.error("❌ Upload error:", err)
      setError(err.message)
    } finally {
      setIsProcessing(false)
      setTimeout(() => {
        setProgress(0)
        setStage("")
      }, 2000)
    }
  }

  return (
    <div className="space-y-4">
      {/* File Size Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Enhanced File Size Support</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div className="flex justify-between">
            <span>Small files (&lt; 4MB):</span>
            <span className="font-medium">Fast server processing</span>
          </div>
          <div className="flex justify-between">
            <span>Medium files (4MB - 50MB):</span>
            <span className="font-medium">Direct Deepgram API (requires valid API key)</span>
          </div>
          <div className="flex justify-between">
            <span>Large files (50MB+):</span>
            <span className="font-medium">Contact support for enterprise solutions</span>
          </div>
        </div>
        <div className="mt-2 p-2 bg-green-100 rounded text-green-800 text-xs">
          ✅ New API key configured for enhanced 50MB file support
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileAudio className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Audio File (Up to 50MB)</h3>
        <p className="text-gray-600 mb-4">Enhanced support: WAV, MP3, M4A, OGG, WebM, FLAC, and more</p>
        <p className="text-sm text-blue-600 mb-4">🚀 Now supporting files up to 50MB with your new API key!</p>

        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="hidden"
          id="enhanced-audio-upload"
        />
        <label htmlFor="enhanced-audio-upload">
          <Button className="bg-blue-600 hover:bg-blue-700" disabled={isProcessing} asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Choose Audio File
            </span>
          </Button>
        </label>
      </div>

      {/* Progress Display */}
      {isProcessing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{stage}</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Helper functions
async function processViaServer(file: File, setProgress: (p: number) => void) {
  const formData = new FormData()
  formData.append("audio", file)

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  setProgress(80)
  return await response.json()
}

async function processViaDirect(file: File, apiKey: string, setProgress: (p: number) => void) {
  const deepgram = new DeepgramDirectClient(apiKey)
  setProgress(30)

  const result = await deepgram.transcribeFile(file)
  setProgress(80)

  return { success: true, data: result }
}

async function analyzeTranscript(transcriptionResult: any, file: File) {
  // Extract transcript and analyze
  const transcript = transcriptionResult.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript

  if (!transcript) {
    throw new Error("No transcript found in result")
  }

  const response = await fetch("/api/analyze-transcript", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      deepgramResult: transcriptionResult.data,
      fileName: file.name,
      fileSize: file.size,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to analyze transcript")
  }

  return await response.json()
}
