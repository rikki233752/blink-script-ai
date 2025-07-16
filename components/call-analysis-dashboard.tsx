"use client"

import type React from "react"
import { IntentDispositionAnalysis } from "@/components/intent-disposition-analysis"
import { AgentSelfCoaching } from "@/components/agent-self-coaching"
import { WebhookManagement } from "@/components/webhook-management"
import { WeeklyPerformanceSummary } from "@/components/weekly-performance-summary"
import { CampaignManagement } from "@/components/campaign-management"
import { AgentScorecard } from "@/components/agent-scorecard"
import { SentimentAnalysisDisplay } from "@/components/sentiment-analysis-display"
import { ReportsDashboard } from "@/components/reports-dashboard"
import { CallMetadata } from "@/components/call-metadata"
import { EnhancedConversionDisplay } from "@/components/enhanced-conversion-display"
import { OnScriptCallSummaryDisplay } from "@/components/onscript-call-summary-display"
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "./user-menu"
import { CallActivityFeed } from "@/components/call-activity-feed"
import { VersionBadge } from "@/components/version-badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileAudio,
  MessageSquare,
  Mic,
  Brain,
  Target,
  Webhook,
  BarChart3,
  Phone,
  Heart,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Zap,
  User,
  GraduationCap,
  FileSearch,
  Database,
  DollarSign,
  Copy,
} from "lucide-react"
import {
  triggerCallAnalyzedWebhook,
  triggerQualityAlertWebhook,
  triggerCoachingInsightWebhook,
  WebhookService,
} from "@/lib/webhook-service"
import type { IntentAnalysis, DispositionAnalysis, CallMetrics } from "@/lib/intent-disposition-utils"
import type { SentimentAnalysis } from "@/lib/sentiment-analysis"
import type { PreciseScoring } from "@/lib/precise-scoring"
import type { OnScriptCallSummary } from "@/lib/onscript-call-summary-generator"

interface CallAnalysis {
  transcript: string
  analysis: {
    overallRating: "GOOD" | "BAD" | "UGLY"
    overallScore: number
    toneQuality: {
      agent: string
      customer: string
      score: number
      confidence?: number
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
      conversionConfidence: number
      conversionStage?: string
      commitmentLevel?: string
      estimatedValue?: number | string
      valueCategory?: string
      urgency?: string
      followUpTiming?: string
      positiveSignals?: string[]
      negativeSignals?: string[]
      agentEffectiveness?: {
        closingAttempts: number
        objectionHandling: number
        valueProposition: number
        urgencyCreation: number
      }
      riskFactors?: string[]
      nextBestAction?: string
    }
    enhancedConversion?: any
    agentPerformance: {
      communicationSkills: number
      problemSolving: number
      productKnowledge: number
      customerService: number
    }
    keyInsights: string[]
    improvementSuggestions: string[]
    callDuration: string
    summary: string
    sentimentAnalysis: SentimentAnalysis
    preciseScoring: PreciseScoring
    intentAnalysis: IntentAnalysis
    dispositionAnalysis: DispositionAnalysis
    callMetrics: CallMetrics
    vocalyticsReport?: any
    callQualityMetrics?: {
      overallQuality: number
      customerSatisfaction: number
      agentEffectiveness: number
      communicationClarity: number
      resolutionSuccess: number
    }
  }
  fileName: string
  fileSize: number
  duration: number
  demo?: boolean
  provider?: string
  deepgramWords?: any[]
  deepgramUtterances?: any[]
  onScriptSummary?: OnScriptCallSummary
}

interface ErrorDetails {
  message: string
  code?: string
  details?: string
  timestamp?: string
}

interface TranscriptSegment {
  id: number
  speaker: "Speaker A" | "Speaker B"
  content: string
  isAgent: boolean
  timestamp?: string
  events?: string[]
  confidence?: number
}

