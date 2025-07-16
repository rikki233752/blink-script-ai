"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertTriangle, FileAudio, Zap, Clock, HardDrive } from "lucide-react"

interface FastLargeFileUploadProps {
  onTranscriptionComplete: (result: any) => void
}

export function FastLargeFileUpload({ onTranscriptionComplete }: FastLargeFileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [processingSpeed, setProcessingSpeed] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setProcessingSpeed(null)

    try {
      const fileSize = file.size / (1024 * 1024) // MB
      console.log(`🚀 Fast processing file: ${file.name} (${fileSize.toFixed(2)}MB)`)

      if (fileSize > 200) {
        throw new Error("File too large. Maximum size is 200MB for fast processing.")
      }

      setStage("Preparing fast transcription...")
      setProgress(10)

      const formData = new FormData()
      formData.append("audio", file)

      setStage("Fast transcribing with enhanced Deepgram API...")
      setProgress(30)

      const startTime = Date.now()
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const processingTime = Date.now() - startTime
      const speed = (fileSize / (processingTime / 1000)).toFixed(2)
      setProcessingSpeed(`${speed} MB/s`)

      setProgress(80)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      setStage("Finalizing analysis...")
      setProgress(95)

      const result = await response.json()

      setProgress(100)
      setStage("Complete!")

      console.log("🎉 Fast transcription completed:", {
        fileSize: `${fileSize.toFixed(2)}MB`,
        processingTime: `${processingTime}ms`,
        speed: `${speed} MB/s`,
        performance: result.performance,
      })

      onTranscriptionComplete(result)
    } catch (err: any) {
      console.error("❌ Fast upload error:", err)
      setError(err.message)
    } finally {
      setIsProcessing(false)
      setTimeout(() => {
        setProgress(0)
        setStage("")
        setProcessingSpeed(null)
      }, 3000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Fast Processing Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Fast Large File Processing
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>Up to 200MB files</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Enhanced API processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Real-time analysis</span>
            </div>
          </div>
          <div className="mt-2 p-2 bg-green-100 rounded text-green-800 text-xs">
            ⚡ Optimized for speed: Nova-2 model with enhanced tier processing
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <FileAudio className="h-12 w-12 text-gray-400" />
            <Zap className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fast Upload Audio File</h3>
        <p className="text-gray-600 mb-2">Enhanced processing for files up to 200MB</p>
        <p className="text-sm text-blue-600 mb-4">🚀 Optimized for speed with new Deepgram API</p>

        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="hidden"
          id="fast-audio-upload"
        />
        <label htmlFor="fast-audio-upload">
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isProcessing}
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Choose Audio File"}
            </span>
          </Button>
        </label>
      </div>

      {/* Progress Display */}
      {isProcessing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              {stage}
            </span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {processingSpeed && (
            <div className="text-center">
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ⚡ Processing Speed: {processingSpeed}
              </span>
            </div>
          )}
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

      {/* Supported Formats */}
      <div className="text-xs text-gray-500 text-center">Supported formats: WAV, MP3, M4A, OGG, WebM, FLAC, MP4</div>
    </div>
  )
}
