// Call Intent Categories - Using uppercase keys to match the enum pattern
export const CALL_INTENTS = {
  SUPPORT: {
    id: "SUPPORT",
    name: "Technical Support",
    subcategories: [
      "Account Issues",
      "Technical Problems",
      "Password Reset",
      "Login Issues",
      "Feature Questions",
      "Bug Reports",
      "Service Outage",
      "Configuration Help",
    ],
    keywords: [
      "help",
      "problem",
      "issue",
      "trouble",
      "error",
      "bug",
      "broken",
      "not working",
      "technical",
      "support",
      "fix",
      "resolve",
      "assistance",
      "password",
      "login",
      "account",
      "access",
    ],
  },
  SALES: {
    id: "SALES",
    name: "Sales Inquiry",
    subcategories: [
      "Product Information",
      "Pricing Questions",
      "Demo Request",
      "Quote Request",
      "Upgrade Inquiry",
      "New Purchase",
      "Plan Comparison",
      "Feature Benefits",
    ],
    keywords: [
      "buy",
      "purchase",
      "price",
      "cost",
      "quote",
      "demo",
      "trial",
      "upgrade",
      "plan",
      "package",
      "subscription",
      "product",
      "service",
      "interested",
      "pricing",
      "features",
      "benefits",
    ],
  },
  BILLING: {
    id: "BILLING",
    name: "Billing & Payment",
    subcategories: [
      "Payment Issues",
      "Billing Questions",
      "Refund Request",
      "Invoice Inquiry",
      "Plan Changes",
      "Subscription Management",
      "Credit Card Updates",
      "Payment Method Changes",
    ],
    keywords: [
      "bill",
      "billing",
      "payment",
      "charge",
      "invoice",
      "refund",
      "money",
      "credit card",
      "subscription",
      "plan",
      "cancel",
      "downgrade",
      "upgrade",
      "payment method",
      "auto-pay",
      "receipt",
    ],
  },
  COMPLAINT: {
    id: "COMPLAINT",
    name: "Complaint",
    subcategories: [
      "Service Quality",
      "Product Issues",
      "Agent Behavior",
      "Billing Dispute",
      "Feature Request",
      "General Dissatisfaction",
      "Escalation Request",
      "Manager Request",
    ],
    keywords: [
      "complaint",
      "complain",
      "unhappy",
      "dissatisfied",
      "angry",
      "frustrated",
      "terrible",
      "awful",
      "bad service",
      "poor quality",
      "disappointed",
      "unacceptable",
      "manager",
      "supervisor",
    ],
  },
  INFORMATION: {
    id: "INFORMATION",
    name: "Information Request",
    subcategories: [
      "General Inquiry",
      "Hours of Operation",
      "Contact Information",
      "Policy Questions",
      "Documentation Request",
      "Status Check",
      "Company Information",
      "Service Availability",
    ],
    keywords: [
      "information",
      "hours",
      "location",
      "contact",
      "policy",
      "procedure",
      "status",
      "update",
      "when",
      "where",
      "who",
      "what",
      "general question",
      "availability",
    ],
  },
  ONBOARDING: {
    id: "ONBOARDING",
    name: "Onboarding & Setup",
    subcategories: [
      "New Customer Setup",
      "Account Activation",
      "Initial Configuration",
      "Welcome Call",
      "Training Request",
      "Getting Started",
    ],
    keywords: [
      "new customer",
      "setup",
      "onboarding",
      "activation",
      "getting started",
      "welcome",
      "initial",
      "configuration",
      "training",
    ],
  },
  RETENTION: {
    id: "RETENTION",
    name: "Customer Retention",
    subcategories: [
      "Cancellation Request",
      "Downgrade Intent",
      "Competitor Comparison",
      "Retention Offer",
      "Win-back Attempt",
    ],
    keywords: [
      "cancel",
      "cancellation",
      "leave",
      "competitor",
      "cheaper",
      "better deal",
      "switching",
      "downgrade",
      "not satisfied",
    ],
  },
} as const

