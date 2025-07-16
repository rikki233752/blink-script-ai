import type { IntentAnalysis } from "./intent-disposition-utils"
import type { SentimentAnalysis } from "./sentiment-analysis"

// Types for enhanced business conversion analysis
export interface EnhancedBusinessConversion {
  conversionAchieved: boolean
  conversionType: string
  conversionConfidence: number
  conversionStage: "awareness" | "interest" | "consideration" | "intent" | "evaluation" | "purchase"
  commitmentLevel: "low" | "medium" | "high" | "very_high"
  estimatedValue: string | number
  valueCategory: "low" | "medium" | "high" | "very_high"
  urgency: "low" | "medium" | "high" | "very_high"
  followUpTiming: string
  positiveSignals: string[]
  negativeSignals: string[]
  agentEffectiveness: {
    closingAttempts: number
    objectionHandling: number
    valueProposition: number
    urgencyCreation: number
  }
  riskFactors: string[]
  nextBestAction: string
}

// Weighted conversion signals with categories
const conversionSignals = {
  // Strong positive signals (customer commitment)
  strongPositive: {
    phrases: [
      "i'll take it",
      "sign me up",
      "let's proceed",
      "i want to buy",
      "i'd like to purchase",
      "when can we start",
      "i'm ready to move forward",
      "let's do this",
      "i'm sold",
      "where do i sign",
      "how do i pay",
      "can i pay now",
      "i'll go with",
      "i've decided to",
      "i'm convinced",
    ],
    weight: 10,
  },
  // Moderate positive signals (customer interest)
  moderatePositive: {
    phrases: [
      "i'm interested",
      "sounds good",
      "that makes sense",
      "i like that",
      "tell me more about",
      "how much does it cost",
      "what are the next steps",
      "can you explain",
      "that's interesting",
      "i see the value",
      "that would help me",
      "i need something like that",
      "that's what i'm looking for",
      "how soon can i get it",
      "what options do you have",
    ],
    weight: 5,
  },
  // Weak positive signals (early interest)
  weakPositive: {
    phrases: [
      "maybe",
      "possibly",
      "i might be interested",
      "i'll think about it",
      "send me information",
      "i'll consider it",
      "not right now but",
      "in the future",
      "that could work",
      "i see how that could help",
      "that's not bad",
      "interesting point",
      "good to know",
      "i appreciate that",
      "that's helpful",
    ],
    weight: 2,
  },
  // Negative signals (objections)
  negative: {
    phrases: [
      "too expensive",
      "not interested",
      "not right now",
      "i need to think about it",
      "i'll get back to you",
      "i'm just looking",
      "i'm not ready",
      "i need to discuss with",
      "i'm comparing options",
      "i have concerns about",
      "that's not what i need",
      "i don't see the value",
      "i'm not convinced",
      "i don't have the budget",
      "i'm not sure",
    ],
    weight: -5,
  },
  // Strong negative signals (rejection)
  strongNegative: {
    phrases: [
      "definitely not",
      "absolutely not",
      "no way",
      "not a chance",
      "i'm not interested at all",
      "that's way too expensive",
      "i've decided against it",
      "i'm going with a competitor",
      "i don't want it",
      "i hate it",
      "that's terrible",
      "that won't work for me",
      "i'm not buying",
      "stop calling me",
      "remove me from your list",
    ],
    weight: -10,
  },
  // Agent closing attempts
  agentClosing: {
    phrases: [
      "would you like to proceed",
      "shall we get started",
      "are you ready to move forward",
      "can i sign you up",
      "would you like to purchase",
      "should we process your order",
      "can i help you complete your purchase",
      "are you interested in buying",
      "would you like to go ahead with",
      "shall we finalize",
      "would you like me to set that up for you",
      "can we move forward with",
      "would you like to take advantage of",
      "are you ready to get started",
      "would you like to become a customer",
    ],
    weight: 0, // This affects agent effectiveness score, not conversion probability
  },
  // Value proposition signals
  valueProposition: {
    phrases: [
      "benefit",
      "value",
      "save you",
      "improve your",
      "advantage",
      "better than",
      "solution to",
      "help you with",
      "designed to",
      "feature that",
      "results in",
      "leads to",
      "provides",
      "offers",
      "delivers",
    ],
    weight: 0, // This affects agent effectiveness score, not conversion probability
  },
  // Urgency creation signals
  urgencyCreation: {
    phrases: [
      "limited time",
      "special offer",
      "discount ends",
      "only available",
      "last chance",
      "act now",
      "don't miss out",
      "today only",
      "while supplies last",
      "for a limited time",
      "exclusive offer",
      "before it's gone",
      "time-sensitive",
      "deadline",
      "opportunity",
    ],
    weight: 0, // This affects agent effectiveness score, not conversion probability
  },
}

