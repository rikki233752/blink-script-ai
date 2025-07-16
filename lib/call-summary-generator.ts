import type { IntentAnalysis, DispositionAnalysis, CallMetrics } from "./intent-disposition-utils"
import type { SentimentAnalysis } from "./sentiment-analysis"
import type { PreciseScoring } from "./precise-scoring"

export interface CallSummary {
  id: string
  callId: string
  generatedAt: string

  // Core Summary
  shortSummary: string
  executiveSummary: string

  // Call Details
  callDetails: {
    duration: string
    participants: {
      agent: string
      customer: string
    }
    callType: string
    primaryIntent: string
    disposition: string
    outcome: "successful" | "needs_follow_up" | "escalated" | "unresolved"
  }

  // Content Analysis
  topicsCovered: Array<{
    topic: string
    importance: "high" | "medium" | "low"
    timeSpent: string
    keyPoints: string[]
  }>

  // Key Insights
  keyTakeaways: Array<{
    category: "positive" | "concern" | "opportunity" | "action_required"
    insight: string
    impact: "high" | "medium" | "low"
    recommendation?: string
  }>

  // Call Conclusion
  callConclusion: {
    resolutionStatus: string
    customerSatisfaction: "satisfied" | "neutral" | "dissatisfied" | "unknown"
    agentPerformance: "excellent" | "good" | "satisfactory" | "needs_improvement"
    businessOutcome: string
    nextSteps: string[]
  }

  // Follow-up Items
  followUpItems: Array<{
    id: string
    type: "callback" | "email" | "task" | "escalation" | "documentation"
    priority: "urgent" | "high" | "medium" | "low"
    description: string
    assignedTo: string
    dueDate: string
    status: "pending" | "in_progress" | "completed"
  }>

  // Performance Metrics
  performanceHighlights: {
    strengths: string[]
    improvementAreas: string[]
    overallScore: number
    rating: "excellent" | "good" | "satisfactory" | "needs_improvement"
  }

  // Business Intelligence
  businessInsights: {
    conversionOpportunity: boolean
    customerValue: "high" | "medium" | "low"
    riskFactors: string[]
    opportunities: string[]
  }
}

export interface CallAnalysisData {
  transcript: string
  fileName: string
  fileSize: number
  duration: number
  analysis: {
    overallRating: "GOOD" | "BAD" | "UGLY"
    overallScore: number
    intentAnalysis?: IntentAnalysis
    dispositionAnalysis?: DispositionAnalysis
    sentimentAnalysis?: SentimentAnalysis
    preciseScoring?: PreciseScoring
    callMetrics?: CallMetrics
    businessConversion?: any
    agentPerformance?: any
    keyInsights?: string[]
    improvementSuggestions?: string[]
  }
}

export class CallSummaryGenerator {
  /**
   * Generate a comprehensive call summary from analysis data
   */
  static generateCallSummary(data: CallAnalysisData): CallSummary {
    const callId = `call_${Date.now()}`
    const timestamp = new Date().toISOString()

    console.log("🔍 Generating comprehensive call summary...")

    // Extract key information
    const duration = this.formatDuration(data.duration)
    const agent = this.extractAgentName(data.transcript, data.fileName)
    const customer = this.extractCustomerName(data.transcript, data.fileName)

    // Generate core summaries
    const shortSummary = this.generateShortSummary(data)
    const executiveSummary = this.generateExecutiveSummary(data)

    // Analyze topics covered
    const topicsCovered = this.analyzeTopicsCovered(data)

    // Extract key takeaways
    const keyTakeaways = this.extractKeyTakeaways(data)

    // Determine call conclusion
    const callConclusion = this.determineCallConclusion(data)

    // Generate follow-up items
    const followUpItems = this.generateFollowUpItems(data)

    // Performance highlights
    const performanceHighlights = this.generatePerformanceHighlights(data)

    // Business insights
    const businessInsights = this.generateBusinessInsights(data)

    const summary: CallSummary = {
      id: `summary_${callId}`,
      callId,
      generatedAt: timestamp,
      shortSummary,
      executiveSummary,
      callDetails: {
        duration,
        participants: { agent, customer },
        callType: data.analysis.intentAnalysis?.primaryIntent || "General Inquiry",
        primaryIntent: data.analysis.intentAnalysis?.primaryIntent || "Unknown",
        disposition: data.analysis.dispositionAnalysis?.disposition || "Unknown",
        outcome: this.determineOutcome(data),
      },
      topicsCovered,
      keyTakeaways,
      callConclusion,
      followUpItems,
      performanceHighlights,
      businessInsights,
    }

    console.log("✅ Call summary generated successfully")
    return summary
  }