// Call Dispositions - Using uppercase keys to match the enum pattern
export const CALL_DISPOSITIONS = {
  RESOLVED: {
    id: "RESOLVED",
    name: "Resolved",
    description: "Issue was completely resolved during the call",
    color: "#10b981",
    indicators: [
      "resolved",
      "fixed",
      "solved",
      "working now",
      "thank you",
      "perfect",
      "that works",
      "all set",
      "problem solved",
    ],
  },
  ESCALATED: {
    id: "ESCALATED",
    name: "Escalated",
    description: "Call was escalated to higher level support",
    color: "#f59e0b",
    indicators: [
      "escalate",
      "manager",
      "supervisor",
      "higher level",
      "senior",
      "specialist",
      "tier 2",
      "advanced support",
    ],
  },
  FOLLOW_UP: {
    id: "FOLLOW_UP",
    name: "Follow-up Required",
    description: "Additional follow-up action needed",
    color: "#3b82f6",
    indicators: [
      "follow up",
      "call back",
      "check back",
      "monitor",
      "update",
      "let you know",
      "get back to you",
      "investigate",
    ],
  },
  TRANSFERRED: {
    id: "TRANSFERRED",
    name: "Transferred",
    description: "Call was transferred to another department",
    color: "#8b5cf6",
    indicators: [
      "transfer",
      "different department",
      "billing department",
      "sales team",
      "technical team",
      "specialist",
      "another agent",
    ],
  },
  ABANDONED: {
    id: "ABANDONED",
    name: "Abandoned",
    description: "Customer hung up before resolution",
    color: "#ef4444",
    indicators: ["hung up", "disconnected", "line went dead", "customer left", "dropped call"],
  },
  CALLBACK: {
    id: "CALLBACK",
    name: "Callback Scheduled",
    description: "Callback was scheduled for later",
    color: "#06b6d4",
    indicators: ["schedule", "appointment", "call you back", "convenient time", "later today", "tomorrow"],
  },
  CONVERTED: {
    id: "CONVERTED",
    name: "Sale Converted",
    description: "Customer made a purchase or committed to buy",
    color: "#059669",
    indicators: ["yes i'll take it", "sign me up", "let's proceed", "i agree", "sounds good", "purchase", "buy now"],
  },
  NO_RESOLUTION: {
    id: "NO_RESOLUTION",
    name: "No Resolution",
    description: "Unable to resolve the issue",
    color: "#6b7280",
    indicators: [
      "unable to",
      "cannot resolve",
      "not possible",
      "no solution",
      "still having issues",
      "problem persists",
    ],
  },
} as const

export type IntentKey = keyof typeof CALL_INTENTS
export type DispositionKey = keyof typeof CALL_DISPOSITIONS

export interface IntentAnalysis {
  primaryIntent: IntentKey
  secondaryIntent?: IntentKey
  subcategory: string
  confidence: number
  keywords: string[]
  reasoning: string
  aiEnhanced: boolean
  deepgramIntents?: any[]
  topicAnalysis?: any[]
}

export interface DispositionAnalysis {
  disposition: DispositionKey
  confidence: number
  reasoning: string
  nextSteps?: string[]
  escalationReason?: string
  transferDepartment?: string
  aiEnhanced: boolean
  sentimentImpact?: string
}

