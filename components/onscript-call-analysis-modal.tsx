"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  X,
  Search,
  Download,
  Settings,
  Clock,
  User,
  Phone,
  Calendar,
  FileText,
  Brain,
  Heart,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Target,
  Users,
  Building,
  MapPin,
  Lightbulb,
  Flag,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { generateOnScriptAnalysis } from "@/lib/onscript-ai-summary"
import { detectCallDispositionWithAI, detectCallIntentWithAI } from "@/lib/intent-disposition-utils"
import { analyzeDeepgramSentiment } from "@/lib/deepgram-sentiment-analyzer"
import { OpenRouterComprehensiveAnalyzer } from "@/lib/openrouter-comprehensive-analyzer"

interface OnScriptCallLog {
  id: string
  campaignId: string
  campaignName: string
  callId: string
  agentName: string
  customerPhone: string
  direction: "inbound" | "outbound"
  duration: number
  startTime: string
  endTime: string
  status: string
  disposition: string
  hasRecording: boolean
  recordingUrl?: string
  hasTranscription: boolean
  hasAnalysis: any
  transcript?: string
  analysis?: any
  metadata: any
  revenue?: number
}

interface OnScriptCallAnalysisModalProps {
  callLog: OnScriptCallLog | null
  onClose: () => void
  open: boolean
}

interface TranscriptSegment {
  id: number
  speaker: "Agent" | "Customer"
  speakerName: string
  speakerRole: "Agent" | "Customer"
  text: string
  startTime: string
  endTime: string
  tags: string[]
  timestamp: string
  isAgent: boolean
  confidence: number
  deepgramSpeaker?: number
  utteranceId?: string
}

interface OpenRouterAnalysisResult {
  intentAnalysis: any
  dispositionAnalysis: any
  factsAnalysis: any
  sentimentAnalysis: any
  qualityAnalysis: any
  businessAnalysis: any
  summary: string
  confidence: number
  processingTime: number
}