  /**
   * Generate a concise short summary
   */
  private static generateShortSummary(data: CallAnalysisData): string {
    const intent = data.analysis.intentAnalysis?.primaryIntent || "general inquiry"
    const disposition = data.analysis.dispositionAnalysis?.disposition || "unknown"
    const rating = data.analysis.overallRating?.toLowerCase() || "satisfactory"
    const conversion = data.analysis.businessConversion?.conversionAchieved
      ? "with successful conversion"
      : "without conversion"

    return `${this.formatDuration(data.duration)} ${intent.toLowerCase()} call handled with ${rating} performance, resulting in ${disposition.toLowerCase().replace(/_/g, " ")} ${conversion}.`
  }

  /**
   * Generate detailed executive summary
   */
  private static generateExecutiveSummary(data: CallAnalysisData): string {
    const parts = []

    // Call overview
    const intent = data.analysis.intentAnalysis?.primaryIntent || "General"
    const subcategory = data.analysis.intentAnalysis?.subcategory || "Inquiry"
    parts.push(
      `This ${this.formatDuration(data.duration)} call involved a ${intent.toLowerCase()} request specifically related to ${subcategory.toLowerCase()}.`,
    )

    // Performance summary
    const score = data.analysis.overallScore || 5
    const rating = data.analysis.overallRating || "BAD"
    parts.push(`The agent demonstrated ${rating.toLowerCase()} performance with an overall score of ${score}/10.`)

    // Sentiment analysis
    if (data.analysis.sentimentAnalysis) {
      const agentSentiment = data.analysis.sentimentAnalysis.agentSentiment?.overall || "neutral"
      const customerSentiment = data.analysis.sentimentAnalysis.customerSentiment?.overall || "neutral"
      parts.push(
        `Agent maintained ${agentSentiment.toLowerCase()} sentiment while customer exhibited ${customerSentiment.toLowerCase()} sentiment throughout the interaction.`,
      )
    }

    // Business outcome
    if (data.analysis.businessConversion?.conversionAchieved) {
      parts.push(
        `The call resulted in a successful business outcome with ${data.analysis.businessConversion.conversionType}.`,
      )
    } else {
      parts.push("No immediate business conversion was achieved during this interaction.")
    }

    // Key insights
    if (data.analysis.keyInsights && data.analysis.keyInsights.length > 0) {
      parts.push(`Key insights include: ${data.analysis.keyInsights.slice(0, 2).join(", ")}.`)
    }

    return parts.join(" ")
  }