// Enhanced AI-powered Intent Detection
export function detectCallIntentWithAI(
  transcript: string,
  deepgramIntents: any[] = [],
  deepgramTopics: any[] = [],
  sentimentData: any[] = [],
): IntentAnalysis {
  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return {
      primaryIntent: "INFORMATION",
      subcategory: "General Inquiry",
      confidence: 50,
      keywords: [],
      reasoning: "Unable to analyze empty or invalid transcript",
      aiEnhanced: false,
    }
  }

  const text = transcript.toLowerCase()
  console.log("🧠 AI Intent Analysis starting...")
  console.log("  - Deepgram intents:", deepgramIntents.length)
  console.log("  - Deepgram topics:", deepgramTopics.length)
  console.log("  - Sentiment segments:", sentimentData.length)

  // Step 1: Analyze Deepgram AI intents first
  let primaryIntent: IntentKey = "INFORMATION"
  let confidence = 60
  let aiEnhanced = false
  let reasoning = "Basic keyword analysis"

  if (deepgramIntents.length > 0) {
    const topDeepgramIntent = deepgramIntents[0]
    console.log("🎯 Top Deepgram intent:", topDeepgramIntent)

    // Map Deepgram intents to our categories
    const intentMapping = mapDeepgramIntentToCategory(topDeepgramIntent.intent, text)
    if (intentMapping) {
      primaryIntent = intentMapping.category
      confidence = Math.max(confidence, Math.round(topDeepgramIntent.confidence * 100))
      reasoning = `AI-detected intent: ${topDeepgramIntent.intent} (${confidence}% confidence)`
      aiEnhanced = true
    }
  }

  // Step 2: Enhance with topic analysis
  if (deepgramTopics.length > 0) {
    console.log(
      "📊 Analyzing topics:",
      deepgramTopics.map((t) => t.topic),
    )
    const topicEnhancement = enhanceIntentWithTopics(deepgramTopics, primaryIntent)
    if (topicEnhancement.enhanced) {
      primaryIntent = topicEnhancement.intent
      confidence = Math.max(confidence, topicEnhancement.confidence)
      reasoning += ` Enhanced with topic analysis: ${topicEnhancement.topics.join(", ")}`
      aiEnhanced = true
    }
  }

  // Step 3: Advanced keyword analysis with context
  const keywordAnalysis = performAdvancedKeywordAnalysis(text)
  if (keywordAnalysis.confidence > confidence) {
    primaryIntent = keywordAnalysis.intent
    confidence = keywordAnalysis.confidence
    reasoning = `Advanced keyword analysis: ${keywordAnalysis.matchedKeywords.join(", ")}`
  }

  // Step 4: Sentiment-based enhancement
  if (sentimentData.length > 0) {
    const sentimentEnhancement = enhanceIntentWithSentiment(sentimentData, primaryIntent, text)
    confidence = Math.max(confidence, sentimentEnhancement.confidence)
    if (sentimentEnhancement.adjusted) {
      reasoning += ` Sentiment-adjusted: ${sentimentEnhancement.reason}`
    }
  }

  // Step 5: Determine subcategory with AI
  const subcategory = determineSubcategoryWithAI(primaryIntent, text, deepgramTopics)

  // Step 6: Extract relevant keywords
  const keywords = extractRelevantKeywords(text, primaryIntent, deepgramTopics)

  // Step 7: Detect secondary intent
  const secondaryIntent = detectSecondaryIntent(text, primaryIntent, deepgramIntents)

  console.log("✅ AI Intent Analysis complete:")
  console.log("  - Primary:", primaryIntent)
  console.log("  - Confidence:", confidence)
  console.log("  - AI Enhanced:", aiEnhanced)

  return {
    primaryIntent,
    secondaryIntent,
    subcategory,
    confidence: Math.min(95, confidence),
    keywords: keywords.slice(0, 8),
    reasoning,
    aiEnhanced,
    deepgramIntents,
    topicAnalysis: deepgramTopics,
  }
}