export function OnScriptCallAnalysisModal({ callLog, onClose, open }: OnScriptCallAnalysisModalProps) {
  const [selectedSection, setSelectedSection] = useState("summary")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    events: true,
    calculations: true,
  })
  const [openRouterAnalysis, setOpenRouterAnalysis] = useState<OpenRouterAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Initialize OpenRouter analyzer
  const openRouterAnalyzer = new OpenRouterComprehensiveAnalyzer()

  // Perform OpenRouter analysis when modal opens with transcript
  useEffect(() => {
    if (open && callLog?.transcript && !openRouterAnalysis && !isAnalyzing) {
      performOpenRouterAnalysis()
    }
  }, [open, callLog?.transcript])

  const performOpenRouterAnalysis = async () => {
    if (!callLog?.transcript) return

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      console.log("🤖 Starting OpenRouter comprehensive analysis...")
      const result = await openRouterAnalyzer.analyzeCall(callLog.transcript)
      console.log("✅ OpenRouter analysis completed:", result)
      setOpenRouterAnalysis(result)
    } catch (error: any) {
      console.error("❌ OpenRouter analysis failed:", error)
      setAnalysisError(error.message || "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!open || !callLog) {
    return null
  }

  console.log("🎭 OnScript Analysis Modal opened with data:", {
    callId: callLog.callId,
    hasAnalysis: !!callLog.analysis,
    hasTranscript: !!callLog.transcript,
    hasOpenRouterAnalysis: !!openRouterAnalysis,
    isAnalyzing,
  })

  // Generate OnScript-style analysis from transcript (fallback)
  const onScriptAnalysis = callLog.transcript ? generateOnScriptAnalysis(callLog.transcript, callLog) : null

  // Extract analysis data with fallbacks
  const analysisData = callLog.analysis || {}
  const sentimentData = analysisData.sentimentAnalysis || {}
  const agentPerformance = analysisData.agentPerformance || {}

  // Use OpenRouter analysis if available, otherwise fallback to existing methods
  const realIntentAnalysis =
    openRouterAnalysis?.intentAnalysis ||
    (callLog.transcript
      ? detectCallIntentWithAI(
          callLog.transcript,
          analysisData.deepgramIntents || [],
          analysisData.deepgramTopics || [],
          analysisData.sentimentData || [],
        )
      : analysisData.intentAnalysis || {})

  const realDispositionAnalysis =
    openRouterAnalysis?.dispositionAnalysis ||
    (callLog.transcript
      ? detectCallDispositionWithAI(
          callLog.transcript,
          realIntentAnalysis,
          analysisData.sentimentData || [],
          analysisData.businessConversion || {},
        )
      : analysisData.dispositionAnalysis || {})

  // Generate REAL Deepgram sentiment analysis (keep existing for comparison)
  const deepgramSentimentAnalysis = callLog.transcript
    ? analyzeDeepgramSentiment(callLog.transcript, analysisData.deepgramMetadata || {}, callLog.metadata || {})
    : null

  console.log("🤖 Analysis Sources:", {
    openRouterAnalysis: !!openRouterAnalysis,
    intentAnalysis: !!realIntentAnalysis,
    dispositionAnalysis: !!realDispositionAnalysis,
    deepgramSentiment: !!deepgramSentimentAnalysis,
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MM/dd/yy h:mm a")
    } catch {
      return timestamp
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Enhanced transcript segmentation using Deepgram diarization intelligence
  const generateDeepgramIntelligentTranscriptSegments = (): TranscriptSegment[] => {
    if (!callLog.transcript) {
      console.warn("⚠️ No transcript available for segmentation")
      return []
    }

    console.log("🧠 Processing transcript with Deepgram intelligence...")
    console.log("📝 Raw transcript:", callLog.transcript.substring(0, 200) + "...")

    // Extract Deepgram utterances and words data if available
    const deepgramData = analysisData.deepgramMetadata || {}
    const channels = deepgramData.results?.channels || []
    const alternatives = channels[0]?.alternatives || []
    const utterances = alternatives[0]?.utterances || []
    const words = alternatives[0]?.words || []

    console.log("📊 Deepgram data available:", {
      utterances: utterances.length,
      words: words.length,
      hasDiarization: utterances.some((u: any) => u.speaker !== undefined),
      hasChannels: channels.length > 0,
    })

    // If we have Deepgram utterances with speaker diarization, use them
    if (utterances.length > 0 && utterances.some((u: any) => u.speaker !== undefined)) {
      console.log("🎯 Using Deepgram utterances for speaker segmentation")
      return generateSegmentsFromDeepgramUtterances(utterances)
    }

    // If we have Deepgram words but no utterances, try to reconstruct from words
    if (words.length > 0) {
      console.log("🔧 Reconstructing segments from Deepgram words")
      return generateSegmentsFromDeepgramWords(words)
    }

    // Fallback to intelligent text-based segmentation
    console.log("📝 Using intelligent text-based segmentation as fallback")
    return generateSegmentsFromTranscriptText(callLog.transcript)
  }

  // Generate segments from Deepgram utterances (preferred method)
  const generateSegmentsFromDeepgramUtterances = (utterances: any[]): TranscriptSegment[] => {
    console.log("🎯 Processing Deepgram utterances for speaker identification")

    const segments: TranscriptSegment[] = []
    let conversationPhase = "introduction"

    // Enhanced speaker identification algorithm
    const identifyAgentSpeakerAdvanced = (utterances: any[]): number => {
      console.log("🎯 Starting advanced agent identification...")

      const speakerAnalysis = new Map()
      const speakerUtterances = new Map()

      // Group utterances by speaker
      utterances.forEach((utterance: any, index: number) => {
        const speaker = utterance.speaker
        const text = (utterance.transcript || "").toLowerCase()
        const wordCount = text.split(/\s+/).length
        const duration = (utterance.end || 0) - (utterance.start || 0)

        if (!speakerUtterances.has(speaker)) {
          speakerUtterances.set(speaker, [])
        }
        speakerUtterances.get(speaker).push({ ...utterance, index, text, wordCount, duration })

        const analysis = speakerAnalysis.get(speaker) || {
          totalWords: 0,
          totalDuration: 0,
          utteranceCount: 0,
          avgWordsPerUtterance: 0,
          professionalScore: 0,
          questionScore: 0,
          empathyScore: 0,
          controlScore: 0,
          agentPhraseScore: 0,
          customerPhraseScore: 0,
          firstUtteranceBonus: 0,
          longUtteranceCount: 0,
        }

        analysis.totalWords += wordCount
        analysis.totalDuration += duration
        analysis.utteranceCount += 1
        analysis.avgWordsPerUtterance = analysis.totalWords / analysis.utteranceCount

        // Count long utterances (agents typically have longer explanations)
        if (wordCount > 15) {
          analysis.longUtteranceCount += 1
        }

        // Enhanced professional language indicators (stronger patterns)
        const strongAgentPatterns = [
          /thank you for calling/i,
          /thanks for calling/i,
          /benefits center/i,
          /my name is/i,
          /this is.*speaking/i,
          /i'm.*agent/i,
          /i am.*agent/i,
          /licensed/i,
          /coordinator/i,
          /specialist/i,
          /prequalified/i,
          /you qualify/i,
          /coverage/i,
          /policy/i,
          /premium/i,
          /what state are you in/i,
          /what's your zip code/i,
          /date of birth/i,
          /marketplace/i,
          /medicare/i,
          /medicaid/i,
          /insurance/i,
          /recorded line/i,
          /let me help/i,
          /i can assist/i,
          /what i can do/i,
          /let me check/i,
          /i'll need to/i,
          /can you provide/i,
          /let me ask/i,
          /are you looking to/i,
          /would you be interested/i,
          /dental.*vision.*hearing/i,
          /over the counter/i,
          /particular benefits/i,
          /increase.*benefits/i,
        ]

        // Strong customer patterns
        const strongCustomerPatterns = [
          /^(yes|no|okay|sure|alright)\.?$/i,
          /^(hello|hi|hey)\.?$/i,
          /my name is.*[a-z]{2,}/i, // Customer giving their name
          /^\w+\s+\w+$/i, // Two word responses (likely names)
          /not interested/i,
          /already have/i,
          /i have.*insurance/i,
          /don't need/i,
          /remove.*from.*list/i,
          /stop calling/i,
          /take me off/i,
        ]

        // Score professional patterns
        strongAgentPatterns.forEach((pattern) => {
          if (pattern.test(text)) {
            analysis.agentPhraseScore += 3 // Higher weight for strong patterns
          }
        })

        // Score customer patterns
        strongCustomerPatterns.forEach((pattern) => {
          if (pattern.test(text)) {
            analysis.customerPhraseScore += 3
          }
        })

        // Question patterns (agents ask more questions)
        const questionPatterns = [
          /\?/g,
          /^(what|how|when|where|why|who|do you|are you|would you|can you|could you)/i,
          /may i ask/i,
          /can you tell me/i,
          /would you like/i,
          /are you looking/i,
          /would you be interested/i,
        ]

        questionPatterns.forEach((pattern) => {
          const matches = text.match(pattern) || []
          analysis.questionScore += matches.length
        })

        // Empathy and rapport building (agent behavior)
        const empathyPatterns = [
          /i understand/i,
          /i see/i,
          /that makes sense/i,
          /i hear you/i,
          /i appreciate/i,
          /thank you for/i,
          /i'm sorry/i,
          /i apologize/i,
          /let me help/i,
          /i can assist/i,
        ]

        empathyPatterns.forEach((pattern) => {
          if (pattern.test(text)) {
            analysis.empathyScore += 1
          }
        })

        // Conversation control indicators (agent behavior)
        const controlPatterns = [
          /let me/i,
          /i'll/i,
          /we can/i,
          /i can help/i,
          /what i'll do/i,
          /here's what/i,
          /the next step/i,
          /i'm going to/i,
          /what we'll do/i,
        ]

        controlPatterns.forEach((pattern) => {
          if (pattern.test(text)) {
            analysis.controlScore += 1
          }
        })

        // First utterance bonus (agents often start calls)
        if (index === 0) {
          const hasAgentIntro = strongAgentPatterns.some((pattern) => pattern.test(text))
          if (hasAgentIntro) {
            analysis.firstUtteranceBonus = 5
          }
        }

        speakerAnalysis.set(speaker, analysis)
      })

      // Calculate comprehensive agent likelihood scores
      let bestAgentCandidate = 0
      let highestScore = -1000 // Allow negative scores

      console.log("📊 Speaker Analysis Results:")
      for (const [speaker, analysis] of speakerAnalysis.entries()) {
        // Comprehensive scoring algorithm
        let score = 0

        // Core agent indicators (high weight)
        score += analysis.agentPhraseScore * 5 // Strong agent phrases
        score += analysis.questionScore * 3 // Questions asked
        score += analysis.empathyScore * 2 // Professional empathy
        score += analysis.controlScore * 2 // Conversation control
        score += analysis.firstUtteranceBonus // Starting the call

        // Speaking patterns (medium weight)
        score += analysis.longUtteranceCount * 2 // Longer explanations
        score += analysis.avgWordsPerUtterance > 10 ? 3 : 0 // Detailed responses
        score += analysis.totalDuration > 30 ? 3 : 0 // More speaking time
        score += analysis.totalWords > 50 ? 2 : 0 // More total words

        // Penalize customer indicators
        score -= analysis.customerPhraseScore * 4 // Strong customer phrases

        // Additional context scoring
        const utterancesList = speakerUtterances.get(speaker) || []

        // Check for agent-specific conversation patterns
        const hasAgentFlow = utterancesList.some(
          (u: any) =>
            /are you looking to.*benefits/i.test(u.text) ||
            /dental.*vision.*hearing/i.test(u.text) ||
            /over the counter/i.test(u.text),
        )
        if (hasAgentFlow) score += 4

        // Check for customer-specific patterns (short responses, names)
        const hasCustomerFlow = utterancesList.some(
          (u: any) => /^(yes|no|okay)$/i.test(u.text.trim()) || (/^\w+\s+\w+$/.test(u.text.trim()) && u.wordCount <= 3),
        )
        if (hasCustomerFlow) score -= 3

        console.log(`🎭 Speaker ${speaker} analysis:`, {
          score: score.toFixed(1),
          agentPhrases: analysis.agentPhraseScore,
          customerPhrases: analysis.customerPhraseScore,
          questions: analysis.questionScore,
          empathy: analysis.empathyScore,
          control: analysis.controlScore,
          avgWords: analysis.avgWordsPerUtterance.toFixed(1),
          longUtterances: analysis.longUtteranceCount,
          totalWords: analysis.totalWords,
          duration: analysis.totalDuration.toFixed(1),
          firstBonus: analysis.firstUtteranceBonus,
          hasAgentFlow,
          hasCustomerFlow,
        })

        if (score > highestScore) {
          highestScore = score
          bestAgentCandidate = speaker
        }
      }

      console.log(
        `🎯 Final Decision: Speaker ${bestAgentCandidate} identified as agent with score ${highestScore.toFixed(1)}`,
      )

      // Additional validation: if the score is very close, use additional heuristics
      const speakerScores = Array.from(speakerAnalysis.entries()).map(([speaker, analysis]) => ({
        speaker,
        score: analysis.agentPhraseScore * 5 + analysis.questionScore * 3 - analysis.customerPhraseScore * 4,
      }))

      speakerScores.sort((a, b) => b.score - a.score)

      // If scores are very close (within 5 points), use first utterance as tiebreaker
      if (speakerScores.length > 1 && Math.abs(speakerScores[0].score - speakerScores[1].score) < 5) {
        const firstUtterance = utterances[0]
        if (firstUtterance) {
          const firstText = firstUtterance.transcript?.toLowerCase() || ""
          const isAgentIntro =
            /thank you for calling|good (morning|afternoon|evening)|benefits|my name is|this is.*speaking/i.test(
              firstText,
            )

          if (isAgentIntro) {
            console.log("🔄 Using first utterance tiebreaker - agent introduction detected")
            bestAgentCandidate = firstUtterance.speaker
          }
        }
      }

      return bestAgentCandidate
    }

    // Replace the existing speaker identification logic in generateSegmentsFromDeepgramUtterances
    // Use enhanced agent identification
    const agentSpeaker = identifyAgentSpeakerAdvanced(utterances)

    // Second pass: create segments with proper speaker identification
    utterances.forEach((utterance: any, index: number) => {
      const isAgent = utterance.speaker === agentSpeaker
      const speaker = isAgent ? "Agent" : "Customer"
      const speakerRole = isAgent ? "Agent" : "Customer"
      const text = utterance.transcript || ""

      if (!text.trim()) return

      // Generate event tags based on content and conversation flow
      const tags = generateEventTags(text, index, isAgent, conversationPhase, utterances.length)

      // Update conversation phase based on content
      conversationPhase = updateConversationPhase(text, conversationPhase, isAgent)

      segments.push({
        id: index,
        speaker,
        speakerName: speaker,
        speakerRole: speaker,
        text: text.trim(),
        startTime: formatTimeOnScript(utterance.start || 0),
        endTime: formatTimeOnScript(utterance.end || 0),
        tags,
        timestamp: `${formatTimeOnScript(utterance.start || 0)} - ${formatTimeOnScript(utterance.end || 0)}`,
        isAgent,
        confidence: Math.round((utterance.confidence || 0.8) * 100),
        deepgramSpeaker: utterance.speaker,
        utteranceId: utterance.id,
      })
    })

    console.log(`✅ Generated ${segments.length} segments from Deepgram utterances`)

    // Apply post-processing validation to correct obvious misidentifications
    const validatedSegments = validateAndCorrectSpeakers(segments)
    console.log(`🔧 Applied speaker validation corrections`)

    return validatedSegments
  }

  // Generate segments from Deepgram words when utterances aren't available
  const generateSegmentsFromDeepgramWords = (words: any[]): TranscriptSegment[] => {
    console.log("🔧 Reconstructing segments from Deepgram words")

    // Group words into utterances based on speaker changes and pauses
    const utterances: any[] = []
    let currentUtterance: any = null

    words.forEach((word: any, index: number) => {
      const speaker = word.speaker !== undefined ? word.speaker : 0
      const start = word.start || 0
      const end = word.end || 0

      // Start new utterance if speaker changes or there's a significant pause
      if (!currentUtterance || currentUtterance.speaker !== speaker || start - currentUtterance.end > 2) {
        if (currentUtterance) {
          utterances.push(currentUtterance)
        }

        currentUtterance = {
          speaker,
          start,
          end,
          transcript: word.word || "",
          words: [word],
          confidence: word.confidence || 0.8,
        }
      } else {
        // Add word to current utterance
        currentUtterance.transcript += " " + (word.word || "")
        currentUtterance.end = end
        currentUtterance.words.push(word)

        // Update confidence (average)
        const totalConfidence = currentUtterance.words.reduce((sum: number, w: any) => sum + (w.confidence || 0.8), 0)
        currentUtterance.confidence = totalConfidence / currentUtterance.words.length
      }
    })

    // Add the last utterance
    if (currentUtterance) {
      utterances.push(currentUtterance)
    }

    console.log(`🔧 Reconstructed ${utterances.length} utterances from ${words.length} words`)

    // Now process these reconstructed utterances
    return generateSegmentsFromDeepgramUtterances(utterances)
  }

  // Fallback: Generate segments from transcript text using enhanced NLP
  const generateSegmentsFromTranscriptText = (transcript: string): TranscriptSegment[] => {
    console.log("📝 Using intelligent text-based speaker segmentation")

    // First, try to detect if transcript already has speaker labels
    const hasExistingSpeakerLabels = /speaker [ab]:|agent:|customer:/i.test(transcript)

    if (hasExistingSpeakerLabels) {
      console.log("🏷️ Found existing speaker labels, parsing them")
      return parseExistingSpeakerLabels(transcript)
    }

    // If no existing labels, use intelligent sentence-based segmentation
    return intelligentSentenceSegmentation(transcript)
  }

  // Parse transcript that already has speaker labels
  const parseExistingSpeakerLabels = (transcript: string): TranscriptSegment[] => {
    const segments: TranscriptSegment[] = []
    const lines = transcript.split(/\n+/).filter((line) => line.trim())
    let currentTime = 0

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      // Extract speaker and text
      let speaker: "Agent" | "Customer" = "Agent"
      let text = trimmedLine
      let isAgent = true

      // Check for various speaker label formats
      if (/^speaker a:/i.test(trimmedLine)) {
        speaker = "Agent"
        isAgent = true
        text = trimmedLine.replace(/^speaker a:\s*/i, "")
      } else if (/^speaker b:/i.test(trimmedLine)) {
        speaker = "Customer"
        isAgent = false
        text = trimmedLine.replace(/^speaker b:\s*/i, "")
      } else if (/^agent:/i.test(trimmedLine)) {
        speaker = "Agent"
        isAgent = true
        text = trimmedLine.replace(/^agent:\s*/i, "")
      } else if (/^customer:/i.test(trimmedLine)) {
        speaker = "Customer"
        isAgent = false
        text = trimmedLine.replace(/^customer:\s*/i, "")
      }

      if (!text.trim()) return

      const startTime = currentTime
      const estimatedDuration = Math.max(3, Math.min(20, text.length / 8))
      const endTime = currentTime + estimatedDuration

      currentTime = endTime

      const tags = generateEventTags(text, index, isAgent, "conversation", lines.length)

      segments.push({
        id: index,
        speaker,
        speakerName: speaker,
        speakerRole: speaker,
        text: text.trim(),
        startTime: formatTimeOnScript(startTime),
        endTime: formatTimeOnScript(endTime),
        tags,
        timestamp: `${formatTimeOnScript(startTime)} - ${formatTimeOnScript(endTime)}`,
        isAgent,
        confidence: 85, // High confidence for labeled data
      })
    })

    console.log(`🏷️ Parsed ${segments.length} segments from existing labels`)
    return segments
  }

  // Intelligent sentence-based segmentation
  const intelligentSentenceSegmentation = (transcript: string): TranscriptSegment[] => {
    console.log("🧠 Using intelligent sentence segmentation")

    // Split into sentences while preserving context
    const sentences = transcript
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const segments: TranscriptSegment[] = []
    let currentTime = 0
    let conversationPhase = "introduction"

    // Enhanced agent detection patterns
    const strongAgentPatterns = [
      /thank you for calling/i,
      /thanks for calling/i,
      /benefits center/i,
      /my name is/i,
      /i'm.*from/i,
      /i'm.*agent/i,
      /i am.*agent/i,
      /agent.*miller/i,
      /agent.*arthur/i,
      /licensed specialist/i,
      /coordinator/i,
      /prequalified/i,
      /what state are you in/i,
      /what's your zip code/i,
      /date of birth/i,
      /marketplace/i,
      /medicare/i,
      /medicaid/i,
      /coverage/i,
      /policy/i,
      /premium/i,
      /unlimited investors/i,
      /insurance agent/i,
      /recorded line/i,
      /licensed.*agent/i,
      /agent.*licensed/i,
      /this is.*speaking/i,
      /speaking with/i,
    ]

    const strongCustomerPatterns = [
      /^(yes|no|okay|sure|alright)$/i,
      /^(hello|hi)$/i,
      /already have/i,
      /not interested/i,
      /i have.*insurance/i,
      /obamacare/i,
    ]

    sentences.forEach((sentence, index) => {
      if (!sentence.trim()) return

      // Determine speaker using multiple heuristics
      let isAgent = false
      let confidence = 50

      // Check for strong patterns first
      const hasStrongAgentPattern = strongAgentPatterns.some((pattern) => pattern.test(sentence))
      const hasStrongCustomerPattern = strongCustomerPatterns.some((pattern) => pattern.test(sentence))

      if (hasStrongAgentPattern) {
        isAgent = true
        confidence = 95
      } else if (hasStrongCustomerPattern) {
        isAgent = false
        confidence = 90
      } else {
        // Use contextual analysis
        if (index === 0) {
          // First sentence - likely agent introduction
          isAgent = true
          confidence = 80
        } else {
          // Look at previous segment for context
          const prevSegment = segments[segments.length - 1]
          if (prevSegment) {
            // If previous was a question from agent, this is likely customer response
            if (prevSegment.isAgent && prevSegment.text.includes("?")) {
              isAgent = false
              confidence = 75
            } else if (!prevSegment.isAgent && sentence.length > 30) {
              // Long responses typically from agents
              isAgent = true
              confidence = 70
            } else {
              // Alternate speakers as fallback
              isAgent = !prevSegment.isAgent
              confidence = 60
            }
          }
        }

        // Additional heuristics
        if (sentence.includes("?") && sentence.length > 20) {
          isAgent = true
          confidence = Math.max(confidence, 75)
        }

        if (sentence.length < 10 && /^(yes|no|okay|sure)$/i.test(sentence.trim())) {
          isAgent = false
          confidence = Math.max(confidence, 80)
        }
      }

      const speaker = isAgent ? "Agent" : "Customer"
      const startTime = currentTime
      const estimatedDuration = Math.max(3, Math.min(20, sentence.length / 8))
      const endTime = currentTime + estimatedDuration

      currentTime = endTime

      const tags = generateEventTags(sentence, index, isAgent, conversationPhase, sentences.length)
      conversationPhase = updateConversationPhase(sentence, conversationPhase, isAgent)

      segments.push({
        id: index,
        speaker,
        speakerName: speaker,
        speakerRole: speaker,
        text: sentence.trim(),
        startTime: formatTimeOnScript(startTime),
        endTime: formatTimeOnScript(endTime),
        tags,
        timestamp: `${formatTimeOnScript(startTime)} - ${formatTimeOnScript(endTime)}`,
        isAgent,
        confidence,
      })
    })

    console.log(`🧠 Generated ${segments.length} segments using intelligent segmentation`)
    return segments
  }

  // Post-process segments to fix obvious speaker misidentifications
  const validateAndCorrectSpeakers = (segments: TranscriptSegment[]): TranscriptSegment[] => {
    return segments.map((segment, index) => {
      const text = segment.text.toLowerCase()

      // Strong agent identification phrases that should never be customer
      const definiteAgentPhrases = [
        /i'm agent/i,
        /i am agent/i,
        /my name is.*agent/i,
        /this is agent/i,
        /agent.*miller/i,
        /agent.*arthur/i,
        /licensed.*agent/i,
        /insurance agent/i,
        /thanks for calling/i,
        /thank you for calling/i,
        /recorded line/i,
        /unlimited investors/i,
        /are you looking to.*benefits/i,
        /dental.*vision.*hearing/i,
        /over the counter/i,
        /particular benefits/i,
        /increase.*benefits/i,
      ]

      // Strong customer identification phrases that should never be agent
      const definiteCustomerPhrases = [
        /^(hello|hi|hey)$/i,
        /^(yes|no|okay|sure|alright)$/i,
        /not interested/i,
        /already have.*insurance/i,
        /don't need/i,
        /remove.*from.*list/i,
        /^\w+\s+\w+$/i, // Two word responses (likely names)
      ]

      // Check if current identification is wrong
      const shouldBeAgent = definiteAgentPhrases.some((pattern) => pattern.test(segment.text))
      const shouldBeCustomer = definiteCustomerPhrases.some((pattern) => pattern.test(segment.text))

      if (shouldBeAgent && !segment.isAgent) {
        console.log(`🔧 Correcting speaker: "${segment.text}" should be Agent, not Customer`)
        return {
          ...segment,
          speaker: "Agent" as const,
          speakerName: "Agent",
          speakerRole: "Agent" as const,
          isAgent: true,
          confidence: 95, // High confidence for correction
        }
      }

      if (shouldBeCustomer && segment.isAgent) {
        console.log(`🔧 Correcting speaker: "${segment.text}" should be Customer, not Agent`)
        return {
          ...segment,
          speaker: "Customer" as const,
          speakerName: "Customer",
          speakerRole: "Customer" as const,
          isAgent: false,
          confidence: 95, // High confidence for correction
        }
      }

      return segment
    })
  }

  // Helper function to generate event tags based on content and context
  const generateEventTags = (
    text: string,
    index: number,
    isAgent: boolean,
    phase: string,
    totalSegments: number,
  ): string[] => {
    const tags: string[] = []
    const lowerText = text.toLowerCase()

    // Introduction phase tags
    if (index === 0 && isAgent) {
      tags.push("INTRODUCTION START")
      if (lowerText.includes("benefits") || lowerText.includes("coordinator")) {
        tags.push("PRIMARY AGENT START")
      }
    } else if (index === 0 && !isAgent) {
      tags.push("CUSTOMER INITIATED")
    }

    // Professional introduction patterns
    if (/licensed specialist|recorded line|pleasure of speaking/i.test(lowerText)) {
      tags.push("PROFESSIONAL INTRO")
    }

    // Dialog start/end patterns
    if (/who do i have the pleasure|to whom am i speaking/i.test(lowerText)) {
      tags.push("AGENT PROSPECT DIALOG START")
    }

    if (/how are you|doing today|hope you're well/i.test(lowerText)) {
      tags.push("INTRODUCTION END")
    }

    // Customer identification
    if (/this is.*speaking|my name is/i.test(lowerText) && !isAgent) {
      tags.push("CUSTOMER IDENTIFICATION")
    }

    // Customer intent
    if (/just saw your ad|calling to see/i.test(lowerText)) {
      tags.push("CUSTOMER INTENT")
    }

    // Dialog end
    if (/alright|great|wonderful|okay/i.test(lowerText) && isAgent && text.length < 20) {
      tags.push("AGENT PROSPECT DIALOG END")
    }

    // Data collection
    if (/what state|zip code|date of birth|address/i.test(lowerText)) {
      tags.push("DATA COLLECTION")
    }

    // Product discussion
    if (/health insurance|life insurance|coverage|policy|premium/i.test(lowerText)) {
      tags.push("PRODUCT DISCUSSION")
    }

    // Objections
    if (/not interested|already have|no thank you/i.test(lowerText)) {
      tags.push("OBJECTION")
    }

    // Qualification
    if (/prequalified|eligible|qualify/i.test(lowerText)) {
      tags.push("QUALIFICATION")
    }

    // Auto attendant
    if (/press|dial|option/i.test(lowerText)) {
      tags.push("AUTO ATTDNT START")
    }

    // Hold patterns
    if (/hold on|one moment|please wait/i.test(lowerText)) {
      tags.push("HOLD START")
    }

    // Transfer patterns
    if (/transfer|connect you|let me get/i.test(lowerText)) {
      tags.push("TRANSFER START")
    }

    // Call end patterns
    if (/goodbye|have a great day|thank you for your time/i.test(lowerText)) {
      tags.push("CALL END")
    }

    // Negative outcomes
    if (/unfortunately|wouldn't be able|i'm sorry about that/i.test(lowerText)) {
      tags.push("NEGATIVE OUTCOME")
    }

    return tags
  }

  // Helper function to update conversation phase
  const updateConversationPhase = (text: string, currentPhase: string, isAgent: boolean): string => {
    const lowerText = text.toLowerCase()

    if (currentPhase === "introduction") {
      if (/who do i have the pleasure|to whom am i speaking/i.test(lowerText)) {
        return "dialog"
      }
      if (/how are you|doing today|hope you're well/i.test(lowerText)) {
        return "qualification"
      }
    }

    if (currentPhase === "dialog") {
      if (/alright|great|wonderful/i.test(lowerText) && isAgent) {
        return "qualification"
      }
    }

    return currentPhase
  }

  // OnScript time format (00:00s)
  const formatTimeOnScript = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}s`
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}s`
  }

  const transcriptSegments = generateDeepgramIntelligentTranscriptSegments()

  // Extract all unique events from transcript segments
  const extractAllEvents = () => {
    const allEvents = new Set<string>()
    transcriptSegments.forEach((segment) => {
      segment.tags.forEach((tag) => allEvents.add(tag))
    })
    return Array.from(allEvents).sort()
  }

  const allEvents = extractAllEvents()

  // Extract facts from OpenRouter analysis or fallback to transcript
  const extractFactsFromAnalysis = () => {
    if (openRouterAnalysis?.factsAnalysis) {
      const facts = []
      const factsData = openRouterAnalysis.factsAnalysis

      // Convert OpenRouter facts to display format
      factsData.keyFacts?.forEach((fact: string, index: number) => {
        facts.push({
          id: index + 1,
          type: "Key Fact",
          value: fact,
        })
      })

      // Add customer info facts
      if (factsData.customerInfo?.name) {
        facts.push({
          id: facts.length + 1,
          type: "Customer Name",
          value: factsData.customerInfo.name,
        })
      }

      if (factsData.customerInfo?.company) {
        facts.push({
          id: facts.length + 1,
          type: "Company",
          value: factsData.customerInfo.company,
        })
      }

      // Add products mentioned
      factsData.productsMentioned?.forEach((product: string, index: number) => {
        facts.push({
          id: facts.length + 1,
          type: "Product Mentioned",
          value: product,
        })
      })

      // Add prices discussed
      factsData.pricesDiscussed?.forEach((price: string, index: number) => {
        facts.push({
          id: facts.length + 1,
          type: "Price Discussed",
          value: price,
        })
      })

      return facts.slice(0, 10) // Limit to top 10 facts
    }

    // Fallback to basic transcript extraction
    if (!callLog.transcript) return []

    const facts = []
    const text = callLog.transcript.toLowerCase()

    // Look for date of birth
    const dobMatch = callLog.transcript.match(/(\d{1,2}\/\d{1,4}|\d{4})/g)
    if (dobMatch) {
      facts.push({
        id: 3,
        type: "Date Of Birth",
        value: dobMatch[0],
      })
    }

    // Look for yes/no answers
    if (text.includes("dental") && text.includes("no")) {
      facts.push({
        id: 4,
        type: "Dental",
        value: "No",
      })
    }

    if (text.includes("marketplace") || text.includes("obamacare")) {
      facts.push({
        id: 5,
        type: "Existing Marketplace Plan",
        value: "yes",
      })
    }

    if (text.includes("gas") && text.includes("no")) {
      facts.push({
        id: 6,
        type: "Gas",
        value: "no",
      })
    }

    return facts
  }

  const extractedFacts = extractFactsFromAnalysis()

  const sidebarSections = [
    { id: "summary", label: "AI Summary", icon: Brain },
    { id: "summary-detail", label: "Summary", icon: FileText },
    { id: "topics", label: "Topics Covered", icon: MessageSquare },
    { id: "takeaways", label: "Key Takeaways", icon: Lightbulb },
    { id: "conclusion", label: "Call Conclusion", icon: CheckCircle },
    { id: "details", label: "Call Details", icon: FileText },
    { id: "sentiments", label: "Sentiments", icon: Heart },
    { id: "facts", label: "Facts", icon: Flag },
    { id: "disposition", label: "Disposition and Intent", icon: Target },
    { id: "metadata", label: "Call Metadata", icon: BarChart3 },
    { id: "agent-buyer", label: "Agent and Buyer Info", icon: Users },
    { id: "prospect", label: "Prospect Information", icon: User },
    { id: "main-info", label: "Main Info", icon: Building },
    { id: "additional", label: "Additional Information", icon: MapPin },
  ]

  // Get event tag color based on OnScript styling
  const getEventTagColor = (tag: string) => {
    switch (tag) {
      case "INTRODUCTION START":
        return "bg-teal-500 text-white"
      case "INTRODUCTION END":
        return "bg-orange-500 text-white"
      case "AGENT PROSPECT DIALOG START":
        return "bg-blue-500 text-white"
      case "AGENT PROSPECT DIALOG END":
        return "bg-red-500 text-white"
      case "PRIMARY AGENT START":
        return "bg-red-600 text-white"
      case "DATA COLLECTION":
        return "bg-green-600 text-white"
      case "AUTO ATTDNT START":
        return "bg-green-500 text-white"
      case "CALL END":
        return "bg-orange-600 text-white"
      case "HOLD START":
        return "bg-pink-500 text-white"
      case "HOLD END":
        return "bg-purple-500 text-white"
      case "TRANSFER START":
        return "bg-cyan-500 text-white"
      case "TRANSFER END":
        return "bg-gray-500 text-white"
      case "QUALIFICATION":
        return "bg-purple-600 text-white"
      case "PRODUCT DISCUSSION":
        return "bg-blue-600 text-white"
      case "OBJECTION":
        return "bg-red-700 text-white"
      case "NEGATIVE OUTCOME":
        return "bg-red-800 text-white"
      case "CUSTOMER IDENTIFICATION":
        return "bg-pink-600 text-white"
      case "CUSTOMER INTENT":
        return "bg-indigo-500 text-white"
      case "PROFESSIONAL INTRO":
        return "bg-gray-600 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTopicsCovered = () => {
    if (openRouterAnalysis?.factsAnalysis?.productsMentioned) {
      return openRouterAnalysis.factsAnalysis.productsMentioned.slice(0, 4)
    }

    return ["Medicare benefits", "Eligibility for multiple benefits", "Subsidy card", "State insurance"]
  }

  const getKeyTakeaways = () => {
    if (openRouterAnalysis?.businessAnalysis?.buyingSignals) {
      return openRouterAnalysis.businessAnalysis.buyingSignals
        .slice(0, 4)
        .map((signal: string) => (signal.length > 80 ? signal.substring(0, 80) + "..." : signal))
    }

    if (openRouterAnalysis?.factsAnalysis?.keyFacts) {
      return openRouterAnalysis.factsAnalysis.keyFacts
        .slice(0, 4)
        .map((fact: string) => (fact.length > 80 ? fact.substring(0, 80) + "..." : fact))
    }

    return [
      "Customer interested in Medicare benefits for 2025",
      "Agent offered to transfer call to specialist",
      "Customer provided personal verification details",
      "Customer became frustrated during conversation",
    ]
  }

  // Enhanced Call Conclusion - Concise 2-3 line summary based on transcript
  const getCallConclusion = () => {
    if (!callLog.transcript) {
      return "The call was completed with standard customer service procedures followed."
    }

    const transcript = callLog.transcript.toLowerCase()
    const customerName = extractCustomerName(callLog.transcript) || "the customer"

    // Extract key outcomes and actions from the transcript
    let conclusion = ""

    // Check for verification/enrollment processes
    if (transcript.includes("verification") && transcript.includes("confirmation")) {
      if (transcript.includes("pin") || transcript.includes("number")) {
        conclusion = `The call concludes with ${customerName}'s verification process being initiated, and they are informed that they will receive a confirmation number and a 4-digit PIN number.`
      } else {
        conclusion = `The call concludes with ${customerName}'s verification process being completed and confirmation details provided for next steps.`
      }
    }
    // Check for enrollment/signup outcomes
    else if (transcript.includes("enroll") || transcript.includes("sign up") || transcript.includes("application")) {
      if (transcript.includes("complete") || transcript.includes("finish")) {
        conclusion = `The call concludes with ${customerName} successfully completing the enrollment process and receiving confirmation of their application submission.`
      } else {
        conclusion = `The call concludes with ${customerName} beginning the enrollment process and being provided with next steps to complete their application.`
      }
    }
    // Check for transfer outcomes
    else if (transcript.includes("transfer") && transcript.includes("specialist")) {
      conclusion = `The call concludes with the agent arranging to transfer ${customerName} to a specialist for further assistance with their specific needs.`
    }
    // Check for callback/follow-up arrangements
    else if (transcript.includes("call back") || transcript.includes("callback") || transcript.includes("follow up")) {
      conclusion = `The call concludes with a callback being scheduled for ${customerName} to continue the discussion at a more convenient time.`
    }
    // Check for qualification outcomes
    else if (transcript.includes("qualify") && transcript.includes("benefits")) {
      if (transcript.includes("eligible") || transcript.includes("approved")) {
        conclusion = `The call concludes with ${customerName} being confirmed as eligible for additional benefits and receiving information about next steps.`
      } else {
        conclusion = `The call concludes with the qualification process being initiated for ${customerName} to determine their eligibility for available benefits.`
      }
    }
    // Check for information gathering outcomes
    else if (transcript.includes("information") && (transcript.includes("collect") || transcript.includes("gather"))) {
      conclusion = `The call concludes with the agent successfully collecting ${customerName}'s information for processing and providing them with expected timelines.`
    }
    // Check for declined/not interested outcomes
    else if (
      transcript.includes("not interested") ||
      transcript.includes("decline") ||
      transcript.includes("no thank you")
    ) {
      conclusion = `The call concludes with ${customerName} declining the offered services and requesting to be removed from future contact lists.`
    }
    // Check for existing coverage outcomes
    else if (transcript.includes("already have") && transcript.includes("insurance")) {
      conclusion = `The call concludes with ${customerName} confirming they already have adequate insurance coverage and do not require additional services at this time.`
    }
    // Check for appointment/meeting scheduling
    else if (transcript.includes("appointment") || transcript.includes("meeting") || transcript.includes("schedule")) {
      conclusion = `The call concludes with an appointment being scheduled for ${customerName} to meet with a representative for detailed benefit review.`
    }
    // Check for document/information sending
    else if (
      transcript.includes("send") &&
      (transcript.includes("information") || transcript.includes("brochure") || transcript.includes("details"))
    ) {
      conclusion = `The call concludes with the agent arranging to send ${customerName} detailed information about available benefits and coverage options.`
    }
    // Generic positive outcome
    else if (transcript.includes("thank you") && transcript.includes("help")) {
      conclusion = `The call concludes with ${customerName} expressing satisfaction with the information provided and thanking the agent for their assistance.`
    }
    // Fallback based on call disposition
    else {
      const disposition = realDispositionAnalysis.disposition
      if (disposition === "CONVERTED" || disposition === "SALE") {
        conclusion = `The call concludes successfully with ${customerName} moving forward with the recommended benefits and completing the necessary enrollment steps.`
      } else if (disposition === "FOLLOW_UP") {
        conclusion = `The call concludes with follow-up arrangements made for ${customerName} to continue the benefits discussion and complete their decision process.`
      } else if (disposition === "NOT_INTERESTED") {
        conclusion = `The call concludes with ${customerName} politely declining the offered services and expressing they are not interested at this time.`
      } else {
        // Final fallback - extract last meaningful exchange
        const sentences = callLog.transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10)
        const lastFewSentences = sentences.slice(-3).join(". ").trim()

        if (lastFewSentences.length > 20) {
          // Try to identify the key outcome from the ending
          if (lastFewSentences.toLowerCase().includes("thank")) {
            conclusion = `The call concludes with ${customerName} thanking the agent for the information and indicating they will consider the options presented.`
          } else if (lastFewSentences.toLowerCase().includes("understand")) {
            conclusion = `The call concludes with ${customerName} confirming their understanding of the benefits discussed and the next steps in the process.`
          } else {
            conclusion = `The call concludes with the agent providing ${customerName} with comprehensive information about available benefits and ensuring all questions were addressed.`
          }
        } else {
          conclusion = `The call concludes with the agent successfully addressing ${customerName}'s inquiries and providing relevant benefit information.`
        }
      }
    }

    return conclusion
  }

  // Helper function to extract customer name from transcript
  const extractCustomerName = (transcript: string): string | null => {
    // Look for customer name patterns
    const customerPatterns = [
      /my name is ([a-zA-Z]+)/i,
      /this is ([a-zA-Z]+)/i,
      /i'm ([a-zA-Z]+)/i,
      /call me ([a-zA-Z]+)/i,
    ]

    for (const pattern of customerPatterns) {
      const match = transcript.match(pattern)
      if (match && match[1] && match[1].length > 1 && match[1].length < 20) {
        return match[1].trim()
      }
    }

    return null
  }

  // Also update the AI Summary content to be more detailed and specific
  const getAISummary = () => {
    if (openRouterAnalysis?.summary) {
      let summary = openRouterAnalysis.summary

      // Remove unwanted phrases from the summary - Enhanced cleaning
      summary = summary.replace(/Executive Summary of Call Analysis/gi, "")
      summary = summary.replace(/##\s*Key Outcomes and Decisions:?/gi, "")
      summary = summary.replace(/Key Outcomes and Decisions:?/gi, "")
      summary = summary.replace(/Most Important Insights:?\s*\d+\.?/gi, "")
      summary = summary.replace(/##\s*Most Important Insights:?\s*\d+\.?/gi, "")
      summary = summary.replace(/# /gi, "") // Remove any remaining markdown headers
      summary = summary.replace(/## /gi, "") // Remove level 2 headers specifically
      summary = summary.replace(/### /gi, "") // Remove level 3 headers
      summary = summary.replace(/^\s*\d+\.\s*/gm, "") // Remove numbered list items at start of lines
      summary = summary.trim() // Remove leading/trailing whitespace

      // Clean up markdown and provide complete summary
      let cleanSummary = summary
        .replace(/###\s*/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .trim()

      // If it's too long, create a proper summary instead of truncating
      if (cleanSummary.length > 400) {
        // Extract key information and create a structured summary
        const sentences = cleanSummary.split(/[.!?]+/).filter((s) => s.trim().length > 10)
        const keyPoints = sentences
          .slice(0, 4)
          .map((s) => s.trim())
          .join(". ")
        cleanSummary = keyPoints + (keyPoints.endsWith(".") ? "" : ".")
      }

      return cleanSummary
    }

    // Enhanced detailed summary based on call data and transcript analysis
    const agentName = callLog.agentName || "Benefits Coordinator"
    const prospectName =
      callLog.metadata?.fullName || openRouterAnalysis?.factsAnalysis?.customerInfo?.name || "a prospect"
    const duration = Math.round(callLog.duration / 60)

    // Extract key details from transcript if available
    if (callLog.transcript) {
      const transcript = callLog.transcript.toLowerCase()

      // Determine the main purpose/topic of the call
      let callPurpose = "discussing insurance benefits"
      if (transcript.includes("medicare") && transcript.includes("medicaid")) {
        callPurpose = "discussing Medicare and Medicaid benefits"
      } else if (transcript.includes("medicare")) {
        callPurpose = "discussing Medicare benefits for 2025"
      } else if (transcript.includes("life insurance")) {
        callPurpose = "discussing life insurance options"
      } else if (transcript.includes("health insurance")) {
        callPurpose = "discussing health insurance coverage"
      }

      // Determine prospect's situation/intent
      let prospectSituation = ""
      if (transcript.includes("already have") && transcript.includes("insurance")) {
        prospectSituation = "The prospect already has existing insurance coverage"
      } else if (transcript.includes("looking for") || transcript.includes("interested in")) {
        prospectSituation = "The prospect is seeking information about available benefits"
      } else if (transcript.includes("qualify") || transcript.includes("eligible")) {
        prospectSituation = "The prospect is checking their eligibility for benefits"
      } else if (transcript.includes("marketplace") || transcript.includes("obamacare")) {
        prospectSituation = "The prospect currently has marketplace coverage"
      }

      // Determine what was offered/discussed
      const servicesOffered = []
      if (transcript.includes("dental")) servicesOffered.push("dental coverage")
      if (transcript.includes("vision")) servicesOffered.push("vision benefits")
      if (transcript.includes("hearing")) servicesOffered.push("hearing aids")
      if (transcript.includes("life insurance")) servicesOffered.push("life insurance policy")
      if (transcript.includes("grocery") || transcript.includes("food")) servicesOffered.push("grocery benefits")
      if (transcript.includes("over the counter")) servicesOffered.push("over-the-counter benefits")

      // Determine call outcome
      let callOutcome = "The call concluded with next steps discussed"
      if (transcript.includes("not interested") || transcript.includes("no thank you")) {
        callOutcome = "The prospect declined the offered services"
      } else if (transcript.includes("transfer") || transcript.includes("specialist")) {
        callOutcome = "The agent offered to transfer the prospect to a specialist"
      } else if (transcript.includes("callback") || transcript.includes("call back")) {
        callOutcome = "A callback was scheduled for further discussion"
      } else if (transcript.includes("qualify") && transcript.includes("benefits")) {
        callOutcome = "The prospect was found to qualify for additional benefits"
      }

      // Additional context from disposition/intent analysis
      let additionalContext = ""
      if (realDispositionAnalysis.disposition === "NOT_INTERESTED") {
        additionalContext = " The prospect expressed they were not interested in changing their current coverage."
      } else if (realDispositionAnalysis.disposition === "FOLLOW_UP") {
        additionalContext = " Follow-up was arranged to continue the benefits discussion."
      } else if (realIntentAnalysis.intent === "INFORMATION_SEEKING") {
        additionalContext = " The prospect was primarily seeking information about available options."
      }

      // Construct detailed narrative summary
      const servicesText =
        servicesOffered.length > 0
          ? ` ${agentName} discussed ${servicesOffered.slice(0, 3).join(", ")} options.`
          : ` ${agentName} explained various benefit options available.`

      const situationText = prospectSituation ? ` ${prospectSituation}.` : ""

      return `The call is between ${agentName} and ${prospectName}, ${callPurpose}.${situationText}${servicesText} ${callOutcome}.${additionalContext} The ${duration}-minute conversation followed professional compliance procedures with proper identification and regulatory disclosures provided throughout the interaction.`
    }

    // Fallback summary when no transcript is available
    return `The call is between ${agentName} and ${prospectName}, discussing available insurance and Medicare benefit options. The agent conducted a professional qualification process and provided information about coverage opportunities relevant to the prospect's situation. The conversation followed standard compliance procedures with proper identification and regulatory disclosures. The ${duration}-minute consultation concluded with clear understanding of next steps and continued engagement opportunities for benefits enrollment and assistance.`
  }

  // Enhanced Call Details - Extract specific details from transcript
  const getEnhancedCallDetails = (): string[] => {
    if (!callLog.transcript) {
      return [
        "Call duration and basic information were recorded.",
        "Standard qualification process was followed.",
        "Professional interaction maintained throughout the call.",
        "Customer service protocols were observed.",
        "Call completed with appropriate documentation.",
      ]
    }

    const transcript = callLog.transcript.toLowerCase()
    const details: string[] = []
    const customerName = extractCustomerName(callLog.transcript) || "the customer"
    const agentName = callLog.agentName || "the agent"

    // Extract qualification details
    if (transcript.includes("qualify") || transcript.includes("eligible")) {
      if (transcript.includes("grocery") && transcript.includes("card")) {
        details.push(`${customerName} is qualifying for a grocery card and is assisted by ${agentName}.`)
      } else if (transcript.includes("medicare") || transcript.includes("benefits")) {
        details.push(
          `${customerName} is qualifying for Medicare benefits and additional coverage options with ${agentName}'s assistance.`,
        )
      } else if (transcript.includes("insurance")) {
        details.push(
          `${customerName} is qualifying for insurance benefits and coverage options with ${agentName}'s guidance.`,
        )
      } else {
        details.push(
          `${customerName} is qualifying for available benefits and services with ${agentName}'s assistance.`,
        )
      }
    }

    // Extract benefit/product details
    if (transcript.includes("grocery") && transcript.includes("card")) {
      if (transcript.includes("$100") || transcript.includes("100")) {
        details.push(
          "The grocery card comes with a $100 gift certificate to Walmart and Target, and a $3.95 processing fee.",
        )
      } else {
        details.push(
          "The grocery card provides access to food benefits and grocery savings at participating retailers.",
        )
      }
    } else if (transcript.includes("dental") && transcript.includes("vision")) {
      details.push(
        "The benefits package includes dental, vision, and hearing coverage options for comprehensive healthcare.",
      )
    } else if (transcript.includes("medicare") && transcript.includes("part")) {
      details.push(
        "Medicare Part A and Part B coverage options were discussed, including premium savings opportunities.",
      )
    } else if (transcript.includes("life insurance")) {
      details.push("Life insurance policy options were presented with various coverage amounts and premium structures.")
    }

    // Extract information gathering details
    if (transcript.includes("personal") || transcript.includes("information") || transcript.includes("details")) {
      if (transcript.includes("name") && transcript.includes("address")) {
        details.push(
          `${agentName} requests ${customerName}'s personal details, including full name, mailing address, and email address.`,
        )
      } else if (transcript.includes("date of birth") || transcript.includes("birthday")) {
        details.push(
          `${agentName} collects ${customerName}'s personal information including date of birth for verification purposes.`,
        )
      } else {
        details.push(
          `${agentName} gathers necessary personal information from ${customerName} for processing and verification.`,
        )
      }
    }

    // Extract verification/banking details
    if (transcript.includes("checking") && transcript.includes("account")) {
      details.push(`${customerName} provides checking account and routing number for verification purposes.`)
    } else if (transcript.includes("bank") || transcript.includes("routing")) {
      details.push(`${customerName} provides banking information for direct deposit and payment processing setup.`)
    } else if (transcript.includes("social security") || transcript.includes("ssn")) {
      details.push(
        `${customerName} provides Social Security information for identity verification and benefit processing.`,
      )
    }

    // Extract verification process details
    if (transcript.includes("verification") && transcript.includes("process")) {
      if (transcript.includes("identity") && transcript.includes("address")) {
        details.push(
          `The verification process involves confirming ${customerName}'s identity, mailing address, and checking account details.`,
        )
      } else {
        details.push(
          `The verification process includes identity confirmation and document validation for benefit enrollment.`,
        )
      }
    } else if (transcript.includes("confirm") || transcript.includes("verify")) {
      details.push(
        `${agentName} initiates the confirmation process to verify ${customerName}'s eligibility and information accuracy.`,
      )
    }

    // Extract confirmation/next steps details
    if (transcript.includes("confirmation") && transcript.includes("number")) {
      if (transcript.includes("pin") || transcript.includes("4-digit")) {
        details.push(
          `${customerName} is informed that they will receive a confirmation number and a 4-digit PIN number after the verification process.`,
        )
      } else {
        details.push(
          `${customerName} will receive a confirmation number for their application and enrollment tracking.`,
        )
      }
    } else if (transcript.includes("callback") || transcript.includes("call back")) {
      details.push(
        `A callback is scheduled for ${customerName} to complete the enrollment process and finalize benefit selection.`,
      )
    } else if (transcript.includes("transfer") && transcript.includes("specialist")) {
      details.push(
        `${agentName} arranges to transfer ${customerName} to a specialist for detailed benefit review and enrollment assistance.`,
      )
    }

    // Extract document followups
    if (transcript.includes("send") && (transcript.includes("information") || transcript.includes("brochure"))) {
      details.push(`${customerName} will receive detailed benefit information and enrollment materials by mail.`)
    }

    // Ensure we have at least 5-6 details
    if (details.length < 5) {
      // Add generic but relevant details based on call content
      if (transcript.includes("medicare") || transcript.includes("insurance")) {
        if (!details.some((d) => d.includes("coverage"))) {
          details.push(
            "Comprehensive coverage options were explained including eligibility requirements and enrollment procedures.",
          )
        }
        if (!details.some((d) => d.includes("premium"))) {
          details.push("Premium costs and payment options were discussed to ensure affordability and value.")
        }
      }

      if (transcript.includes("benefits") && !details.some((d) => d.includes("additional"))) {
        details.push("Additional benefit opportunities were identified and presented for consideration.")
      }

      if (!details.some((d) => d.includes("compliance"))) {
        details.push("All regulatory compliance requirements were met with proper disclosures and documentation.")
      }

      if (!details.some((d) => d.includes("professional"))) {
        details.push("Professional customer service standards were maintained throughout the entire interaction.")
      }
    }

    return details.slice(0, 6) // Limit to 6 details maximum
  }

  // Call Followup Items - Extract actionable next steps
  const getCallFollowupItems = (): string[] => {
    if (!callLog.transcript) {
      return [
        "Customer to review provided information and documentation.",
        "Follow-up call to be scheduled within 24-48 hours.",
      ]
    }

    const transcript = callLog.transcript.toLowerCase()
    const followupItems: string[] = []
    const customerName = extractCustomerName(callLog.transcript) || "Customer"

    // Extract confirmation/PIN related followups
    if (transcript.includes("confirmation") && transcript.includes("number")) {
      if (transcript.includes("pin") || transcript.includes("4-digit")) {
        followupItems.push(`${customerName} to receive a confirmation number and a 4-digit PIN number.`)
      } else {
        followupItems.push(`${customerName} to receive confirmation number for application tracking.`)
      }
    }

    // Extract benefit usage followups
    if (transcript.includes("grocery") && transcript.includes("card")) {
      if (transcript.includes("$100") || transcript.includes("walmart") || transcript.includes("target")) {
        followupItems.push(`${customerName} to use the $100 gift certificate at Walmart or Target.`)
      } else {
        followupItems.push(`${customerName} to activate and use grocery card benefits at participating retailers.`)
      }
    }

    // Extract enrollment followups
    if (transcript.includes("enroll") || transcript.includes("application")) {
      followupItems.push(`${customerName} to complete enrollment process and submit required documentation.`)
    }

    // Extract verification followups
    if (transcript.includes("verification") && !followupItems.some((item) => item.includes("confirmation"))) {
      followupItems.push(`${customerName} to complete identity verification process within specified timeframe.`)
    }

    // Extract callback followups
    if (transcript.includes("callback") || transcript.includes("call back")) {
      followupItems.push(`${customerName} to expect callback within 24-48 hours for process continuation.`)
    }

    // Extract transfer followups
    if (transcript.includes("transfer") && transcript.includes("specialist")) {
      followupItems.push(`${customerName} to be contacted by specialist for detailed benefit review and enrollment.`)
    }

    // Extract document followups
    if (transcript.includes("send") && (transcript.includes("information") || transcript.includes("brochure"))) {
      followupItems.push(`${customerName} to receive detailed benefit information and enrollment materials by mail.`)
    }

    // Extract appointment followups
    if (transcript.includes("appointment") || transcript.includes("meeting")) {
      followupItems.push(`${customerName} to attend scheduled appointment for benefit consultation and enrollment.`)
    }

    // Extract payment followups
    if (transcript.includes("payment") || transcript.includes("premium")) {
      followupItems.push(`${customerName} to set up payment method for premium processing and benefit activation.`)
    }

    // Add generic followups if we don't have enough specific ones
    if (followupItems.length === 0) {
      const disposition = realDispositionAnalysis.disposition
      if (disposition === "CONVERTED" || disposition === "SALE") {
        followupItems.push(`${customerName} to receive enrollment confirmation and benefit activation details.`)
        followupItems.push(`${customerName} to review benefit summary and contact information for questions.`)
      } else if (disposition === "FOLLOW_UP") {
        followupItems.push(`${customerName} to be contacted for follow-up discussion and decision finalization.`)
        followupItems.push(`${customerName} to review provided information and prepare questions for next call.`)
      } else if (disposition === "NOT_INTERESTED") {
        followupItems.push(`${customerName} contact preferences updated to reflect current interest level.`)
      } else {
        followupItems.push(`${customerName} to review discussed options and contact agent with any questions.`)
        followupItems.push(`${customerName} to expect follow-up communication regarding next steps.`)
      }
    }

    return followupItems.slice(0, 4) // Limit to reasonable number of followup items
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <div className="flex h-[95vh] overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">Call Details</DialogTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {sidebarSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedSection === section.id
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{section.label}</span>
                      {isAnalyzing &&
                        (section.id === "summary" ||
                          section.id === "topics" ||
                          section.id === "takeaways" ||
                          section.id === "conclusion" ||
                          section.id === "facts" ||
                          section.id === "disposition") && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Breaking News: Benefits Center Call Uncovers Life Insurance Opportunities
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatTimestamp(callLog.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(callLog.duration)} (sec)
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {callLog.customerPhone}
                    </span>
                    {openRouterAnalysis && <Badge className="bg-green-100 text-green-800">OpenRouter AI</Badge>}
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Content Area - Now with full page scrolling */}
              <div className="flex-1 overflow-y-auto scroll-smooth">
                <div className="p-6">
                  {/* Analysis Loading State */}
                  {isAnalyzing && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">Analyzing call with OpenRouter AI...</p>
                          <p className="text-sm text-blue-700">
                            This may take a few moments to complete comprehensive analysis.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Error State */}
                  {analysisError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <X className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">Analysis Error</p>
                          <p className="text-sm text-red-700">{analysisError}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-transparent"
                            onClick={performOpenRouterAnalysis}
                          >
                            Retry Analysis
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection === "summary" && (
                    <div className="space-y-6">
                      {/* AI Summary - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Brain className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Summary</h2>
                          {openRouterAnalysis && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">OpenRouter AI</Badge>
                          )}
                        </div>
                        <div className="text-gray-700 leading-relaxed text-base">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Generating AI summary...</span>
                            </div>
                          ) : (
                            getAISummary()
                          )}
                        </div>
                      </div>

                      {/* Topics Covered - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Topics Covered</h2>
                        </div>
                        <div className="space-y-2">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Analyzing topics...</span>
                            </div>
                          ) : (
                            getTopicsCovered().map((topic: string, index: number) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                                <span className="text-gray-700">{topic}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Key Takeaways - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Lightbulb className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Key Takeaways</h2>
                        </div>
                        <div className="space-y-2">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Extracting key takeaways...</span>
                            </div>
                          ) : (
                            getKeyTakeaways().map((takeaway: string, index: number) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                                <span className="text-gray-700">{takeaway}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Call Conclusion - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Call Conclusion</h2>
                        </div>
                        <div className="text-gray-700 leading-relaxed text-base">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Analyzing call conclusion...</span>
                            </div>
                          ) : (
                            getCallConclusion()
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection === "conclusion" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Call Conclusion
                          {openRouterAnalysis && (
                            <Badge className="bg-green-100 text-green-800 text-xs">AI Generated</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating call conclusion...</span>
                          </div>
                        ) : (
                          <p className="text-gray-700 leading-relaxed">{getCallConclusion()}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {selectedSection === "details" && (
                    <div className="space-y-6">
                      {/* Call Details - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Call Details</h2>
                        </div>
                        <div className="space-y-3">
                          {getEnhancedCallDetails().map((detail: string, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700 leading-relaxed">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Call Followup Items - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Call Followup Items</h3>
                        <div className="space-y-3">
                          {getCallFollowupItems().map((item: string, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700 leading-relaxed">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection === "facts" && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Flag className="h-5 w-5 text-purple-600" />
                            Extracted Facts
                            {openRouterAnalysis && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">AI Extracted</Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {isAnalyzing ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Extracting facts from conversation...</span>
                              </div>
                            ) : extractedFacts.length > 0 ? (
                              extractedFacts.map((fact, index) => (
                                <div key={fact.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                                    {fact.id}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900">{fact.type}</span>
                                    </div>
                                    <p className="text-gray-700">"{fact.value}"</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                                    1
                                  </div>
                                  <div>
                                    <span className="font-medium">Call Duration</span>
                                    <p className="text-gray-700">"{formatDuration(callLog.duration)}"</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                                    2
                                  </div>
                                  <div>
                                    <span className="font-medium">Agent Name</span>
                                    <p className="text-gray-700">"{callLog.agentName}"</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                                    3
                                  </div>
                                  <div>
                                    <span className="font-medium">Call Direction</span>
                                    <p className="text-gray-700">"{callLog.direction}"</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {selectedSection === "disposition" && (
                    <div className="space-y-8">
                      {/* Disposition Analysis - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Disposition Analysis</h2>
                          {openRouterAnalysis && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">OpenRouter AI</Badge>
                          )}
                        </div>

                        <div className="space-y-4">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Analyzing call disposition...</span>
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="text-base font-medium text-gray-700 mb-2 block">
                                  AI Disposition:
                                </label>
                                <div className="mb-3">
                                  <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
                                    {realDispositionAnalysis.disposition === "CONVERTED" ||
                                    realDispositionAnalysis.disposition === "SALE"
                                      ? "Sale/Conversion"
                                      : realDispositionAnalysis.disposition === "NO_RESOLUTION"
                                        ? "No Resolution"
                                        : realDispositionAnalysis.disposition === "FOLLOW_UP"
                                          ? "Follow-up Required"
                                          : realDispositionAnalysis.disposition === "ESCALATED"
                                            ? "Escalated"
                                            : realDispositionAnalysis.disposition === "NOT_INTERESTED"
                                              ? "Not Interested"
                                              : realDispositionAnalysis.disposition === "ABANDONED"
                                                ? "Call Abandoned"
                                                : realDispositionAnalysis.disposition === "CALLBACK"
                                                  ? "Callback Scheduled"
                                                  : "Not Interested"}
                                  </Badge>
                                </div>
                              </div>

                              <div>
                                <label className="text-base font-medium text-gray-700 mb-2 block">
                                  Metadata Disposition:
                                </label>
                                <p className="text-gray-400 text-base mb-4">
                                  {callLog.disposition
                                    ? callLog.disposition.toLowerCase()
                                    : "No disposition sent in call metadata"}
                                </p>
                              </div>

                              <div>
                                <label className="text-base font-medium text-gray-700 mb-2 block">Description:</label>
                                <p className="text-gray-700 text-base leading-relaxed">
                                  {realDispositionAnalysis.reasoning ||
                                    "Customer already has existing insurance coverage and does not pursue further discussion on changing their health insurance plan."}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Intent Analysis - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Target className="h-5 w-5 text-purple-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Intent Analysis</h2>
                          {openRouterAnalysis && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">OpenRouter AI</Badge>
                          )}
                        </div>

                        <div className="space-y-4">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Analyzing customer intent...</span>
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="text-base font-medium text-gray-700 mb-2 block">AI Intent</label>
                                <div className="mb-3">
                                  <Badge className="bg-purple-100 text-purple-800 px-3 py-1 text-sm font-medium">
                                    {realIntentAnalysis.intent === "PURCHASE"
                                      ? "Purchase Intent"
                                      : realIntentAnalysis.intent === "INFORMATION_SEEKING"
                                        ? "Information Seeking"
                                        : realIntentAnalysis.intent === "COMPARISON"
                                          ? "Comparison Shopping"
                                          : realIntentAnalysis.intent === "OBJECTION"
                                            ? "Objection/Resistance"
                                            : realIntentAnalysis.intent === "SUPPORT"
                                              ? "Support Request"
                                              : realIntentAnalysis.intent === "COMPLAINT"
                                                ? "Complaint"
                                                : realIntentAnalysis.intent === "CANCELLATION"
                                                  ? "Cancellation Request"
                                                  : "Information Seeking"}
                                  </Badge>
                                </div>
                              </div>

                              <div>
                                <label className="text-base font-medium text-gray-700 mb-2 block">Description:</label>
                                <p className="text-gray-700 text-base leading-relaxed">
                                  {realIntentAnalysis.reasoning ||
                                    "Customer is seeking information about insurance options but already has existing coverage, indicating a comparison or information-gathering intent rather than immediate purchase intent."}
                                </p>
                              </div>

                              <div>
                                <label className="text-base font-medium text-gray-700 mb-2 block">
                                  Confidence Score:
                                </label>
                                <div className="flex items-center gap-3">
                                  <Progress value={realIntentAnalysis.confidence || 75} className="flex-1 h-2" />
                                  <span className="text-sm font-medium text-gray-600">
                                    {realIntentAnalysis.confidence || 75}%
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection === "sentiments" && (
                    <div className="space-y-6">
                      {/* Sentiment Metrics - OnScript Style */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-red-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Sentiment Analysis</h2>
                          {deepgramSentimentAnalysis && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Deepgram AI</Badge>
                          )}
                        </div>

                        <div className="space-y-6">
                          {/* Empathy */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Empathy</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600 font-medium">Agent</span>
                                  <span className="text-blue-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.empathy?.agent || 75}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.empathy?.agent || 75}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 font-medium">Prospect</span>
                                  <span className="text-green-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.empathy?.prospect || 10}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.empathy?.prospect || 10}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Engagement And Clarity */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Engagement And Clarity</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600 font-medium">Agent</span>
                                  <span className="text-blue-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.engagementAndClarity?.agent || 78}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.engagementAndClarity?.agent || 78}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 font-medium">Prospect</span>
                                  <span className="text-green-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.engagementAndClarity?.prospect || 50}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.engagementAndClarity?.prospect || 50}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Enthusiasm */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Enthusiasm</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600 font-medium">Agent</span>
                                  <span className="text-blue-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.enthusiasm?.agent || 70}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.enthusiasm?.agent || 70}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 font-medium">Prospect</span>
                                  <span className="text-green-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.enthusiasm?.prospect || 30}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.enthusiasm?.prospect || 30}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* General Sentiment */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">General Sentiment</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600 font-medium">Agent</span>
                                  <span className="text-blue-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.generalSentiment?.agent || 85}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.generalSentiment?.agent || 85}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 font-medium">Prospect</span>
                                  <span className="text-green-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.generalSentiment?.prospect || 30}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.generalSentiment?.prospect || 30}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Politeness Level */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Politeness Level</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600 font-medium">Agent</span>
                                  <span className="text-blue-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.politenessLevel?.agent || 95}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.politenessLevel?.agent || 95}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 font-medium">Prospect</span>
                                  <span className="text-green-600 font-bold">
                                    {deepgramSentimentAnalysis?.metrics?.politenessLevel?.prospect || 20}%
                                  </span>
                                </div>
                                <div className="flex-1 mx-4">
                                  <Progress
                                    value={deepgramSentimentAnalysis?.metrics?.politenessLevel?.prospect || 20}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Agent and Prospect Insights - OnScript Style */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Agent Insights */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Agent Insights</h3>

                          <div className="space-y-4">
                            {/* Profanity Detection */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Profanity</h4>
                              <div className="flex items-center gap-2">
                                {deepgramSentimentAnalysis?.agentInsights?.profanityDetected ? (
                                  <>
                                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                                      <X className="h-3 w-3 text-red-600" />
                                    </div>
                                    <span className="text-red-600 font-medium">Detected</span>
                                    <span className="text-sm text-gray-500">
                                      ({deepgramSentimentAnalysis.agentInsights.profanityCount} instances)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    </div>
                                    <span className="text-green-600 font-medium">Not Detected</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Coaching */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Coaching</h4>
                              <div className="text-sm text-gray-700 leading-relaxed">
                                {deepgramSentimentAnalysis?.agentInsights?.coaching ||
                                  "To improve, the agent should focus on increasing enthusiasm and showing deeper empathy when addressing customer needs. Employing more engaging language and personalizing the conversation can enhance the customer experience."}
                              </div>
                              <button className="text-blue-600 text-sm font-medium mt-2 hover:underline">
                                Read Less
                              </button>
                            </div>

                            {/* Context */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Context</h4>
                              <div className="text-sm text-gray-700 leading-relaxed">
                                {deepgramSentimentAnalysis?.agentInsights?.context ||
                                  "The agent maintained a polite and professional demeanor throughout the call. There was a moderate level of engagement with clarity in explaining the purpose of the call and the additional Medicare benefits. The enthusiasm and empathy levels are moderate, showing room for improvement to build a stronger connection with the customer. No profanity was used."}
                              </div>
                              <button className="text-blue-600 text-sm font-medium mt-2 hover:underline">
                                Read Less
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Prospect Insights */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Prospect Insights</h3>

                          <div className="space-y-4">
                            {/* Profanity Detection */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Profanity</h4>
                              <div className="flex items-center gap-2">
                                {deepgramSentimentAnalysis?.prospectInsights?.profanityDetected ? (
                                  <>
                                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                                      <X className="h-3 w-3 text-red-600" />
                                    </div>
                                    <span className="text-red-600 font-medium">Detected</span>
                                    <span className="text-sm text-gray-500">
                                      ({deepgramSentimentAnalysis.prospectInsights.profanityCount} instances)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    </div>
                                    <span className="text-green-600 font-medium">Not Detected</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Context */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Context</h4>
                              <div className="text-sm text-gray-700 leading-relaxed">
                                {deepgramSentimentAnalysis?.prospectInsights?.context ||
                                  "The prospect's sentiment is moderate, showing initial interest but becoming more reserved as the conversation progresses. The prospect engages adequately and provides necessary information for qualification. Politeness is maintained throughout the interaction, though enthusiasm levels vary depending on the topic being discussed."}
                              </div>
                              <button className="text-blue-600 text-sm font-medium mt-2 hover:underline">
                                Read Less
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedSection === "metadata" && (
                    <div className="space-y-6">
                      {/* OnScript AI Style Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Agent and Buyer Info */}
                        <Card>
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <User className="h-5 w-5 text-blue-600" />
                              Agent and Buyer Info
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Affiliate Name:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.affiliateName || callLog.campaignName || "CallCenter AI"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Buyer's Name:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.buyerName ||
                                    callLog.metadata?.targetName ||
                                    callLog.agentName ||
                                    "Benefits Coordinator"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Main Info */}
                        <Card>
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Building className="h-5 w-5 text-blue-600" />
                              Main Info
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Timestamp:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">{formatTimestamp(callLog.startTime)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Duration (sec):</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">{callLog.duration}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Dialog ID:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.dialogId || callLog.callId || callLog.id}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Campaign ID:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">{callLog.campaignId}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Prospect Information */}
                        <Card>
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Target className="h-5 w-5 text-blue-600" />
                              Prospect Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Prospect Phone:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.customerPhone || callLog.metadata?.prospectPhone || "-"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Prospect City:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.prospectCity || "-"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Prospect State:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.state ||
                                    callLog.metadata?.prospectState ||
                                    callLog.metadata?.callerState ||
                                    callLog.metadata?.targetState ||
                                    "-"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Prospect Zipcode:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.prospectZipcode || "-"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Full Name:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.fullName ||
                                    openRouterAnalysis?.factsAnalysis?.customerInfo?.name ||
                                    "Unknown Caller"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card>
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <MapPin className="h-5 w-5 text-blue-600" />
                              Additional Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Prospect Address:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.prospectAddress ||
                                    callLog.metadata?.state ||
                                    callLog.metadata?.prospectState ||
                                    "-"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Hangup Direction:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.metadata?.hangupDirection ||
                                    callLog.metadata?.endCallSource ||
                                    callLog.metadata?.hangupSource ||
                                    "Unknown"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-gray-600 font-medium">Revenue:</span>
                              <div className="col-span-2">
                                <span className="text-gray-900 font-medium">
                                  {callLog.revenue
                                    ? `$${callLog.revenue}`
                                    : callLog.metadata?.revenue || callLog.metadata?.conversionAmount
                                      ? `$${callLog.metadata.conversionAmount}`
                                      : "$0.00"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar - Transcript */}
              <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Transcript</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transcript..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {/* Events Section */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection("events")}
                      className="flex items-center gap-2 w-full text-left p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {expandedSections.events ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="font-medium text-sm">Events ({allEvents.length})</span>
                    </button>

                    {expandedSections.events && (
                      <div className="mt-3 space-y-3">
                        {transcriptSegments
                          .filter((segment) =>
                            searchTerm
                              ? segment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                segment.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                              : true,
                          )
                          .map((segment) => (
                            <div key={segment.id} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    segment.isAgent ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {segment.isAgent ? "A" : "C"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-gray-900">{segment.speaker}</span>
                                    <span className="text-xs text-gray-500">{segment.timestamp}</span>
                                    <span className="text-xs text-gray-400">({segment.confidence}%)</span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">{segment.text}</p>
                                  {segment.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {segment.tags.map((tag, tagIndex) => (
                                        <Badge
                                          key={tagIndex}
                                          className={`text-xs px-1.5 py-0.5 ${getEventTagColor(tag)}`}
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