  /**
   * Analyze topics covered during the call
   */
  private static analyzeTopicsCovered(data: CallAnalysisData): CallSummary["topicsCovered"] {
    const topics: CallSummary["topicsCovered"] = []
    const transcript = data.transcript.toLowerCase()

    // Define topic categories with keywords
    const topicCategories = {
      "Product Information": {
        keywords: ["product", "feature", "specification", "details", "information", "how it works"],
        importance: "high" as const,
      },
      "Pricing & Billing": {
        keywords: ["price", "cost", "billing", "payment", "invoice", "charge", "fee"],
        importance: "high" as const,
      },
      "Technical Support": {
        keywords: ["problem", "issue", "error", "bug", "not working", "technical", "troubleshoot"],
        importance: "high" as const,
      },
      "Account Management": {
        keywords: ["account", "profile", "settings", "password", "login", "access"],
        importance: "medium" as const,
      },
      "Service Quality": {
        keywords: ["service", "quality", "experience", "satisfaction", "feedback"],
        importance: "medium" as const,
      },
      "Complaints & Issues": {
        keywords: ["complaint", "problem", "dissatisfied", "unhappy", "frustrated"],
        importance: "high" as const,
      },
      "Sales & Upgrades": {
        keywords: ["upgrade", "purchase", "buy", "sale", "offer", "deal"],
        importance: "high" as const,
      },
      "General Inquiry": {
        keywords: ["question", "information", "help", "assistance", "inquiry"],
        importance: "low" as const,
      },
    }

    // Analyze each topic category
    Object.entries(topicCategories).forEach(([topic, config]) => {
      const matchCount = config.keywords.filter((keyword) => transcript.includes(keyword)).length

      if (matchCount > 0) {
        // Extract key points for this topic
        const keyPoints = this.extractTopicKeyPoints(transcript, config.keywords)

        // Estimate time spent (simplified calculation)
        const timeSpent = this.estimateTopicTime(data.duration, matchCount, topics.length)

        topics.push({
          topic,
          importance: config.importance,
          timeSpent,
          keyPoints: keyPoints.slice(0, 3), // Limit to top 3 points
        })
      }
    })

    // Sort by importance and match count
    return topics
      .sort((a, b) => {
        const importanceOrder = { high: 3, medium: 2, low: 1 }
        return importanceOrder[b.importance] - importanceOrder[a.importance]
      })
      .slice(0, 5) // Limit to top 5 topics
  }