// Enhanced AI-powered Disposition Detection
export function detectCallDispositionWithAI(
  transcript: string,
  intentAnalysis: IntentAnalysis,
  sentimentData: any[] = [],
  businessConversion: any = {},
): DispositionAnalysis {
  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return {
      disposition: "NO_RESOLUTION",
      confidence: 50,
      reasoning: "Unable to analyze empty or invalid transcript",
      nextSteps: ["Review call recording for quality assurance"],
      aiEnhanced: false,
    }
  }

  const text = transcript.toLowerCase()
  console.log("🎯 AI Disposition Analysis starting...")

  // Step 1: Check for business conversion first
  let disposition: DispositionKey = "NO_RESOLUTION"
  let confidence = 50
  let reasoning = "Basic pattern analysis"
  let aiEnhanced = false

  if (businessConversion?.conversionAchieved) {
    disposition = "CONVERTED"
    confidence = Math.max(85, businessConversion.conversionConfidence || 85)
    reasoning = `AI-detected conversion: ${businessConversion.conversionType}`
    aiEnhanced = true
  } else {
    // Step 2: Advanced disposition detection with AI
    const dispositionScores = calculateDispositionScores(text, sentimentData)
    const topDisposition = Object.entries(dispositionScores).sort(([, a], [, b]) => b - a)[0]

    disposition = topDisposition[0] as DispositionKey
    confidence = Math.min(90, Math.max(60, Math.round(topDisposition[1] * 20 + 50)))

    // Step 3: Sentiment-based confidence adjustment
    if (sentimentData.length > 0) {
      const sentimentAdjustment = adjustDispositionWithSentiment(disposition, sentimentData)
      confidence = Math.max(confidence, sentimentAdjustment.confidence)
      reasoning = `AI-enhanced disposition analysis with sentiment: ${sentimentAdjustment.reason}`
      aiEnhanced = true
    }
  }

  // Step 4: Intent-based refinement
  const intentRefinement = refineDispositionWithIntent(disposition, intentAnalysis)
  if (intentRefinement.adjusted) {
    disposition = intentRefinement.disposition
    confidence = Math.max(confidence, intentRefinement.confidence)
    reasoning += ` Intent-refined: ${intentRefinement.reason}`
  }

  // Step 5: Generate contextual next steps
  const nextSteps = generateContextualNextSteps(disposition, intentAnalysis, businessConversion)

  // Step 6: Determine escalation reason if applicable
  const escalationReason = disposition === "ESCALATED" ? determineEscalationReason(text, intentAnalysis) : undefined

  // Step 7: Identify transfer department if applicable
  const transferDepartment =
    disposition === "TRANSFERRED" ? identifyTransferDepartment(text, intentAnalysis) : undefined

  console.log("✅ AI Disposition Analysis complete:")
  console.log("  - Disposition:", disposition)
  console.log("  - Confidence:", confidence)
  console.log("  - AI Enhanced:", aiEnhanced)

  return {
    disposition,
    confidence: Math.min(95, confidence),
    reasoning,
    nextSteps,
    escalationReason,
    transferDepartment,
    aiEnhanced,
    sentimentImpact: sentimentData.length > 0 ? analyzeSentimentImpact(sentimentData) : undefined,
  }
}

// Helper functions for AI-enhanced analysis

function mapDeepgramIntentToCategory(
  deepgramIntent: string,
  transcript: string,
): { category: IntentKey; confidence: number } | null {
  const intent = deepgramIntent?.toLowerCase() || ""

  const mappings = [
    { patterns: ["support", "help", "assistance", "problem", "issue", "trouble"], category: "SUPPORT" as IntentKey },
    { patterns: ["sales", "buy", "purchase", "pricing", "quote", "demo"], category: "SALES" as IntentKey },
    { patterns: ["billing", "payment", "invoice", "charge", "refund"], category: "BILLING" as IntentKey },
    { patterns: ["complaint", "complain", "dissatisfied", "unhappy"], category: "COMPLAINT" as IntentKey },
    { patterns: ["information", "inquiry", "question", "general"], category: "INFORMATION" as IntentKey },
    { patterns: ["cancel", "cancellation", "leave", "retention"], category: "RETENTION" as IntentKey },
    { patterns: ["onboard", "setup", "new customer", "getting started"], category: "ONBOARDING" as IntentKey },
  ]

  for (const mapping of mappings) {
    if (mapping.patterns.some((pattern) => intent.includes(pattern))) {
      return { category: mapping.category, confidence: 80 }
    }
  }

  return null
}