// Parse transcript to identify speakers and their statements
function parseTranscriptBySpeaker(transcript: string): { speaker: string; text: string }[] {
  const lines = transcript.split("\n").filter((line) => line.trim() !== "")
  const parsedLines: { speaker: string; text: string }[] = []

  for (const line of lines) {
    // Check if line has a speaker prefix (e.g., "Agent:" or "Customer:")
    const speakerMatch = line.match(/^(Agent|Customer|Representative|Client|Rep|Cust):\s*(.+)/i)

    if (speakerMatch) {
      const speaker = speakerMatch[1].toLowerCase()
      const text = speakerMatch[2].trim()

      // Normalize speaker names
      let normalizedSpeaker = "unknown"
      if (speaker.includes("agent") || speaker.includes("rep") || speaker.includes("representative")) {
        normalizedSpeaker = "agent"
      } else if (speaker.includes("customer") || speaker.includes("client") || speaker.includes("cust")) {
        normalizedSpeaker = "customer"
      }

      parsedLines.push({ speaker: normalizedSpeaker, text })
    } else {
      // If no speaker prefix, add as unknown
      parsedLines.push({ speaker: "unknown", text: line.trim() })
    }
  }

  return parsedLines
}

// Detect conversion signals in the transcript
function detectConversionSignals(parsedTranscript: { speaker: string; text: string }[]): {
  positiveSignals: string[]
  negativeSignals: string[]
  conversionScore: number
  agentEffectiveness: {
    closingAttempts: number
    objectionHandling: number
    valueProposition: number
    urgencyCreation: number
  }
} {
  let conversionScore = 0
  const positiveSignals: string[] = []
  const negativeSignals: string[] = []

  // Agent effectiveness metrics
  let closingAttempts = 0
  let valuePropositionScore = 0
  let urgencyCreationScore = 0

  // Track objections and responses for objection handling score
  const objections: number[] = []
  const objectionResponses: number[] = []

  // Process each line of the transcript
  for (let i = 0; i < parsedTranscript.length; i++) {
    const line = parsedTranscript[i]
    const text = line.text.toLowerCase()

    // Check for customer positive signals
    if (line.speaker === "customer") {
      // Strong positive signals
      for (const phrase of conversionSignals.strongPositive.phrases) {
        if (text.includes(phrase)) {
          conversionScore += conversionSignals.strongPositive.weight
          positiveSignals.push(`Customer: "${phrase}" (Strong)`)
        }
      }

      // Moderate positive signals
      for (const phrase of conversionSignals.moderatePositive.phrases) {
        if (text.includes(phrase)) {
          conversionScore += conversionSignals.moderatePositive.weight
          positiveSignals.push(`Customer: "${phrase}" (Moderate)`)
        }
      }

      // Weak positive signals
      for (const phrase of conversionSignals.weakPositive.phrases) {
        if (text.includes(phrase)) {
          conversionScore += conversionSignals.weakPositive.weight
          positiveSignals.push(`Customer: "${phrase}" (Weak)`)
        }
      }

      // Negative signals
      for (const phrase of conversionSignals.negative.phrases) {
        if (text.includes(phrase)) {
          conversionScore += conversionSignals.negative.weight
          negativeSignals.push(`Customer: "${phrase}"`)
          objections.push(i) // Track the objection position
        }
      }

      // Strong negative signals
      for (const phrase of conversionSignals.strongNegative.phrases) {
        if (text.includes(phrase)) {
          conversionScore += conversionSignals.strongNegative.weight
          negativeSignals.push(`Customer: "${phrase}" (Strong)`)
          objections.push(i) // Track the objection position
        }
      }
    }

    // Check for agent signals
    if (line.speaker === "agent") {
      // Closing attempts
      for (const phrase of conversionSignals.agentClosing.phrases) {
        if (text.includes(phrase)) {
          closingAttempts++
        }
      }

      // Value proposition
      for (const phrase of conversionSignals.valueProposition.phrases) {
        if (text.includes(phrase)) {
          valuePropositionScore++
        }
      }

      // Urgency creation
      for (const phrase of conversionSignals.urgencyCreation.phrases) {
        if (text.includes(phrase)) {
          urgencyCreationScore++
        }
      }

      // Check if this is a response to an objection
      for (const objectionPos of objections) {
        if (i === objectionPos + 1) {
          objectionResponses.push(i)
        }
      }
    }
  }

  // Calculate objection handling score (0-10)
  const objectionHandlingScore =
    objections.length > 0 ? Math.min(10, Math.round((objectionResponses.length / objections.length) * 10)) : 5 // Default if no objections

  // Normalize other agent effectiveness scores (0-10)
  const normalizedClosingAttempts = Math.min(10, closingAttempts)
  const normalizedValueProposition = Math.min(10, Math.round(valuePropositionScore / 2))
  const normalizedUrgencyCreation = Math.min(10, Math.round(urgencyCreationScore / 1.5))

  return {
    positiveSignals,
    negativeSignals,
    conversionScore,
    agentEffectiveness: {
      closingAttempts: normalizedClosingAttempts,
      objectionHandling: objectionHandlingScore,
      valueProposition: normalizedValueProposition,
      urgencyCreation: normalizedUrgencyCreation,
    },
  }
}