  /**
   * Extract key takeaways from the call based on actual transcript content
   */
  private static extractKeyTakeaways(data: CallAnalysisData): CallSummary["keyTakeaways"] {
    const takeaways: CallSummary["keyTakeaways"] = []
    const transcript = data.transcript.toLowerCase()
    const analysis = data.analysis

    console.log("🔍 Extracting real takeaways from transcript...")

    // Extract specific facts and details from transcript
    const specificFacts = this.extractSpecificFacts(data.transcript)
    const customerNeeds = this.extractCustomerNeeds(data.transcript)
    const agentActions = this.extractAgentActions(data.transcript)
    const businessOpportunities = this.extractBusinessOpportunities(data.transcript, analysis)

    // Add specific facts as positive takeaways
    specificFacts.forEach((fact) => {
      takeaways.push({
        category: "positive",
        insight: fact,
        impact: "high",
      })
    })

    // Add customer needs and requirements
    customerNeeds.forEach((need) => {
      takeaways.push({
        category: "opportunity",
        insight: need,
        impact: "high",
        recommendation: "Follow up with detailed information and pricing",
      })
    })

    // Add business opportunities
    businessOpportunities.forEach((opportunity) => {
      takeaways.push({
        category: "opportunity",
        insight: opportunity,
        impact: "high",
        recommendation: "Schedule follow-up to close the opportunity",
      })
    })

    // Extract sentiment-based takeaways
    if (analysis.sentimentAnalysis?.customerSentiment?.overall === "Positive") {
      takeaways.push({
        category: "positive",
        insight: "Customer expressed positive sentiment throughout the conversation",
        impact: "high",
      })
    } else if (analysis.sentimentAnalysis?.customerSentiment?.overall === "Negative") {
      takeaways.push({
        category: "concern",
        insight: "Customer showed signs of dissatisfaction or frustration",
        impact: "high",
        recommendation: "Immediate follow-up required to address concerns and improve satisfaction",
      })
    }

    // Extract conversion-related takeaways
    if (analysis.businessConversion?.conversionAchieved) {
      takeaways.push({
        category: "positive",
        insight: `Successful conversion achieved: ${analysis.businessConversion.conversionType}`,
        impact: "high",
      })
    } else if (analysis.businessConversion?.positiveSignals?.length > 0) {
      takeaways.push({
        category: "opportunity",
        insight: "Strong conversion potential identified with clear buying signals",
        impact: "high",
        recommendation: "Schedule follow-up contact within 24-48 hours to maintain momentum",
      })
    }

    // Extract action items from transcript
    const actionItems = this.extractActionItems(data.transcript)
    actionItems.forEach((action) => {
      takeaways.push({
        category: "action_required",
        insight: action,
        impact: "high",
        recommendation: "Complete within specified timeframe",
      })
    })

    // Extract concerns from transcript
    const concerns = this.extractConcerns(data.transcript, analysis)
    concerns.forEach((concern) => {
      takeaways.push({
        category: "concern",
        insight: concern,
        impact: "medium",
        recommendation: "Address in next interaction",
      })
    })

    // Limit to most important takeaways (4-6 items)
    return takeaways
      .sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 }
        return impactOrder[b.impact] - impactOrder[a.impact]
      })
      .slice(0, 6)
  }

  /**
   * Extract specific facts and details mentioned in the call
   */
  private static extractSpecificFacts(transcript: string): string[] {
    const facts: string[] = []
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10)

    // Look for specific numbers, amounts, dates, names
    const factPatterns = [
      // Dollar amounts
      /\$[\d,]+(?:\.\d{2})?/g,
      // Percentages
      /\d+(?:\.\d+)?%/g,
      // Dates
      /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/gi,
      // Phone numbers
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      // Account numbers or IDs
      /(?:account|policy|id|number|plan)\s*:?\s*[a-z0-9]{6,}/gi,
      // Specific product names or plans
      /(?:plan|package|service|product)\s+[a-z0-9\s]{3,20}/gi,
    ]

    sentences.forEach((sentence) => {
      factPatterns.forEach((pattern) => {
        const matches = sentence.match(pattern)
        if (matches) {
          matches.forEach((match) => {
            const context = this.getContextAroundMatch(sentence, match)
            if (context && context.length > 20) {
              facts.push(context)
            }
          })
        }
      })

      // Look for eligibility statements
      if (sentence.toLowerCase().includes("eligible") || sentence.toLowerCase().includes("qualify")) {
        facts.push(sentence.trim())
      }

      // Look for enrollment information
      if (sentence.toLowerCase().includes("enrolled") || sentence.toLowerCase().includes("enrollment")) {
        facts.push(sentence.trim())
      }

      // Look for coverage information
      if (sentence.toLowerCase().includes("coverage") || sentence.toLowerCase().includes("covered")) {
        facts.push(sentence.trim())
      }
    })

    return facts.slice(0, 3) // Limit to top 3 facts
  }

  /**
   * Extract customer needs and requirements
   */
  private static extractCustomerNeeds(transcript: string): string[] {
    const needs: string[] = []
    const text = transcript.toLowerCase()

    const needIndicators = [
      "i need",
      "i want",
      "i require",
      "i'm looking for",
      "i would like",
      "can you help me",
      "i'm interested in",
      "do you have",
      "is there a way",
    ]

    const sentences = transcript.split(/[.!?]+/)

    sentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase()
      needIndicators.forEach((indicator) => {
        if (lowerSentence.includes(indicator)) {
          const cleanSentence = sentence.trim()
          if (cleanSentence.length > 20) {
            needs.push(`Customer expressed need: ${cleanSentence}`)
          }
        }
      })
    })

    return needs.slice(0, 2)
  }

  /**
   * Extract agent actions and commitments
   */
  private static extractAgentActions(transcript: string): string[] {
    const actions: string[] = []

    const actionIndicators = [
      "i will",
      "i'll",
      "let me",
      "i can",
      "i'll send",
      "i'll call",
      "i'll follow up",
      "i'll check",
      "i'll get back to you",
    ]

    const sentences = transcript.split(/[.!?]+/)

    sentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase()
      actionIndicators.forEach((indicator) => {
        if (lowerSentence.includes(indicator)) {
          const cleanSentence = sentence.trim()
          if (cleanSentence.length > 15) {
            actions.push(`Agent committed: ${cleanSentence}`)
          }
        }
      })
    })

    return actions.slice(0, 2)
  }

  /**
   * Extract business opportunities from transcript
   */
  private static extractBusinessOpportunities(transcript: string, analysis: any): string[] {
    const opportunities: string[] = []
    const text = transcript.toLowerCase()

    // Look for buying signals
    const buyingSignals = [
      "how much",
      "what does it cost",
      "pricing",
      "price",
      "when can i start",
      "sign up",
      "enroll",
      "interested",
      "sounds good",
      "that works",
    ]

    let buyingSignalCount = 0
    buyingSignals.forEach((signal) => {
      if (text.includes(signal)) {
        buyingSignalCount++
      }
    })

    if (buyingSignalCount >= 2) {
      opportunities.push("Multiple buying signals detected - customer shows strong purchase intent")
    }

    // Check for urgency indicators
    const urgencyIndicators = ["soon", "quickly", "asap", "urgent", "right away", "immediately"]
    const hasUrgency = urgencyIndicators.some((indicator) => text.includes(indicator))

    if (hasUrgency) {
      opportunities.push("Customer expressed urgency - opportunity for immediate conversion")
    }

    // Check for comparison shopping
    if (text.includes("compare") || text.includes("other options") || text.includes("competitors")) {
      opportunities.push("Customer is comparison shopping - emphasize unique value proposition")
    }

    return opportunities
  }

  /**
   * Extract action items that need follow-up
   */
  private static extractActionItems(transcript: string): string[] {
    const actionItems: string[] = []

    const actionPatterns = [
      /follow up.*?(?:in|within|by)\s+([^.!?]+)/gi,
      /call.*?(?:back|again).*?(?:in|within|by)\s+([^.!?]+)/gi,
      /send.*?(?:information|details|quote).*?(?:by|within)\s+([^.!?]+)/gi,
      /schedule.*?(?:appointment|meeting|call).*?(?:for|on)\s+([^.!?]+)/gi,
    ]

    actionPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          actionItems.push(`Schedule follow-up contact within specified timeframe: ${match.trim()}`)
        })
      }
    })

    // Look for general follow-up commitments
    if (transcript.toLowerCase().includes("follow up") || transcript.toLowerCase().includes("get back to you")) {
      actionItems.push("Schedule follow-up contact within 24-48 hours to maintain momentum")
    }

    return actionItems.slice(0, 2)
  }

  /**
   * Extract concerns or issues mentioned
   */
  private static extractConcerns(transcript: string, analysis: any): string[] {
    const concerns: string[] = []
    const text = transcript.toLowerCase()

    const concernIndicators = [
      "problem",
      "issue",
      "concern",
      "worried",
      "confused",
      "frustrated",
      "don't understand",
      "not sure",
      "hesitant",
      "doubt",
    ]

    const sentences = transcript.split(/[.!?]+/)

    sentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase()
      concernIndicators.forEach((indicator) => {
        if (lowerSentence.includes(indicator)) {
          const cleanSentence = sentence.trim()
          if (cleanSentence.length > 20) {
            concerns.push(`Customer concern identified: ${cleanSentence}`)
          }
        }
      })
    })

    return concerns.slice(0, 2)
  }

  /**
   * Get context around a matched pattern
   */
  private static getContextAroundMatch(sentence: string, match: string): string {
    const index = sentence.toLowerCase().indexOf(match.toLowerCase())
    if (index === -1) return sentence

    // Get some words before and after the match
    const words = sentence.split(" ")
    const matchWords = match.split(" ")
    const matchIndex = words.findIndex((word) => word.toLowerCase().includes(matchWords[0].toLowerCase()))

    if (matchIndex === -1) return sentence

    const start = Math.max(0, matchIndex - 3)
    const end = Math.min(words.length, matchIndex + matchWords.length + 3)

    return words.slice(start, end).join(" ")
  }

  /**
   * Determine call conclusion details
   */
  private static determineCallConclusion(data: CallAnalysisData): CallSummary["callConclusion"] {
    const disposition = data.analysis.dispositionAnalysis?.disposition || "NO_RESOLUTION"

    // Determine resolution status
    let resolutionStatus = "Unresolved"
    if (disposition === "RESOLVED") resolutionStatus = "Fully Resolved"
    else if (disposition === "FOLLOW_UP") resolutionStatus = "Requires Follow-up"
    else if (disposition === "ESCALATED") resolutionStatus = "Escalated"
    else if (disposition === "TRANSFERRED") resolutionStatus = "Transferred"

    // Determine customer satisfaction
    let customerSatisfaction: "satisfied" | "neutral" | "dissatisfied" | "unknown" = "unknown"
    if (data.analysis.sentimentAnalysis?.customerSentiment) {
      const sentiment = data.analysis.sentimentAnalysis.customerSentiment.overall
      if (sentiment === "Positive") customerSatisfaction = "satisfied"
      else if (sentiment === "Negative") customerSatisfaction = "dissatisfied"
      else customerSatisfaction = "neutral"
    }

    // Determine agent performance
    let agentPerformance: "excellent" | "good" | "satisfactory" | "needs_improvement" = "satisfactory"
    const score = data.analysis.overallScore || 5
    if (score >= 9) agentPerformance = "excellent"
    else if (score >= 7) agentPerformance = "good"
    else if (score >= 5) agentPerformance = "satisfactory"
    else agentPerformance = "needs_improvement"

    // Business outcome
    let businessOutcome = "No immediate business impact"
    if (data.analysis.businessConversion?.conversionAchieved) {
      businessOutcome = `Positive business outcome: ${data.analysis.businessConversion.conversionType}`
    }

    // Next steps
    const nextSteps = this.generateNextSteps(data)

    return {
      resolutionStatus,
      customerSatisfaction,
      agentPerformance,
      businessOutcome,
      nextSteps,
    }
  }

  /**
   * Generate follow-up items
   */
  private static generateFollowUpItems(data: CallAnalysisData): CallSummary["followUpItems"] {
    const items: CallSummary["followUpItems"] = []
    const disposition = data.analysis.dispositionAnalysis?.disposition

    // Generate follow-up items based on disposition and analysis
    if (disposition === "FOLLOW_UP" || disposition === "NO_RESOLUTION") {
      items.push({
        id: `followup_${Date.now()}_1`,
        type: "callback",
        priority: "high",
        description: "Schedule follow-up call to ensure issue resolution",
        assignedTo: "Original Agent",
        dueDate: this.getFollowUpDate(2), // 2 days from now
        status: "pending",
      })
    }

    if (disposition === "ESCALATED") {
      items.push({
        id: `followup_${Date.now()}_2`,
        type: "escalation",
        priority: "urgent",
        description: "Escalate to senior support team for complex issue resolution",
        assignedTo: "Senior Support Team",
        dueDate: this.getFollowUpDate(1), // 1 day from now
        status: "pending",
      })
    }

    if (data.analysis.businessConversion && !data.analysis.businessConversion.conversionAchieved) {
      items.push({
        id: `followup_${Date.now()}_3`,
        type: "email",
        priority: "medium",
        description: "Send follow-up email with additional product information",
        assignedTo: "Sales Team",
        dueDate: this.getFollowUpDate(3), // 3 days from now
        status: "pending",
      })
    }

    if (data.analysis.sentimentAnalysis?.customerSentiment?.overall === "Negative") {
      items.push({
        id: `followup_${Date.now()}_4`,
        type: "task",
        priority: "high",
        description: "Customer satisfaction recovery - personal outreach required",
        assignedTo: "Customer Success Manager",
        dueDate: this.getFollowUpDate(1), // 1 day from now
        status: "pending",
      })
    }

    // Documentation follow-up
    if (data.analysis.overallScore && data.analysis.overallScore < 6) {
      items.push({
        id: `followup_${Date.now()}_5`,
        type: "documentation",
        priority: "medium",
        description: "Document call for quality assurance and training purposes",
        assignedTo: "QA Team",
        dueDate: this.getFollowUpDate(5), // 5 days from now
        status: "pending",
      })
    }

    return items.slice(0, 4) // Limit to top 4 items
  }

  /**
   * Generate performance highlights
   */
  private static generatePerformanceHighlights(data: CallAnalysisData): CallSummary["performanceHighlights"] {
    const strengths: string[] = []
    const improvementAreas: string[] = []

    // Analyze agent performance
    const agentPerf = data.analysis.agentPerformance
    if (agentPerf) {
      if (agentPerf.communicationSkills >= 7) {
        strengths.push("Excellent communication skills demonstrated")
      } else if (agentPerf.communicationSkills < 6) {
        improvementAreas.push("Communication clarity needs improvement")
      }

      if (agentPerf.problemSolving >= 7) {
        strengths.push("Strong problem-solving approach")
      } else if (agentPerf.problemSolving < 6) {
        improvementAreas.push("Problem-solving methodology needs enhancement")
      }

      if (agentPerf.customerService >= 7) {
        strengths.push("Outstanding customer service delivery")
      } else if (agentPerf.customerService < 6) {
        improvementAreas.push("Customer service approach requires attention")
      }
    }

    // Add insights from analysis
    if (data.analysis.keyInsights) {
      strengths.push(...data.analysis.keyInsights.slice(0, 2))
    }

    if (data.analysis.improvementSuggestions) {
      improvementAreas.push(...data.analysis.improvementSuggestions.slice(0, 2))
    }

    // Determine overall rating
    const score = data.analysis.overallScore || 5
    let rating: "excellent" | "good" | "satisfactory" | "needs_improvement" = "satisfactory"
    if (score >= 9) rating = "excellent"
    else if (score >= 7) rating = "good"
    else if (score >= 5) rating = "satisfactory"
    else rating = "needs_improvement"

    return {
      strengths: strengths.slice(0, 4),
      improvementAreas: improvementAreas.slice(0, 4),
      overallScore: score,
      rating,
    }
  }

  /**
   * Generate business insights
   */
  private static generateBusinessInsights(data: CallAnalysisData): CallSummary["businessInsights"] {
    const conversion = data.analysis.businessConversion
    const sentiment = data.analysis.sentimentAnalysis

    // Determine conversion opportunity
    const conversionOpportunity =
      !conversion?.conversionAchieved &&
      (data.analysis.intentAnalysis?.primaryIntent === "SALES" || sentiment?.customerSentiment?.overall === "Positive")

    // Determine customer value
    let customerValue: "high" | "medium" | "low" = "medium"
    if (conversion?.conversionAchieved) customerValue = "high"
    else if (sentiment?.customerSentiment?.overall === "Positive") customerValue = "medium"
    else customerValue = "low"

    // Identify risk factors
    const riskFactors: string[] = []
    if (sentiment?.customerSentiment?.overall === "Negative") {
      riskFactors.push("Customer dissatisfaction risk")
    }
    if (data.analysis.dispositionAnalysis?.disposition === "NO_RESOLUTION") {
      riskFactors.push("Unresolved issue may impact customer retention")
    }
    if (data.analysis.overallScore && data.analysis.overallScore < 6) {
      riskFactors.push("Poor service experience may affect brand perception")
    }

    // Identify opportunities
    const opportunities: string[] = []
    if (conversionOpportunity) {
      opportunities.push("Potential sales opportunity identified")
    }
    if (sentiment?.customerSentiment?.overall === "Positive") {
      opportunities.push("Positive customer experience - opportunity for upselling")
    }
    if (data.analysis.intentAnalysis?.primaryIntent === "INFORMATION") {
      opportunities.push("Educational opportunity to build customer knowledge")
    }

    return {
      conversionOpportunity,
      customerValue,
      riskFactors: riskFactors.slice(0, 3),
      opportunities: opportunities.slice(0, 3),
    }
  }

  // Helper methods
  private static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) return `${remainingSeconds} seconds`
    if (remainingSeconds === 0) return `${minutes} minutes`
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  private static extractAgentName(transcript: string, fileName: string): string {
    // Try to extract from transcript with better patterns
    const agentPatterns = [
      /(?:this is|my name is|i'm|i am)\s+([a-zA-Z]+).*(?:calling|representative|agent|coordinator)/i,
      /(?:agent|representative|coordinator|specialist)\s+([a-zA-Z]+)/i,
      /(?:hi.*this is|hello.*this is)\s+([a-zA-Z]+)/i,
      /^.*?(?:this is|i'm|my name is)\s+([a-zA-Z]+).*?(?:from|with|calling)/i,
    ]

    for (const pattern of agentPatterns) {
      const match = transcript.match(pattern)
      if (match && match[1] && match[1].length > 1) {
        return match[1].trim()
      }
    }

    // Look for the first person speaking (usually agent)
    const firstSpeakerMatch = transcript.match(/^[^.!?]*?(?:this is|i'm|my name is)\s+([a-zA-Z]+)/i)
    if (firstSpeakerMatch && firstSpeakerMatch[1]) {
      return firstSpeakerMatch[1].trim()
    }

    // Try to extract from filename
    const fileMatch = fileName.match(/agent[_-]([a-zA-Z]+)/i)
    if (fileMatch) return fileMatch[1]

    return "Agent"
  }

  private static extractCustomerName(transcript: string, fileName: string): string {
    // Look for customer introducing themselves later in conversation
    const customerPatterns = [
      /(?:customer|prospect|caller).*?(?:my name is|i'm|i am)\s+([a-zA-Z]+)/i,
      /(?:speaking with|talking to)\s+([a-zA-Z]+)/i,
      /(?:mr|mrs|ms|miss)\s+([a-zA-Z]+)/i,
      // Look for names mentioned after agent introduction
      /(?:this is|i'm|my name is)\s+[a-zA-Z]+.*?(?:speaking with|for)\s+([a-zA-Z]+)/i,
      // Look for second person mentioning their name
      /(?:yes.*?(?:this is|i'm|my name is)|and you are|your name)\s+([a-zA-Z]+)/i,
    ]

    for (const pattern of customerPatterns) {
      const match = transcript.match(pattern)
      if (match && match[1] && match[1].length > 1) {
        return match[1].trim()
      }
    }

    // Try to extract from filename
    const fileMatch = fileName.match(/customer[_-]([a-zA-Z]+)/i)
    if (fileMatch) return fileMatch[1]

    return "Customer"
  }

  private static determineOutcome(
    data: CallAnalysisData,
  ): "successful" | "needs_follow_up" | "escalated" | "unresolved" {
    const disposition = data.analysis.dispositionAnalysis?.disposition

    if (disposition === "RESOLVED" || data.analysis.businessConversion?.conversionAchieved) {
      return "successful"
    } else if (disposition === "ESCALATED") {
      return "escalated"
    } else if (disposition === "FOLLOW_UP") {
      return "needs_follow_up"
    } else {
      return "unresolved"
    }
  }

  private static extractTopicKeyPoints(transcript: string, keywords: string[]): string[] {
    const points: string[] = []
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10)

    sentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase()
      if (keywords.some((keyword) => lowerSentence.includes(keyword))) {
        points.push(sentence.trim())
      }
    })

    return points.slice(0, 3)
  }

  private static estimateTopicTime(totalDuration: number, matchCount: number, totalTopics: number): string {
    const estimatedSeconds = Math.round((totalDuration * matchCount) / Math.max(totalTopics * 3, 1))
    return this.formatDuration(estimatedSeconds)
  }

  private static generateNextSteps(data: CallAnalysisData): string[] {
    const steps: string[] = []
    const disposition = data.analysis.dispositionAnalysis?.disposition

    if (disposition === "RESOLVED") {
      steps.push("Send follow-up satisfaction survey")
      steps.push("Update customer record with resolution details")
    } else if (disposition === "FOLLOW_UP") {
      steps.push("Schedule follow-up call within 48 hours")
      steps.push("Prepare additional resources for next interaction")
    } else if (disposition === "ESCALATED") {
      steps.push("Brief escalation team on issue details")
      steps.push("Ensure customer receives escalation confirmation")
    } else {
      steps.push("Review call for additional resolution options")
      steps.push("Consider alternative support channels")
    }

    return steps
  }

  private static getFollowUpDate(daysFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString().split("T")[0] // Return YYYY-MM-DD format
  }
}