function enhanceIntentWithTopics(
  topics: any[],
  currentIntent: IntentKey,
): { enhanced: boolean; intent: IntentKey; confidence: number; topics: string[] } {
  const topicTexts = topics.map((t) => t.topic?.toLowerCase() || "")

  const topicMappings = [
    { keywords: ["technical", "support", "help", "problem", "issue"], intent: "SUPPORT" as IntentKey, confidence: 85 },
    { keywords: ["sales", "purchase", "buy", "pricing", "product"], intent: "SALES" as IntentKey, confidence: 85 },
    { keywords: ["billing", "payment", "invoice", "subscription"], intent: "BILLING" as IntentKey, confidence: 85 },
    {
      keywords: ["complaint", "dissatisfaction", "problem", "issue"],
      intent: "COMPLAINT" as IntentKey,
      confidence: 80,
    },
    { keywords: ["cancel", "cancellation", "retention", "leave"], intent: "RETENTION" as IntentKey, confidence: 85 },
    { keywords: ["onboarding", "setup", "new", "getting started"], intent: "ONBOARDING" as IntentKey, confidence: 80 },
  ]

  for (const mapping of topicMappings) {
    const matchingTopics = topicTexts.filter((topic) => mapping.keywords.some((keyword) => topic.includes(keyword)))

    if (matchingTopics.length > 0) {
      return {
        enhanced: true,
        intent: mapping.intent,
        confidence: mapping.confidence,
        topics: matchingTopics,
      }
    }
  }

  return { enhanced: false, intent: currentIntent, confidence: 60, topics: [] }
}

function performAdvancedKeywordAnalysis(text: string): {
  intent: IntentKey
  confidence: number
  matchedKeywords: string[]
} {
  const intentScores: Record<IntentKey, { score: number; keywords: string[] }> = {} as any

  // Initialize scores
  Object.keys(CALL_INTENTS).forEach((intent) => {
    intentScores[intent as IntentKey] = { score: 0, keywords: [] }
  })

  // Advanced scoring with context and weights
  Object.entries(CALL_INTENTS).forEach(([intentKey, intentData]) => {
    const intent = intentKey as IntentKey

    intentData.keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        // Context-based weighting
        let weight = 1.0

        // Higher weight for exact phrases
        if (keyword.includes(" ")) weight *= 1.5

        // Higher weight for problem-solving language
        if (["resolve", "fix", "solution", "help"].includes(keyword)) weight *= 1.3

        // Higher weight for business language
        if (["purchase", "buy", "pricing", "quote"].includes(keyword)) weight *= 1.4

        intentScores[intent].score += weight
        intentScores[intent].keywords.push(keyword)
      }
    })
  })

  // Find highest scoring intent
  const topIntent = Object.entries(intentScores).sort(([, a], [, b]) => b.score - a.score)[0]

  const confidence = Math.min(95, Math.max(60, Math.round(topIntent[1].score * 15 + 50)))

  return {
    intent: topIntent[0] as IntentKey,
    confidence,
    matchedKeywords: topIntent[1].keywords.slice(0, 5),
  }
}

function enhanceIntentWithSentiment(
  sentimentData: any[],
  intent: IntentKey,
  text: string,
): { confidence: number; adjusted: boolean; reason: string } {
  const avgSentiment = sentimentData.reduce((sum, seg) => sum + (seg.sentiment_score || 0), 0) / sentimentData.length

  let confidence = 70
  let adjusted = false
  let reason = ""

  // Negative sentiment often indicates complaints or problems
  if (avgSentiment < -0.3 && intent !== "COMPLAINT") {
    if (text.includes("problem") || text.includes("issue")) {
      confidence = 85
      adjusted = true
      reason = "Strong negative sentiment with problem indicators"
    }
  }

  // Positive sentiment with sales keywords
  if (avgSentiment > 0.2 && intent === "SALES") {
    confidence = 90
    adjusted = true
    reason = "Positive sentiment supports sales intent"
  }

  return { confidence, adjusted, reason }
}