// Determine conversion stage based on signals and conversation flow
function determineConversionStage(
  conversionScore: number,
  positiveSignals: string[],
  negativeSignals: string[],
  intentAnalysis: IntentAnalysis,
): "awareness" | "interest" | "consideration" | "intent" | "evaluation" | "purchase" {
  // Count signals by strength
  const strongPositiveCount = positiveSignals.filter((s) => s.includes("(Strong)")).length
  const moderatePositiveCount = positiveSignals.filter((s) => s.includes("(Moderate)")).length
  const weakPositiveCount = positiveSignals.filter((s) => s.includes("(Weak)")).length
  const strongNegativeCount = negativeSignals.filter((s) => s.includes("(Strong)")).length

  // Purchase stage - strong commitment signals
  if (strongPositiveCount >= 2 && conversionScore > 15) {
    return "purchase"
  }

  // Evaluation stage - weighing options, asking detailed questions
  if ((strongPositiveCount >= 1 || moderatePositiveCount >= 3) && conversionScore > 10) {
    return "evaluation"
  }

  // Intent stage - showing clear interest, discussing specifics
  if ((moderatePositiveCount >= 2 || strongPositiveCount >= 1) && conversionScore > 5) {
    return "intent"
  }

  // Consideration stage - actively engaging, asking questions
  if ((weakPositiveCount >= 2 || moderatePositiveCount >= 1) && conversionScore > 0) {
    return "consideration"
  }

  // Interest stage - showing some interest
  if (weakPositiveCount >= 1 && conversionScore >= -5) {
    return "interest"
  }

  // Default to awareness stage
  return "awareness"
}

// Determine commitment level based on signals and conversion score
function determineCommitmentLevel(
  conversionScore: number,
  positiveSignals: string[],
  negativeSignals: string[],
): "low" | "medium" | "high" | "very_high" {
  if (conversionScore >= 20) return "very_high"
  if (conversionScore >= 10) return "high"
  if (conversionScore >= 0) return "medium"
  return "low"
}

// Estimate deal value based on conversation content
function estimateDealValue(
  transcript: string,
  conversionStage: string,
  commitmentLevel: string,
): { value: string | number; category: "low" | "medium" | "high" | "very_high" } {
  const text = transcript.toLowerCase()

  // Look for specific price mentions
  const priceMatches = text.match(/\$(\d+(?:,\d+)*(?:\.\d+)?)/g)
  if (priceMatches && priceMatches.length > 0) {
    // Extract the highest mentioned price
    const prices = priceMatches.map((p) => Number.parseFloat(p.replace(/[$,]/g, "")))
    const highestPrice = Math.max(...prices)

    // Categorize the value
    let category: "low" | "medium" | "high" | "very_high" = "low"
    if (highestPrice >= 10000) category = "very_high"
    else if (highestPrice >= 1000) category = "high"
    else if (highestPrice >= 100) category = "medium"

    return { value: highestPrice, category }
  }

  // If no specific price, estimate based on conversion stage and commitment
  if (conversionStage === "purchase" && commitmentLevel === "very_high") {
    return { value: "high estimate", category: "high" }
  } else if (["evaluation", "intent"].includes(conversionStage) && ["high", "very_high"].includes(commitmentLevel)) {
    return { value: "medium estimate", category: "medium" }
  }

  return { value: "unknown", category: "low" }
}