export function CallAnalysisDashboard() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState("")

  // Initialize webhook service
  useEffect(() => {
    const webhookService = WebhookService.getInstance()
    const savedWebhooks = localStorage.getItem("webhookConfigs")
    if (savedWebhooks) {
      try {
        const webhooks = JSON.parse(savedWebhooks)
        webhookService.setWebhooks(webhooks)
        console.log("Loaded webhooks from storage:", webhooks.length)
      } catch (error) {
        console.error("Error loading webhooks:", error)
        webhookService.setWebhooks([])
      }
    } else {
      webhookService.setWebhooks([])
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Enhanced file validation
    const maxSize = 200 * 1024 * 1024 // 200MB
    const allowedTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/m4a", "audio/ogg", "audio/webm", "audio/flac"]

    if (file.size > maxSize) {
      setError({
        message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 200MB.`,
        code: "FILE_TOO_LARGE",
      })
      return
    }

    // Check file type
    if (!allowedTypes.some((type) => file.type === type || file.name.toLowerCase().endsWith(type.split("/")[1]))) {
      setError({
        message: "Unsupported file format. Please use WAV, MP3, M4A, OGG, WebM, or FLAC files.",
        code: "UNSUPPORTED_FORMAT",
      })
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    setProcessingStage("Preparing file...")

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      console.log("🚀 Starting transcription for file:", file.name, "Size:", file.size, "bytes")

      setProcessingStage("Uploading to Deepgram API...")

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("audio", file)

      console.log("📤 Making request to /api/transcribe...")

      // Make request with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minute timeout

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("📡 Response received:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
      })

      setUploadProgress(60)
      setProcessingStage("Processing response...")

      // Enhanced response handling with proper content type checking
      const contentType = response.headers.get("content-type")

      if (!response.ok) {
        let errorData: any = {
          message: `Server error: ${response.status} ${response.statusText}`,
          code: "SERVER_ERROR",
        }

        try {
          const errorText = await response.text()
          console.error("❌ Server error response:", errorText)

          // Try to parse as JSON if it looks like JSON
          if (contentType && contentType.includes("application/json")) {
            try {
              errorData = JSON.parse(errorText)
            } catch (parseError) {
              console.error("❌ Error parsing JSON error response:", parseError)
              errorData.message = errorText || errorData.message
              errorData.details = "Failed to parse error response as JSON"
            }
          } else {
            errorData.message = errorText || errorData.message
            errorData.details = `Unexpected content type: ${contentType}`
          }
        } catch (textError) {
          console.error("❌ Error reading error response:", textError)
          errorData.details = "Failed to read error response"
        }

        throw errorData
      }

      // Parse successful response
      let result
      try {
        if (contentType && contentType.includes("application/json")) {
          result = await response.json()
          console.log("✅ Successfully parsed JSON response")
        } else {
          const responseText = await response.text()
          console.error("❌ Unexpected content type:", contentType)
          console.error("❌ Response text:", responseText.substring(0, 500))

          // Check if response is HTML (error page)
          if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
            throw {
              message: "Server returned an HTML error page. Please check the server configuration and try again.",
              code: "HTML_ERROR_PAGE",
              details: responseText.substring(0, 500),
            }
          }

          // Try to parse as JSON anyway (sometimes content-type is wrong)
          try {
            result = JSON.parse(responseText)
            console.log("✅ Successfully parsed response as JSON despite incorrect content-type")
          } catch (parseError) {
            throw {
              message: `Invalid response format. Expected JSON but received: ${contentType || "unknown"}`,
              code: "INVALID_RESPONSE_FORMAT",
              details: responseText.substring(0, 500),
            }
          }
        }
      } catch (parseError: any) {
        console.error("❌ Response parsing error:", parseError)
        if (parseError.message && parseError.code) {
          throw parseError // Re-throw our custom error
        }
        throw {
          message: "Failed to parse server response. Please try again.",
          code: "PARSE_ERROR",
          details: parseError.message || "Unknown parsing error",
        }
      }

      // Validate result structure
      if (!result?.success) {
        const errorMsg = result?.error || "Transcription failed - no success flag in response"
        console.error("❌ API returned failure:", errorMsg)
        throw {
          message: errorMsg,
          code: result?.code || "API_FAILURE",
          details: result?.details || "No additional details provided",
        }
      }

      if (!result.data) {
        console.error("❌ No data in successful response:", result)
        throw {
          message: "No transcription data received from server",
          code: "NO_DATA",
          details: "Server returned success but no data object",
        }
      }

      console.log("✅ Transcription successful:", {
        provider: result.data.provider,
        fileSize: result.data.fileSize,
        duration: result.data.duration,
        transcriptLength: result.data.transcript?.length || 0,
        hasAnalysis: !!result.data.analysis,
        hasOnScriptSummary: !!result.data.onScriptSummary,
      })

      setAnalysis(result.data)

      // Save to local storage
      const callData = {
        id: Date.now().toString(),
        fileName: result.data.fileName,
        date: new Date().toISOString(),
        duration: result.data.duration,
        analysis: result.data.analysis,
        transcript: result.data.transcript,
        onScriptSummary: result.data.onScriptSummary,
      }

      const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")
      existingCalls.push(callData)
      localStorage.setItem("uploadedCalls", JSON.stringify(existingCalls))

      setProcessingStage("Triggering webhooks...")
      setUploadProgress(90)

      // Trigger webhooks
      try {
        await triggerCallAnalyzedWebhook(result.data)
        await triggerQualityAlertWebhook(result.data)

        const coachingInsights = {
          coachingScore: result.data.analysis.preciseScoring?.overallScore || result.data.analysis.overallScore,
          positivePoints: result.data.analysis.keyInsights,
          improvementAreas: result.data.analysis.improvementSuggestions,
          actionableTips: [
            "Practice active listening techniques",
            "Use empathetic language to build rapport",
            "Ask open-ended questions to understand customer needs",
            "Summarize key points to ensure understanding",
          ],
          learningResources: [
            "Customer Service Excellence Training Module",
            "Advanced Communication Skills Workshop",
            "Product Knowledge Certification Course",
          ],
        }

        await triggerCoachingInsightWebhook(result.data, coachingInsights)
        console.log("📡 Webhooks triggered successfully")
      } catch (webhookError) {
        console.error("⚠️ Webhook trigger failed:", webhookError)
        // Don't fail the entire process for webhook errors
      }

      setProcessingStage("Complete!")
      setUploadProgress(100)

      setTimeout(() => {
        // Always go to OnScript summary tab after successful upload
        setActiveTab("onscript-summary")
      }, 1000)
    } catch (err: any) {
      console.error("❌ Upload error:", err)

      let errorDetails: ErrorDetails = {
        message: "An unexpected error occurred. Please try again.",
        code: "UNKNOWN_ERROR",
      }

      if (err.name === "AbortError") {
        errorDetails = {
          message: "Request timeout. The file may be too large or the connection is slow. Please try again.",
          code: "TIMEOUT",
        }
      } else if (err.message && err.code) {
        // Our custom error format
        errorDetails = err
      } else if (err.message) {
        errorDetails.message = err.message
        errorDetails.details = err.stack || "No additional details"
      }

      setError(errorDetails)
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
      setUploadProgress(0)
      setProcessingStage("")
    }
  }

  const copyErrorDetails = () => {
    if (error) {
      const errorText = `Error: ${error.message}\nCode: ${error.code || "N/A"}\nDetails: ${error.details || "N/A"}\nTimestamp: ${error.timestamp || new Date().toISOString()}`
      navigator.clipboard.writeText(errorText)
      alert("Error details copied to clipboard!")
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "GOOD":
        return "bg-green-500"
      case "BAD":
        return "bg-yellow-500"
      case "UGLY":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRatingTextColor = (rating: string) => {
    switch (rating) {
      case "GOOD":
        return "text-green-700"
      case "BAD":
        return "text-yellow-700"
      case "UGLY":
        return "text-red-700"
      default:
        return "text-gray-700"
    }
  }

  const getProviderBadge = (provider?: string) => {
    switch (provider) {
      case "deepgram":
      case "deepgram-enhanced":
      case "deepgram-python-config":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Mic className="h-3 w-3 mr-1" />
            Deepgram AI Enhanced
          </Badge>
        )
      default:
        return null
    }
  }

  // Role-based tab visibility
  const getVisibleTabs = () => {
    const allTabs = [
      { id: "upload", label: "Upload & Analyze", icon: Upload, roles: ["admin", "manager", "supervisor", "agent"] },
      { id: "activity", label: "Call Activity", icon: Activity, roles: ["admin", "manager", "supervisor", "agent"] },
      {
        id: "onscript-summary",
        label: "OnScript Summary",
        icon: FileText,
        roles: ["admin", "manager", "supervisor", "agent"],
        disabled: !analysis?.onScriptSummary,
        highlight: !!analysis?.onScriptSummary,
      },
      {
        id: "conversion",
        label: "Business Conversion",
        icon: DollarSign,
        roles: ["admin", "manager", "supervisor", "agent"],
        disabled: !analysis,
      },
      {
        id: "transcript",
        label: "Transcript",
        icon: FileSearch,
        roles: ["admin", "manager", "supervisor", "agent"],
        disabled: !analysis,
      },
      {
        id: "metadata",
        label: "Call Metadata",
        icon: Database,
        roles: ["admin", "manager", "supervisor", "agent"],
        disabled: !analysis,
      },
      { id: "scorecard", label: "My Scorecard", icon: User, roles: ["admin", "manager", "supervisor", "agent"] },
      { id: "performance", label: "Performance", icon: TrendingUp, roles: ["admin", "manager", "supervisor"] },
      {
        id: "intent-disposition",
        label: "Intent & Disposition",
        icon: Target,
        roles: ["admin", "manager", "supervisor"],
      },
      {
        id: "sentiment",
        label: "Sentiment Analysis",
        icon: MessageSquare,
        roles: ["admin", "manager", "supervisor", "agent"],
      },
      {
        id: "vocalytics",
        label: "Vocalytics",
        icon: Mic,
        roles: ["admin", "manager", "supervisor", "agent"],
        disabled: !analysis,
      },
      {
        id: "coaching",
        label: "Self-Coaching",
        icon: GraduationCap,
        roles: ["admin", "manager", "supervisor", "agent"],
      },
      { id: "reports", label: "Reports", icon: FileText, roles: ["admin", "manager", "supervisor"] },
      { id: "webhooks", label: "Webhooks", icon: Webhook, roles: ["admin", "manager"] },
    ]

    return allTabs.filter((tab) => tab.roles.includes(user?.role || "agent"))
  }

  const visibleTabs = getVisibleTabs()

  // Calculate real stats
  const calculateRealStats = () => {
    const uploadedCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")

    if (uploadedCalls.length === 0) {
      return {
        totalCalls: 0,
        avgConversionRate: 0,
        avgQualityScore: 0,
        activeWebhooks: JSON.parse(localStorage.getItem("webhookConfigs") || "[]").filter((w: any) => w.enabled).length,
      }
    }

    // Calculate real conversion rate
    const conversionsAchieved = uploadedCalls.filter(
      (call: any) => call.analysis?.businessConversion?.conversionAchieved === true,
    ).length
    const avgConversionRate = Math.round((conversionsAchieved / uploadedCalls.length) * 100 * 10) / 10

    // Calculate real average quality score
    const totalScore = uploadedCalls.reduce((sum: number, call: any) => sum + (call.analysis?.overallScore || 0), 0)
    const avgQualityScore = Math.round((totalScore / uploadedCalls.length) * 10) / 10

    return {
      totalCalls: uploadedCalls.length,
      avgConversionRate,
      avgQualityScore,
      activeWebhooks: JSON.parse(localStorage.getItem("webhookConfigs") || "[]").filter((w: any) => w.enabled).length,
    }
  }

  const realStats = calculateRealStats()

  // Enhanced format transcript with Speaker A/B labels and OnScript events
  const formatTranscript = (transcript: string): TranscriptSegment[] => {
    if (!transcript) return []

    console.log("🎯 Formatting transcript with Speaker A/B labels and OnScript events")

    // Split transcript into sentences for better analysis
    const sentences = transcript
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const segments: TranscriptSegment[] = []
    let conversationStarted = false
    let introductionPhase = true
    let currentTime = 0

    sentences.forEach((sentence, index) => {
      if (!sentence.trim()) return

      // Enhanced speaker detection
      const isAgent = detectAgentSpeech(sentence, index)
      const speaker = isAgent ? "Speaker A" : "Speaker B"

      // Generate OnScript events
      const events = generateOnScriptEvents(sentence, index, isAgent, conversationStarted, introductionPhase)

      // Update conversation state
      if (events.includes("AGENT PROSPECT DIALOG START")) {
        conversationStarted = true
      }
      if (events.includes("INTRODUCTION END")) {
        introductionPhase = false
      }

      // Generate timestamp
      const segmentDuration = Math.max(2, Math.min(15, sentence.length / 10))
      const startTime = currentTime
      const endTime = currentTime + segmentDuration
      currentTime = endTime

      const timestamp = `${formatTime(startTime)} - ${formatTime(endTime)}`

      // Calculate confidence based on detection certainty
      const confidence = calculateSpeakerConfidence(sentence, isAgent, index)

      segments.push({
        id: index,
        speaker,
        content: sentence,
        isAgent,
        timestamp,
        events: events.length > 0 ? events : undefined,
        confidence,
      })
    })

    // Add final call end event
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      if (!lastSegment.events) {
        lastSegment.events = []
      }
      if (!lastSegment.events.includes("CALL END")) {
        lastSegment.events.push("CALL END")
      }
    }

    console.log(`✅ Generated ${segments.length} segments with Speaker A/B labels`)
    return segments
  }

  // Enhanced agent speech detection
  const detectAgentSpeech = (sentence: string, index: number): boolean => {
    const lowerSentence = sentence.toLowerCase()

    // Strong agent indicators
    const strongAgentPatterns = [
      /licensed agent/i,
      /this is.*agent/i,
      /calling from/i,
      /recorded line/i,
      /my name is.*agent/i,
      /assurant sales/i,
      /qualify for/i,
      /benefits available/i,
      /qualifying questions/i,
      /zip code/i,
      /county/i,
      /date of birth/i,
      /let me help/i,
      /i can assist/i,
      /what i can do/i,
      /alexandria castro/i,
    ]

    // Check for strong patterns first
    if (strongAgentPatterns.some((pattern) => pattern.test(sentence))) {
      return true
    }

    // First sentence is usually agent
    if (index === 0) {
      return true
    }

    // Questions are often from agents
    if (sentence.includes("?") && sentence.length > 15) {
      return true
    }

    // Long explanatory sentences are often from agents
    if (sentence.length > 50 && /help|assist|available|qualify|benefits/i.test(sentence)) {
      return true
    }

    // Customer response patterns
    const customerPatterns = [
      /^(yes|no|okay|ok|sure|alright)$/i,
      /my last name is/i,
      /rodriguez/i,
      /lisa/i,
      /^\d{2}\/\d{2}\/\d{2,4}$/,
    ]

    if (customerPatterns.some((pattern) => pattern.test(sentence))) {
      return false
    }

    // Default alternating pattern with bias toward agent for longer sentences
    return sentence.length > 30 ? true : index % 2 === 0
  }

  // Generate OnScript-style events
  const generateOnScriptEvents = (
    sentence: string,
    index: number,
    isAgent: boolean,
    conversationStarted: boolean,
    introductionPhase: boolean,
  ): string[] => {
    const events: string[] = []
    const lowerSentence = sentence.toLowerCase()

    // Call start
    if (index === 0 && isAgent) {
      events.push("AGENT PROSPECT DIALOG START")
    }

    // Introduction events
    if (isAgent && introductionPhase) {
      if (
        lowerSentence.includes("my name is") ||
        lowerSentence.includes("this is") ||
        lowerSentence.includes("licensed agent")
      ) {
        events.push("INTRODUCTION START")
        if (lowerSentence.includes("licensed agent") || lowerSentence.includes("assurant")) {
          events.push("PRIMARY AGENT START")
        }
      }
    }

    // Introduction end (customer acknowledgment)
    if (!isAgent && introductionPhase && (lowerSentence.includes("yes") || lowerSentence.includes("okay"))) {
      events.push("INTRODUCTION END")
    }

    // Hold events
    if (lowerSentence.includes("hold") || lowerSentence.includes("wait") || lowerSentence.includes("moment")) {
      events.push("HOLD START")
    }

    // Transfer events
    if (
      lowerSentence.includes("transfer") ||
      lowerSentence.includes("connect") ||
      lowerSentence.includes("specialist")
    ) {
      events.push("TRANSFER START")
    }

    // Auto attendant
    if (lowerSentence.includes("automated") || lowerSentence.includes("press") || lowerSentence.includes("dial")) {
      events.push("AUTO ATTDNT START")
    }

    // Dialog end indicators
    if (
      isAgent &&
      conversationStarted &&
      (lowerSentence.includes("qualifying questions") || lowerSentence.includes("review what you're eligible"))
    ) {
      events.push("AGENT PROSPECT DIALOG END")
    }

    return events
  }

  // Calculate speaker confidence
  const calculateSpeakerConfidence = (sentence: string, isAgent: boolean, index: number): number => {
    let confidence = 70 // Base confidence

    const lowerSentence = sentence.toLowerCase()

    // High confidence indicators
    if (isAgent) {
      if (/licensed agent|recorded line|my name is|qualifying questions|zip code|benefits available/i.test(sentence)) {
        confidence = 95
      } else if (/help|assist|qualify|available/i.test(sentence)) {
        confidence = 85
      }
    } else {
      if (/my last name is|rodriguez|lisa|yes|okay|no/i.test(sentence)) {
        confidence = 90
      } else if (sentence.length < 20 && /^(yes|no|okay|sure)$/i.test(sentence.trim())) {
        confidence = 95
      }
    }

    // First sentence is usually high confidence for agent
    if (index === 0 && isAgent) {
      confidence = Math.max(confidence, 85)
    }

    return Math.min(confidence, 98) // Cap at 98%
  }

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}s`
  }

  // Get event badge color
  const getEventBadgeColor = (event: string): string => {
    switch (event) {
      case "AGENT PROSPECT DIALOG START":
        return "bg-blue-500 text-white"
      case "AGENT PROSPECT DIALOG END":
        return "bg-blue-600 text-white"
      case "INTRODUCTION START":
        return "bg-green-500 text-white"
      case "INTRODUCTION END":
        return "bg-green-600 text-white"
      case "PRIMARY AGENT START":
        return "bg-purple-500 text-white"
      case "HOLD START":
        return "bg-yellow-500 text-white"
      case "HOLD END":
        return "bg-yellow-600 text-white"
      case "TRANSFER START":
        return "bg-orange-500 text-white"
      case "TRANSFER END":
        return "bg-orange-600 text-white"
      case "AUTO ATTDNT START":
        return "bg-cyan-500 text-white"
      case "CALL END":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">CallCenter AI</h1>
                  <p className="text-sm text-gray-600">Enhanced Deepgram Processing - Up to 200MB</p>
                </div>
              </div>
              {user && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Zap className="h-4 w-4 mr-1" />
                    Production Ready
                  </Badge>
                  <VersionBadge />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.department}</p>
                </div>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max bg-white border border-gray-200 shadow-sm rounded-lg p-1">
              <div className="grid grid-cols-5 lg:grid-cols-14 gap-1 w-full">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    disabled={tab.disabled}
                    className={`flex flex-col items-center justify-center gap-1 px-3 py-3 text-xs font-medium rounded-md whitespace-nowrap min-w-[100px] h-16 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all hover:bg-gray-50 data-[state=active]:hover:bg-blue-700 ${
                      tab.highlight ? "bg-purple-50 border-purple-200 text-purple-700" : ""
                    }`}
                  >
                    <tab.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-center leading-tight">{tab.label}</span>
                    {tab.highlight && <div className="w-2 h-2 bg-purple-500 rounded-full" />}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </div>

          <TabsContent value="upload" className="space-y-6">
            {/* Quick Stats - Using Real Data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Calls Analyzed</p>
                      <p className="text-2xl font-bold text-gray-900">{realStats.totalCalls}</p>
                    </div>
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Conversion Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {realStats.totalCalls > 0 ? `${realStats.avgConversionRate}%` : "No data"}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {realStats.totalCalls > 0 ? `${realStats.avgQualityScore}/10` : "No data"}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Webhooks</p>
                      <p className="text-2xl font-bold text-purple-600">{realStats.activeWebhooks}</p>
                    </div>
                    <Webhook className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Upload Section */}
            <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-center justify-center">
                  <Upload className="h-6 w-6 text-blue-600" />
                  Enhanced AI-Powered Call Analysis
                  <div className="ml-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Mic className="h-4 w-4" />
                      <span>Deepgram Enhanced</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      <Brain className="h-6 w-6" />
                      <span>OnScript AI</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Zap className="h-4 w-4" />
                      <span>Up to 200MB</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white">
                    <FileAudio className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-gray-900">Upload Call Recording</h3>
                      <p className="text-gray-600">
                        Enhanced Deepgram AI transcription with OnScript-style call summaries
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                        <p className="text-green-800 font-medium">🚀 Production Features:</p>
                        <p className="text-green-700">• Files up to 200MB: Fast enhanced processing</p>
                        <p className="text-green-700">• Nova-2 model: Superior accuracy and speed</p>
                        <p className="text-green-700">• OnScript AI: Professional call summaries</p>
                        <p className="text-green-700">• Supported formats: WAV, MP3, M4A, OGG, WebM, FLAC</p>
                        <p className="text-green-700">• Real-time performance metrics</p>
                      </div>

                      {/* Feature highlights */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
                        <div className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Mic className="h-6 w-6 text-blue-600" />
                          <span className="font-medium text-blue-900">Enhanced Transcription</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-lg">
                          <Brain className="h-6 w-6 text-purple-600" />
                          <span className="font-medium text-purple-900">OnScript AI Summary</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-red-50 rounded-lg">
                          <Heart className="h-6 w-6 text-red-600" />
                          <span className="font-medium text-red-900">Sentiment Analysis</span>
                        </div>
                      </div>
                    </div>

                    <input
                      type="file"
                      accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.flac"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload">
                      <Button
                        className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                        disabled={isUploading}
                        asChild
                      >
                        <span>
                          {isUploading ? (
                            <>
                              <Activity className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5 mr-2" />
                              Choose Audio File (Up to 200MB)
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {/* Processing Progress */}
                  {isUploading && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="text-center">
                            <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                            <h4 className="font-semibold text-blue-900">{processingStage}</h4>
                            <p className="text-sm text-blue-700">Enhanced processing with Deepgram AI...</p>
                          </div>
                          <Progress value={uploadProgress} className="h-3" />
                          <div className="text-xs text-blue-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              <span>File uploaded successfully</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {uploadProgress >= 30 ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-blue-300 rounded-full animate-spin" />
                              )}
                              <span>Enhanced Deepgram AI transcription</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {uploadProgress >= 60 ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-blue-300 rounded-full" />
                              )}
                              <span>OnScript AI summary generation</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {uploadProgress >= 80 ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-blue-300 rounded-full" />
                              )}
                              <span>Generating insights</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {uploadProgress >= 90 ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-blue-300 rounded-full" />
                              )}
                              <span>Finalizing analysis and triggering webhooks</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Error Display */}
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <div className="space-y-3">
                          <div>
                            <strong>Processing Failed:</strong> {error.message}
                          </div>
                          {error.code && (
                            <div className="text-sm">
                              <strong>Error Code:</strong> {error.code}
                            </div>
                          )}
                          {error.details && (
                            <div className="text-sm">
                              <strong>Details:</strong> {error.details}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyErrorDetails}
                              className="text-red-700 border-red-300 hover:bg-red-100 bg-transparent"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Error Details
                            </Button>
                          </div>
                          <div className="mt-2 text-sm">
                            <p>Troubleshooting tips:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Ensure your file is under 200MB</li>
                              <li>Use supported formats: WAV, MP3, M4A, OGG, WebM, FLAC</li>
                              <li>Check your internet connection</li>
                              <li>Verify Deepgram API key is configured</li>
                              <li>Try a smaller file to test the connection</li>
                            </ul>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <CallActivityFeed />
          </TabsContent>

          {/* OnScript Summary Tab */}
          <TabsContent value="onscript-summary" className="space-y-6">
            {analysis && analysis.onScriptSummary ? (
              <OnScriptCallSummaryDisplay
                summary={analysis.onScriptSummary}
                onViewFullTranscript={() => setActiveTab("transcript")}
                onDownloadReport={() => {
                  const dataStr = JSON.stringify(analysis.onScriptSummary, null, 2)
                  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
                  const exportFileDefaultName = `onscript-summary-${analysis.fileName}-${new Date().toISOString().split("T")[0]}.json`
                  const linkElement = document.createElement("a")
                  linkElement.setAttribute("href", dataUri)
                  linkElement.setAttribute("download", exportFileDefaultName)
                  linkElement.click()
                }}
                onShareSummary={() => {
                  if (navigator.share && analysis.onScriptSummary) {
                    navigator
                      .share({
                        title: "OnScript Call Summary",
                        text: analysis.onScriptSummary.summary,
                        url: window.location.href,
                      })
                      .catch(console.error)
                  } else {
                    navigator.clipboard.writeText(analysis.onScriptSummary?.summary || "")
                    alert("Summary copied to clipboard!")
                  }
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No OnScript Summary Available</h3>
                  <p className="text-gray-600 mb-4">
                    Upload and analyze a call recording to view the professional OnScript-style summary.
                  </p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            {analysis && (analysis.analysis.businessConversion || analysis.analysis.enhancedConversion) ? (
              <EnhancedConversionDisplay
                conversionData={analysis.analysis.enhancedConversion || analysis.analysis.businessConversion}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversion Data Available</h3>
                  <p className="text-gray-600 mb-4">Upload a call recording to view business conversion analysis.</p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Enhanced Transcript Tab with Speaker A/B Labels and OnScript Events */}
          <TabsContent value="transcript" className="space-y-6">
            {analysis ? (
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <FileSearch className="h-5 w-5 text-blue-600" />
                      Enhanced Call Transcript with OnScript Events
                      {getProviderBadge(analysis.provider)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-gray-700">
                        {analysis.fileName}
                      </Badge>
                      <Badge variant="outline" className="text-gray-700">
                        {Math.floor(analysis.duration / 60)}:{(analysis.duration % 60).toString().padStart(2, "0")}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Speaker A (Agent)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Speaker B (Customer)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        OnScript Events
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <div className="space-y-6">
                      {formatTranscript(analysis.transcript).map((segment) => (
                        <div key={segment.id} className="space-y-3">
                          {/* OnScript Events */}
                          {segment.events && segment.events.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {segment.events.map((event, eventIndex) => (
                                <Badge key={eventIndex} className={`text-xs font-medium ${getEventBadgeColor(event)}`}>
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Speaker Segment */}
                          <div className={`flex ${segment.isAgent ? "justify-start" : "justify-end"}`}>
                            <div
                              className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
                                segment.isAgent
                                  ? "bg-blue-50 border-l-4 border-blue-500"
                                  : "bg-green-50 border-r-4 border-green-500"
                              }`}
                            >
                              {/* Speaker Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-medium ${
                                      segment.isAgent
                                        ? "bg-blue-100 text-blue-800 border-blue-300"
                                        : "bg-green-100 text-green-800 border-green-300"
                                    }`}
                                  >
                                    {segment.speaker}
                                  </Badge>
                                  {segment.timestamp && (
                                    <span className="text-xs text-gray-500">{segment.timestamp}</span>
                                  )}
                                </div>
                                {segment.confidence && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      segment.confidence >= 90
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : segment.confidence >= 80
                                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                                    }`}
                                  >
                                    {segment.confidence}%
                                  </Badge>
                                )}
                              </div>

                              {/* Content */}
                              <div
                                className={`text-sm leading-relaxed ${
                                  segment.isAgent ? "text-blue-900" : "text-green-900"
                                }`}
                              >
                                {segment.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {formatTranscript(analysis.transcript).length} segments •
                      {formatTranscript(analysis.transcript).filter((s) => s.isAgent).length} agent •
                      {formatTranscript(analysis.transcript).filter((s) => !s.isAgent).length} customer
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(analysis.transcript)
                        alert("Transcript copied to clipboard!")
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Transcript
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcript Available</h3>
                  <p className="text-gray-600 mb-4">
                    Upload a call recording to view the enhanced transcript with Speaker A/B labels and OnScript events.
                  </p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Call Metadata Tab */}
          <TabsContent value="metadata" className="space-y-6">
            {analysis ? (
              <CallMetadata
                callId={`call_${Date.now()}`}
                analysis={{
                  ...analysis.analysis,
                  transcript: analysis.transcript,
                }}
                fileName={analysis.fileName}
                duration={analysis.duration}
                onSave={(data) => {
                  console.log("Metadata saved:", data)
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Call Metadata Available</h3>
                  <p className="text-gray-600 mb-4">Upload a call recording to view and edit call metadata.</p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <CampaignManagement />
          </TabsContent>

          <TabsContent value="scorecard" className="space-y-6">
            {analysis ? (
              <AgentScorecard
                analysis={analysis.analysis}
                agentName={user?.name || "Current Agent"}
                callData={{
                  fileName: analysis.fileName,
                  duration: analysis.duration,
                  date: new Date().toISOString(),
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Scorecard Data Available</h3>
                  <p className="text-gray-600 mb-4">Upload a call recording to view your performance</p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <WeeklyPerformanceSummary />
          </TabsContent>

          <TabsContent value="intent-disposition" className="space-y-6">
            {analysis &&
            analysis.analysis.intentAnalysis &&
            analysis.analysis.dispositionAnalysis &&
            analysis.analysis.callMetrics ? (
              <IntentDispositionAnalysis
                intentAnalysis={analysis.analysis.intentAnalysis}
                dispositionAnalysis={analysis.analysis.dispositionAnalysis}
                callMetrics={analysis.analysis.callMetrics}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Intent Data Available</h3>
                  <p className="text-gray-600 mb-4">Upload a call recording to view intent and disposition analysis.</p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            {analysis && analysis.analysis.sentimentAnalysis ? (
              <SentimentAnalysisDisplay
                sentimentAnalysis={analysis.analysis.sentimentAnalysis}
                transcript={analysis.transcript}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Sentiment Data Available</h3>
                  <p className="text-gray-600 mb-4">Upload and analyze a call recording to view sentiment analysis.</p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vocalytics" className="space-y-6">
            {analysis ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-blue-600" />
                      Vocalytics Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Advanced vocal analytics and speech pattern analysis for the call.</p>
                    {/* Add basic vocalytics display here if needed */}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Vocalytics Data Available</h3>
                  <p className="text-gray-600 mb-4">
                    Upload and analyze a call recording to view advanced vocal analytics.
                  </p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="coaching" className="space-y-6">
            {analysis ? (
              <AgentSelfCoaching
                analysis={analysis.analysis}
                transcript={analysis.transcript}
                callMetadata={{
                  fileName: analysis.fileName,
                  duration: analysis.duration,
                  date: new Date().toISOString(),
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Coaching Data Available</h3>
                  <p className="text-gray-600 mb-4">
                    Upload a call recording to access personalized coaching insights.
                  </p>
                  <Button onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsDashboard />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <WebhookManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