function determineSubcategoryWithAI(intent: IntentKey, text: string, topics: any[]): string {
  const intentConfig = CALL_INTENTS[intent]
  const topicTexts = topics.map((t) => t.topic?.toLowerCase() || "").join(" ")

  // AI-enhanced subcategory detection
  const subcategoryMappings: Record<IntentKey, Record<string, string[]>> = {
    SUPPORT: {
      "Technical Problems": ["technical", "bug", "error", "broken", "not working"],
      "Account Issues": ["account", "login", "password", "access"],
      "Feature Questions": ["feature", "how to", "tutorial", "guide"],
      "Service Outage": ["outage", "down", "offline", "unavailable"],
    },
    SALES: {
      "Pricing Questions": ["price", "cost", "pricing", "expensive"],
      "Demo Request": ["demo", "demonstration", "show me", "trial"],
      "Product Information": ["product", "features", "benefits", "comparison"],
      "Upgrade Inquiry": ["upgrade", "plan", "tier", "premium"],
    },
    BILLING: {
      "Payment Issues": ["payment", "card", "declined", "failed"],
      "Refund Request": ["refund", "money back", "return", "cancel"],
      "Invoice Inquiry": ["invoice", "bill", "statement", "charge"],
      "Plan Changes": ["change plan", "upgrade", "downgrade", "modify"],
    },
    COMPLAINT: {
      "Service Quality": ["service", "quality", "poor", "bad"],
      "Agent Behavior": ["agent", "representative", "rude", "unhelpful"],
      "Product Issues": ["product", "doesn't work", "defective", "broken"],
      "Escalation Request": ["manager", "supervisor", "escalate", "higher up"],
    },
    INFORMATION: {
      "General Inquiry": ["information", "question", "wondering", "curious"],
      "Hours of Operation": ["hours", "open", "closed", "schedule"],
      "Contact Information": ["contact", "phone", "email", "address"],
      "Policy Questions": ["policy", "terms", "conditions", "rules"],
    },
    ONBOARDING: {
      "New Customer Setup": ["new customer", "just signed up", "getting started"],
      "Account Activation": ["activate", "activation", "enable", "turn on"],
      "Initial Configuration": ["setup", "configure", "install", "initial"],
    },
    RETENTION: {
      "Cancellation Request": ["cancel", "cancellation", "close account"],
      "Competitor Comparison": ["competitor", "cheaper", "better deal"],
      "Retention Offer": ["discount", "offer", "deal", "special price"],
    },
  }

  const mappings = subcategoryMappings[intent] || {}
  const combinedText = `${text} ${topicTexts}`

  for (const [subcategory, keywords] of Object.entries(mappings)) {
    if (keywords.some((keyword) => combinedText.includes(keyword))) {
      return subcategory
    }
  }

  return intentConfig.subcategories[0] || "General"
}

function extractRelevantKeywords(text: string, intent: IntentKey, topics: any[]): string[] {
  const intentKeywords = CALL_INTENTS[intent].keywords.filter((keyword) => text.includes(keyword))
  const topicKeywords = topics.map((t) => t.topic).filter(Boolean)

  return [...new Set([...intentKeywords, ...topicKeywords])].slice(0, 8)
}

function detectSecondaryIntent(text: string, primaryIntent: IntentKey, deepgramIntents: any[]): IntentKey | undefined {
  // Look for secondary patterns
  const intentScores: Record<IntentKey, number> = {} as any

  Object.entries(CALL_INTENTS).forEach(([intentKey, intentData]) => {
    if (intentKey === primaryIntent) return

    const matches = intentData.keywords.filter((keyword) => text.includes(keyword)).length
    if (matches > 0) {
      intentScores[intentKey as IntentKey] = matches
    }
  })

  const topSecondary = Object.entries(intentScores).sort(([, a], [, b]) => b - a)[0]

  return topSecondary && topSecondary[1] > 1 ? (topSecondary[0] as IntentKey) : undefined
}