// Determine urgency level based on conversation signals
function determineUrgency(
  transcript: string,
  conversionStage: string,
  commitmentLevel: string,
): { level: "low" | "medium" | "high" | "very_high"; followUpTiming: string } {
  const text = transcript.toLowerCase()

  // High urgency indicators
  const highUrgencyPhrases = [
    "need it immediately",
    "as soon as possible",
    "urgent",
    "emergency",
    "right away",
    "today",
    "now",
    "quickly",
  ]

  // Medium urgency indicators
  const mediumUrgencyPhrases = ["this week", "soon", "in the next few days", "shortly", "not too long"]

  // Check for high urgency phrases
  for (const phrase of highUrgencyPhrases) {
    if (text.includes(phrase)) {
      return { level: "very_high", followUpTiming: "Within 24 hours" }
    }
  }

  // Check for medium urgency phrases
  for (const phrase of mediumUrgencyPhrases) {
    if (text.includes(phrase)) {
      return { level: "high", followUpTiming: "Within 2-3 days" }
    }
  }

  // Base urgency on conversion stage and commitment level
  if (conversionStage === "purchase" || commitmentLevel === "very_high") {
    return { level: "high", followUpTiming: "Within 1 week" }
  } else if (["evaluation", "intent"].includes(conversionStage) && ["high", "medium"].includes(commitmentLevel)) {
    return { level: "medium", followUpTiming: "Within 2 weeks" }
  }

  return { level: "low", followUpTiming: "Within 1 month" }
}

// Identify risk factors in the conversation
function identifyRiskFactors(
  transcript: string,
  negativeSignals: string[],
  sentimentAnalysis: SentimentAnalysis,
): string[] {
  const riskFactors: string[] = []
  const text = transcript.toLowerCase()

  // Price sensitivity
  if (text.includes("expensive") || text.includes("cost") || text.includes("price") || text.includes("budget")) {
    riskFactors.push("Price sensitivity detected")
  }

  // Decision timeline concerns
  if (text.includes("not ready") || text.includes("too soon") || text.includes("in the future")) {
    riskFactors.push("Decision timeline concerns")
  }

  // Competitor mentions
  if (text.includes("competitor") || text.includes("other option") || text.includes("alternative")) {
    riskFactors.push("Considering competitor options")
  }

  // Decision maker involvement
  if (text.includes("need to discuss") || text.includes("talk to") || text.includes("check with")) {
    riskFactors.push("Not primary decision maker")
  }

  // Negative sentiment
  if (sentimentAnalysis.customerSentiment.overall === "Negative") {
    riskFactors.push("Negative customer sentiment")
  }

  // Based on number of negative signals
  if (negativeSignals.length >= 3) {
    riskFactors.push("Multiple objections raised")
  }

  return riskFactors
}

// Generate next best action recommendation
function generateNextBestAction(conversionStage: string, commitmentLevel: string, riskFactors: string[]): string {
  if (conversionStage === "purchase" && commitmentLevel === "very_high") {
    return "Send contract/agreement and follow up to complete the sale"
  }

  if (conversionStage === "evaluation" || conversionStage === "intent") {
    if (riskFactors.includes("Price sensitivity detected")) {
      return "Provide ROI analysis and value justification materials"
    }
    if (riskFactors.includes("Not primary decision maker")) {
      return "Prepare materials for decision maker and offer joint meeting"
    }
    return "Send detailed proposal with clear next steps and timeline"
  }

  if (conversionStage === "consideration") {
    return "Share case studies and testimonials relevant to customer needs"
  }

  if (conversionStage === "interest") {
    return "Provide product/service information tailored to specific pain points"
  }

  return "Nurture with educational content and check in after 2 weeks"
}