function calculateDispositionScores(text: string, sentimentData: any[]): Record<DispositionKey, number> {
  const scores: Record<DispositionKey, number> = {} as any

  Object.entries(CALL_DISPOSITIONS).forEach(([dispositionKey, dispositionData]) => {
    const disposition = dispositionKey as DispositionKey
    let score = 0

    dispositionData.indicators.forEach((indicator) => {
      if (text.includes(indicator)) {
        score += 1
        // Boost score for exact matches
        if (text.includes(` ${indicator} `) || text.startsWith(indicator) || text.endsWith(indicator)) {
          score += 0.5
        }
      }
    })

    scores[disposition] = score
  })

  return scores
}

function adjustDispositionWithSentiment(
  disposition: DispositionKey,
  sentimentData: any[],
): { confidence: number; reason: string } {
  const avgSentiment = sentimentData.reduce((sum, seg) => sum + (seg.sentiment_score || 0), 0) / sentimentData.length

  let confidence = 70
  let reason = "sentiment analysis"

  // Positive sentiment supports resolution
  if (disposition === "RESOLVED" && avgSentiment > 0.2) {
    confidence = 90
    reason = "positive sentiment confirms resolution"
  }

  // Negative sentiment may indicate escalation need
  if (avgSentiment < -0.3 && disposition !== "ESCALATED") {
    confidence = Math.max(confidence, 75)
    reason = "negative sentiment suggests potential escalation"
  }

  return { confidence, reason }
}

function refineDispositionWithIntent(
  disposition: DispositionKey,
  intentAnalysis: IntentAnalysis,
): { adjusted: boolean; disposition: DispositionKey; confidence: number; reason: string } {
  // Sales intents with positive outcomes often convert
  if (intentAnalysis.primaryIntent === "SALES" && disposition === "RESOLVED") {
    return {
      adjusted: true,
      disposition: "CONVERTED",
      confidence: 85,
      reason: "sales intent with positive resolution suggests conversion",
    }
  }

  // Complaints often need escalation
  if (intentAnalysis.primaryIntent === "COMPLAINT" && disposition === "NO_RESOLUTION") {
    return {
      adjusted: true,
      disposition: "ESCALATED",
      confidence: 80,
      reason: "complaint without resolution typically requires escalation",
    }
  }

  return { adjusted: false, disposition, confidence: 70, reason: "" }
}

function generateContextualNextSteps(
  disposition: DispositionKey,
  intentAnalysis: IntentAnalysis,
  businessConversion: any,
): string[] {
  const baseSteps = {
    RESOLVED: ["Send follow-up survey", "Update ticket status to closed", "Document resolution"],
    ESCALATED: ["Create escalation ticket", "Brief senior agent", "Schedule callback within 24 hours"],
    FOLLOW_UP: ["Create follow-up task", "Set reminder for agent", "Update customer on timeline"],
    TRANSFERRED: ["Ensure warm transfer completed", "Update transfer log", "Follow up on outcome"],
    CONVERTED: ["Process order", "Send confirmation", "Schedule onboarding call"],
    CALLBACK: ["Schedule callback in system", "Send confirmation to customer", "Prepare callback notes"],
    ABANDONED: ["Attempt callback within 2 hours", "Send follow-up email", "Document partial resolution"],
    NO_RESOLUTION: ["Review call for QA", "Consider alternative solutions", "Schedule follow-up"],
  }

  const steps = baseSteps[disposition] || []

  // Add intent-specific steps
  if (intentAnalysis.primaryIntent === "SALES" && disposition !== "CONVERTED") {
    steps.push("Review sales opportunity", "Update CRM with lead status")
  }

  if (intentAnalysis.primaryIntent === "SUPPORT" && disposition === "RESOLVED") {
    steps.push("Update knowledge base if needed", "Check for related issues")
  }

  return steps
}

function determineEscalationReason(text: string, intentAnalysis: IntentAnalysis): string {
  if (text.includes("manager") || text.includes("supervisor")) {
    return "Customer requested manager/supervisor"
  }

  if (intentAnalysis.primaryIntent === "COMPLAINT") {
    return "Customer complaint requiring management attention"
  }

  if (text.includes("complex") || text.includes("technical")) {
    return "Complex technical issue requiring specialist knowledge"
  }

  return "Issue complexity requires higher-level support"
}

function identifyTransferDepartment(text: string, intentAnalysis: IntentAnalysis): string {
  if (text.includes("billing") || intentAnalysis.primaryIntent === "BILLING") {
    return "Billing Department"
  }

  if (text.includes("sales") || intentAnalysis.primaryIntent === "SALES") {
    return "Sales Team"
  }

  if (text.includes("technical") || intentAnalysis.primaryIntent === "SUPPORT") {
    return "Technical Support"
  }

  return "Appropriate Department"
}

function analyzeSentimentImpact(sentimentData: any[]): string {
  const avgSentiment = sentimentData.reduce((sum, seg) => sum + (seg.sentiment_score || 0), 0) / sentimentData.length

  if (avgSentiment > 0.3) return "Positive sentiment throughout call"
  if (avgSentiment < -0.3) return "Negative sentiment detected - customer satisfaction at risk"
  return "Neutral sentiment maintained"
}

// Legacy function for backward compatibility
export function detectCallIntent(transcript: string): IntentAnalysis {
  return detectCallIntentWithAI(transcript, [], [], [])
}

export function detectCallDisposition(transcript: string, analysis: any): DispositionAnalysis {
  return detectCallDispositionWithAI(transcript, analysis.intentAnalysis || {}, [], analysis.businessConversion)
}

export function analyzeCallMetrics(transcript: string) {
  // Keep existing implementation
  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return {
      talkTime: { agent: 50, customer: 50 },
      interruptionCount: 0,
      silenceDuration: 0,
      averageResponseTime: 5,
      questionCount: 0,
      acknowledgmentCount: 0,
    }
  }

  const lines = transcript.split("\n").filter((line) => line.trim())
  const agentLines = lines.filter((line) => /^agent:/i.test(line.trim()))
  const customerLines = lines.filter((line) => /^customer:/i.test(line.trim()))

  const totalLines = agentLines.length + customerLines.length
  const agentTalkTime = totalLines > 0 ? Math.round((agentLines.length / totalLines) * 100) : 50
  const customerTalkTime = 100 - agentTalkTime

  const interruptionCount = Math.max(0, (transcript.match(/--|\[interruption\]|\[overlap\]/gi) || []).length)
  const avgLineLength = transcript.length / Math.max(1, lines.length)
  const silenceDuration = Math.max(0, Math.min(60, Math.round(10 + avgLineLength / 50)))
  const averageResponseTime = Math.max(1, Math.min(15, Math.round(3 + Math.random() * 8)))
  const questionCount = (transcript.match(/\?/g) || []).length
  const acknowledgmentPattern =
    /\b(yes|yeah|okay|ok|sure|understood|got it|right|exactly|absolutely|correct|indeed)\b/gi
  const acknowledgmentCount = (transcript.match(acknowledgmentPattern) || []).length

  return {
    talkTime: {
      agent: Math.max(0, Math.min(100, agentTalkTime)),
      customer: Math.max(0, Math.min(100, customerTalkTime)),
    },
    interruptionCount,
    silenceDuration,
    averageResponseTime,
    questionCount,
    acknowledgmentCount,
  }
}