// Calculate conversion confidence based on multiple factors
function calculateConversionConfidence(
  conversionScore: number,
  conversionStage: string,
  commitmentLevel: string,
  riskFactors: string[],
): number {
  // Base confidence on conversion score
  let confidence = 50 + conversionScore * 2

  // Adjust based on conversion stage
  const stageAdjustment = {
    awareness: 0,
    interest: 10,
    consideration: 20,
    intent: 30,
    evaluation: 40,
    purchase: 50,
  }
  confidence += stageAdjustment[conversionStage as keyof typeof stageAdjustment] || 0

  // Adjust based on commitment level
  const commitmentAdjustment = {
    low: -10,
    medium: 0,
    high: 10,
    very_high: 20,
  }
  confidence += commitmentAdjustment[commitmentLevel as keyof typeof commitmentAdjustment] || 0

  // Reduce confidence for each risk factor
  confidence -= riskFactors.length * 5

  // Ensure confidence is between 0-100
  return Math.max(0, Math.min(100, Math.round(confidence)))
}

// Determine conversion type based on transcript content
function determineConversionType(transcript: string, intentAnalysis: IntentAnalysis): string {
  const text = transcript.toLowerCase()

  // Check for specific conversion types
  if (text.includes("purchase") || text.includes("buy") || text.includes("order")) {
    return "Sale"
  } else if (text.includes("upgrade") || text.includes("premium")) {
    return "Upgrade"
  } else if (text.includes("demo") || text.includes("trial") || text.includes("sample")) {
    return "Demo Request"
  } else if (text.includes("appointment") || text.includes("schedule") || text.includes("meeting")) {
    return "Appointment"
  } else if (text.includes("subscribe") || text.includes("newsletter")) {
    return "Subscription"
  } else if (text.includes("renewal") || text.includes("extend")) {
    return "Renewal"
  } else if (text.includes("upsell") || text.includes("additional")) {
    return "Upsell"
  } else if (text.includes("referral") || text.includes("recommend")) {
    return "Referral"
  }

  // Default based on intent
  if (intentAnalysis.primaryIntent === "SALES") {
    return "Sale"
  } else if (intentAnalysis.primaryIntent === "SUPPORT") {
    return "Issue Resolution"
  }

  return "Information Gathering"
}

// Main function to analyze business conversion
export function analyzeBusinessConversionEnhanced(
  transcript: string,
  intentAnalysis: IntentAnalysis,
  sentimentAnalysis: SentimentAnalysis,
): EnhancedBusinessConversion {
  // Parse transcript to identify speakers
  const parsedTranscript = parseTranscriptBySpeaker(transcript)

  // Detect conversion signals
  const { positiveSignals, negativeSignals, conversionScore, agentEffectiveness } =
    detectConversionSignals(parsedTranscript)

  // Determine conversion stage
  const conversionStage = determineConversionStage(conversionScore, positiveSignals, negativeSignals, intentAnalysis)

  // Determine commitment level
  const commitmentLevel = determineCommitmentLevel(conversionScore, positiveSignals, negativeSignals)

  // Estimate deal value
  const { value: estimatedValue, category: valueCategory } = estimateDealValue(
    transcript,
    conversionStage,
    commitmentLevel,
  )

  // Determine urgency
  const { level: urgency, followUpTiming } = determineUrgency(transcript, conversionStage, commitmentLevel)

  // Identify risk factors
  const riskFactors = identifyRiskFactors(transcript, negativeSignals, sentimentAnalysis)

  // Generate next best action
  const nextBestAction = generateNextBestAction(conversionStage, commitmentLevel, riskFactors)

  // Calculate conversion confidence
  const conversionConfidence = calculateConversionConfidence(
    conversionScore,
    conversionStage,
    commitmentLevel,
    riskFactors,
  )

  // Determine conversion type
  const conversionType = determineConversionType(transcript, intentAnalysis)

  // Determine if conversion was achieved
  const conversionAchieved =
    conversionStage === "purchase" || (conversionConfidence >= 75 && commitmentLevel === "very_high")

  return {
    conversionAchieved,
    conversionType,
    conversionConfidence,
    conversionStage,
    commitmentLevel,
    estimatedValue,
    valueCategory,
    urgency,
    followUpTiming,
    positiveSignals: positiveSignals.slice(0, 5), // Limit to top 5 signals
    negativeSignals: negativeSignals.slice(0, 5), // Limit to top 5 signals
    agentEffectiveness,
    riskFactors,
    nextBestAction,
  }
}
