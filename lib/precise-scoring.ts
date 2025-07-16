export interface PreciseScoring {
  overallScore: number // Out of 100
  overallRating: "EXCELLENT" | "GOOD" | "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "POOR"

  // Core Performance Categories
  categoryScores: {
    communication: number
    empathy: number
    problemResolution: number
    professionalism: number
    productKnowledge: number
    callControl: number
    compliance: number
    customerSatisfaction: number
    businessAcumen: number
    adaptability: number
  }

  // Weighted Scoring Breakdown
  weightedScores: {
    communication: { score: number; weight: number; weightedScore: number; description: string }
    empathy: { score: number; weight: number; weightedScore: number; description: string }
    problemResolution: { score: number; weight: number; weightedScore: number; description: string }
    professionalism: { score: number; weight: number; weightedScore: number; description: string }
    productKnowledge: { score: number; weight: number; weightedScore: number; description: string }
    callControl: { score: number; weight: number; weightedScore: number; description: string }
    compliance: { score: number; weight: number; weightedScore: number; description: string }
    customerSatisfaction: { score: number; weight: number; weightedScore: number; description: string }
    businessAcumen: { score: number; weight: number; weightedScore: number; description: string }
    adaptability: { score: number; weight: number; weightedScore: number; description: string }
  }

  // Performance Benchmarks
  benchmarks: {
    teamAverage: number
    companyAverage: number
    industryAverage: number
    topPerformerAverage: number
    performanceRank: string
    percentile: number
    comparisonToGoal: {
      target: number
      variance: number
      status: "EXCEEDS" | "MEETS" | "BELOW"
    }
  }

  // Detailed Improvement Areas
  improvementAreas: Array<{
    category: string
    currentScore: number
    targetScore: number
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    impact: "HIGH" | "MEDIUM" | "LOW"
    recommendations: string[]
    specificActions: string[]
    timeframe: string
    resources: string[]
  }>

  // Strengths and Achievements
  strengths: Array<{
    category: string
    score: number
    description: string
    impact: string
  }>

  // Performance Trends
  trends: {
    lastCall: number
    last5Calls: number
    last30Days: number
    last90Days: number
    yearToDate: number
    improvement: "IMPROVING" | "DECLINING" | "STABLE" | "VOLATILE"
    trajectory: "UPWARD" | "DOWNWARD" | "FLAT"
    momentum: number
    consistency: number
  }

  // Quality Indicators
  qualityIndicators: {
    callEfficiency: number
    firstCallResolution: boolean
    customerRetention: number
    escalationRate: number
    complianceScore: number
    coachingReceptivity: number
  }

  // Coaching Insights
  coachingInsights: {
    readinessLevel: "READY" | "DEVELOPING" | "NEEDS_SUPPORT"
    focusAreas: string[]
    learningStyle: string
    motivationalFactors: string[]
    developmentPlan: {
      shortTerm: string[]
      mediumTerm: string[]
      longTerm: string[]
    }
  }

  // Business Impact
  businessImpact: {
    revenueImpact: number
    customerLifetimeValue: number
    conversionRate: number
    upsellSuccess: number
    customerSatisfactionImpact: number
    brandRepresentationScore: number
  }
}

interface CallData {
  overallScore: number
  agentPerformance: {
    communicationSkills: number
    problemSolving: number
    productKnowledge: number
    customerService: number
  }
  toneQuality?: {
    score: number
  }
  businessConversion?: {
    conversionAchieved: boolean
    conversionType?: string
    conversionConfidence?: number
  }
  sentimentAnalysis?: any
  callMetrics?: any
  intentAnalysis?: any
}

export function calculatePreciseScore(transcript: string, callData: CallData): PreciseScoring {
  const text = transcript.toLowerCase()

  console.log("🎯 Calculating OnScript-style precise scoring...")

  // Safely extract data with enhanced fallbacks
  const overallScore = callData?.overallScore || 5.0
  const agentPerformance = callData?.agentPerformance || {
    communicationSkills: 5.0,
    problemSolving: 5.0,
    productKnowledge: 5.0,
    customerService: 5.0,
  }
  const toneQuality = callData?.toneQuality || { score: 5.0 }
  const businessConversion = callData?.businessConversion || { conversionAchieved: false }

  // Enhanced scoring weights (must sum to 1.0)
  const weights = {
    communication: 0.18,
    empathy: 0.12,
    problemResolution: 0.15,
    professionalism: 0.12,
    productKnowledge: 0.1,
    callControl: 0.08,
    compliance: 0.08,
    customerSatisfaction: 0.1,
    businessAcumen: 0.04,
    adaptability: 0.03,
  }

  // Calculate enhanced category scores
  const categoryScores = {
    communication: calculateEnhancedCommunicationScore(text, agentPerformance, transcript),
    empathy: calculateEnhancedEmpathyScore(text, transcript),
    problemResolution: calculateEnhancedProblemResolutionScore(text, agentPerformance, businessConversion),
    professionalism: calculateEnhancedProfessionalismScore(text, transcript),
    productKnowledge: calculateEnhancedProductKnowledgeScore(text, agentPerformance, transcript),
    callControl: calculateEnhancedCallControlScore(text, transcript),
    compliance: calculateEnhancedComplianceScore(text, transcript),
    customerSatisfaction: calculateEnhancedCustomerSatisfactionScore(text, agentPerformance, toneQuality),
    businessAcumen: calculateBusinessAcumenScore(text, businessConversion, transcript),
    adaptability: calculateAdaptabilityScore(text, transcript),
  }

  // Calculate weighted scores with descriptions
  const weightedScores = Object.entries(categoryScores).reduce(
    (acc, [category, score]) => {
      const weight = weights[category as keyof typeof weights]
      const weightedScore = score * weight
      acc[category as keyof typeof categoryScores] = {
        score,
        weight,
        weightedScore,
        description: getCategoryDescription(category, score),
      }
      return acc
    },
    {} as PreciseScoring["weightedScores"],
  )

  // Calculate overall score
  const calculatedOverallScore = Math.round(
    Object.values(weightedScores).reduce((sum, item) => sum + item.weightedScore, 0),
  )

  // Determine enhanced rating
  const overallRating = determineEnhancedRating(calculatedOverallScore)

  // Generate enhanced benchmarks
  const benchmarks = generateEnhancedBenchmarks(calculatedOverallScore)

  // Identify detailed improvement areas
  const improvementAreas = identifyDetailedImprovementAreas(categoryScores, transcript)

  // Identify enhanced strengths
  const strengths = identifyEnhancedStrengths(categoryScores)

  // Generate comprehensive trends
  const trends = generateComprehensiveTrends(calculatedOverallScore)

  // Calculate quality indicators
  const qualityIndicators = calculateQualityIndicators(transcript, categoryScores, businessConversion)

  // Generate coaching insights
  const coachingInsights = generateCoachingInsights(categoryScores, transcript, improvementAreas)

  // Calculate business impact
  const businessImpact = calculateBusinessImpact(categoryScores, businessConversion, transcript)

  console.log("✅ OnScript-style precise scoring completed")

  return {
    overallScore: calculatedOverallScore,
    overallRating,
    categoryScores,
    weightedScores,
    benchmarks,
    improvementAreas,
    strengths,
    trends,
    qualityIndicators,
    coachingInsights,
    businessImpact,
  }
}

// Enhanced Communication Score Calculation
function calculateEnhancedCommunicationScore(text: string, agentPerformance: any, transcript: string): number {
  let score = (agentPerformance?.communicationSkills || 5.0) * 10

  // Advanced communication indicators
  const excellentCommunication = [
    "let me explain that clearly",
    "to make sure i understand",
    "what i hear you saying",
    "let me clarify",
    "does that make sense",
    "do you have any questions",
    "i want to ensure",
    "let me walk you through",
    "to summarize what we discussed",
  ]

  const goodCommunication = [
    "i understand",
    "that's a great question",
    "absolutely",
    "certainly",
    "of course",
    "i'd be happy to help",
    "let me help you with that",
  ]

  const poorCommunication = ["um", "uh", "like", "you know", "whatever", "i guess", "maybe", "i think", "probably"]

  // Calculate communication quality
  const excellentCount = excellentCommunication.filter((phrase) => text.includes(phrase)).length
  const goodCount = goodCommunication.filter((phrase) => text.includes(phrase)).length
  const poorCount = poorCommunication.filter((phrase) => text.includes(phrase)).length

  score += excellentCount * 5
  score += goodCount * 2
  score -= poorCount * 2

  // Check for active listening
  if (text.includes("what i hear") || text.includes("so you're saying")) score += 8

  // Check for confirmation
  if (text.includes("is that correct") || text.includes("did i get that right")) score += 5

  // Penalty for interruptions (basic check)
  const sentences = transcript.split(/[.!?]+/)
  const shortSentences = sentences.filter((s) => s.trim().length < 10).length
  if (shortSentences > sentences.length * 0.3) score -= 10

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Enhanced Empathy Score Calculation
function calculateEnhancedEmpathyScore(text: string, transcript: string): number {
  const empathyIndicators = [
    "i understand how frustrating",
    "i can imagine how",
    "that must be difficult",
    "i'm sorry to hear",
    "i apologize for",
    "i feel for you",
    "i know how important",
    "that sounds challenging",
    "i hear the concern",
    "i get it",
    "i can see why",
    "that makes perfect sense",
  ]

  const emotionalValidation = ["frustrated", "upset", "concerned", "worried", "disappointed", "confused"]

  let score = 50 // Base empathy score

  const empathyCount = empathyIndicators.filter((indicator) => text.includes(indicator)).length
  score += empathyCount * 8

  // Bonus for emotional validation
  const validationCount = emotionalValidation.filter(
    (emotion) => text.includes(emotion) && (text.includes("understand") || text.includes("hear")),
  ).length
  score += validationCount * 10

  // Check for genuine concern
  if (text.includes("let me see what i can do") || text.includes("i want to help")) score += 12

  // Penalty for dismissive language
  const dismissive = ["that's not my problem", "you should have", "you need to", "that's policy"]
  const dismissiveCount = dismissive.filter((phrase) => text.includes(phrase)).length
  score -= dismissiveCount * 15

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Enhanced Problem Resolution Score
function calculateEnhancedProblemResolutionScore(text: string, agentPerformance: any, businessConversion: any): number {
  let score = (agentPerformance?.problemSolving || 5.0) * 10

  const resolutionIndicators = [
    "let me fix that for you",
    "i can resolve this",
    "here's what we'll do",
    "the solution is",
    "i'll take care of this",
    "we can solve this",
    "let me help you with",
    "i'll make sure this gets resolved",
    "here are your options",
    "let me find a solution",
  ]

  const proactiveApproach = [
    "to prevent this in the future",
    "let me also check",
    "while we're at it",
    "i noticed",
    "to make sure everything is working",
  ]

  const resolutionCount = resolutionIndicators.filter((indicator) => text.includes(indicator)).length
  score += resolutionCount * 6

  const proactiveCount = proactiveApproach.filter((phrase) => text.includes(phrase)).length
  score += proactiveCount * 8

  // Bonus for successful conversion/resolution
  if (businessConversion?.conversionAchieved) {
    score += 20
  }

  // Check for follow-up commitment
  if (text.includes("i'll follow up") || text.includes("i'll check back")) score += 10

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Enhanced Professionalism Score
function calculateEnhancedProfessionalismScore(text: string, transcript: string): number {
  const professionalIndicators = [
    "sir",
    "madam",
    "mr.",
    "ms.",
    "mrs.",
    "please",
    "thank you",
    "you're welcome",
    "my pleasure",
    "certainly",
    "absolutely",
    "i'd be delighted to",
    "it would be my pleasure",
  ]

  const courtesyPhrases = [
    "may i",
    "would you like",
    "if you don't mind",
    "when you have a moment",
    "i appreciate your patience",
    "thank you for waiting",
  ]

  let score = 60 // Base professionalism score

  const professionalCount = professionalIndicators.filter((indicator) => text.includes(indicator)).length
  score += professionalCount * 3

  const courtesyCount = courtesyPhrases.filter((phrase) => text.includes(phrase)).length
  score += courtesyCount * 5

  // Deduct for unprofessional language
  const unprofessionalIndicators = ["yeah", "nope", "whatever", "dude", "guys", "no way", "that's crazy"]
  const unprofessionalCount = unprofessionalIndicators.filter((indicator) => text.includes(indicator)).length
  score -= unprofessionalCount * 8

  // Check for proper call opening and closing
  if (text.includes("thank you for calling") || text.includes("how may i help")) score += 8
  if (text.includes("is there anything else") || text.includes("thank you for your time")) score += 8

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Enhanced Product Knowledge Score
function calculateEnhancedProductKnowledgeScore(text: string, agentPerformance: any, transcript: string): number {
  let score = (agentPerformance?.productKnowledge || 5.0) * 10

  const knowledgeIndicators = [
    "this feature allows",
    "the benefit of this is",
    "what this means for you",
    "this option includes",
    "the advantage is",
    "this plan offers",
    "specifically designed for",
    "this works by",
    "the difference between",
    "compared to other options",
    "this is included",
    "you'll have access to",
  ]

  const expertiseIndicators = [
    "in my experience",
    "what i typically recommend",
    "based on your needs",
    "the best option for you",
    "this is perfect for",
    "ideal solution",
  ]

  const knowledgeCount = knowledgeIndicators.filter((indicator) => text.includes(indicator)).length
  score += knowledgeCount * 4

  const expertiseCount = expertiseIndicators.filter((indicator) => text.includes(indicator)).length
  score += expertiseCount * 6

  // Deduct for uncertainty
  const uncertaintyIndicators = ["i think", "maybe", "not sure", "i believe", "probably", "i'm not certain"]
  const uncertaintyCount = uncertaintyIndicators.filter((indicator) => text.includes(indicator)).length
  score -= uncertaintyCount * 5

  // Bonus for detailed explanations
  if (text.includes("let me explain how") || text.includes("here's how it works")) score += 10

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Enhanced Call Control Score
function calculateEnhancedCallControlScore(text: string, transcript: string): number {
  let score = 70 // Base score

  const controlIndicators = [
    "let me start by",
    "first, let's",
    "next, we'll",
    "then we can",
    "finally",
    "to summarize",
    "moving on to",
    "before we continue",
    "let's focus on",
    "the main thing is",
    "most importantly",
    "let me guide you through",
  ]

  const redirectionPhrases = [
    "let me bring us back to",
    "the important thing here is",
    "what we need to focus on",
    "let's address",
    "coming back to your question",
  ]

  const controlCount = controlIndicators.filter((indicator) => text.includes(indicator)).length
  score += controlCount * 4

  const redirectionCount = redirectionPhrases.filter((phrase) => text.includes(phrase)).length
  score += redirectionCount * 6

  // Check for agenda setting
  if (text.includes("here's what we'll cover") || text.includes("let me outline")) score += 10

  // Check for time management
  if (text.includes("we have about") || text.includes("in the time we have")) score += 8

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Enhanced Compliance Score
function calculateEnhancedComplianceScore(text: string, transcript: string): number {
  let score = 80 // Base compliance score

  const complianceIndicators = [
    "privacy policy",
    "terms and conditions",
    "verify your identity",
    "for security purposes",
    "data protection",
    "consent",
    "agreement",
    "recorded for quality",
    "monitoring purposes",
    "compliance",
  ]

  const disclosureIndicators = [
    "i need to inform you",
    "please be aware",
    "it's important to note",
    "you should know",
    "disclosure",
    "regulation requires",
  ]

  const complianceCount = complianceIndicators.filter((indicator) => text.includes(indicator)).length
  score += complianceCount * 5

  const disclosureCount = disclosureIndicators.filter((indicator) => text.includes(indicator)).length
  score += disclosureCount * 8

  // Required phrases for certain industries
  if (text.includes("call may be recorded") || text.includes("quality and training")) score += 10
  if (text.includes("verify your identity") && text.includes("security")) score += 10

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Enhanced Customer Satisfaction Score
function calculateEnhancedCustomerSatisfactionScore(text: string, agentPerformance: any, toneQuality: any): number {
  let score = (agentPerformance?.customerService || 5.0) * 10

  const satisfactionIndicators = [
    "thank you so much",
    "this is exactly what i needed",
    "you've been very helpful",
    "i appreciate your help",
    "that's perfect",
    "excellent service",
    "you've solved my problem",
    "i'm satisfied",
    "great job",
  ]

  const positiveOutcomes = [
    "problem solved",
    "issue resolved",
    "question answered",
    "exactly what i was looking for",
    "that helps a lot",
  ]

  const satisfactionCount = satisfactionIndicators.filter((indicator) => text.includes(indicator)).length
  score += satisfactionCount * 6

  const outcomeCount = positiveOutcomes.filter((outcome) => text.includes(outcome)).length
  score += outcomeCount * 8

  // Tone quality impact
  const toneScore = toneQuality?.score || 5.0
  score += (toneScore - 5) * 3

  // Check for customer engagement
  if (text.includes("that makes sense") || text.includes("i understand now")) score += 10

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Business Acumen Score
function calculateBusinessAcumenScore(text: string, businessConversion: any, transcript: string): number {
  let score = 50 // Base score

  const businessIndicators = [
    "value proposition",
    "return on investment",
    "cost savings",
    "business benefits",
    "competitive advantage",
    "market opportunity",
  ]

  const salesSkills = [
    "based on your needs",
    "perfect fit for",
    "this will help you",
    "imagine if you could",
    "what if i told you",
    "the value you'll receive",
  ]

  const businessCount = businessIndicators.filter((indicator) => text.includes(indicator)).length
  score += businessCount * 8

  const salesCount = salesSkills.filter((skill) => text.includes(skill)).length
  score += salesCount * 6

  // Bonus for successful conversion
  if (businessConversion?.conversionAchieved) {
    score += 25
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Adaptability Score
function calculateAdaptabilityScore(text: string, transcript: string): number {
  let score = 60 // Base score

  const adaptabilityIndicators = [
    "let me try a different approach",
    "another way to look at this",
    "let me explain it differently",
    "perhaps we should",
    "alternatively",
    "on second thought",
    "let me adjust",
    "different option",
  ]

  const flexibilityIndicators = [
    "i can work with that",
    "we can accommodate",
    "let's find another way",
    "no problem, we can",
    "absolutely, let's do that instead",
  ]

  const adaptabilityCount = adaptabilityIndicators.filter((indicator) => text.includes(indicator)).length
  score += adaptabilityCount * 10

  const flexibilityCount = flexibilityIndicators.filter((indicator) => text.includes(indicator)).length
  score += flexibilityCount * 8

  return Math.min(100, Math.max(0, Math.round(score)))
}

// Helper Functions

function getCategoryDescription(category: string, score: number): string {
  const descriptions: Record<string, Record<string, string>> = {
    communication: {
      excellent: "Outstanding clarity and articulation with active listening",
      good: "Clear communication with good listening skills",
      average: "Adequate communication with room for improvement",
      poor: "Communication needs significant improvement",
    },
    empathy: {
      excellent: "Exceptional emotional intelligence and customer understanding",
      good: "Good emotional connection with customers",
      average: "Basic empathy with some emotional awareness",
      poor: "Limited emotional connection with customers",
    },
    // Add more categories as needed
  }

  let level = "poor"
  if (score >= 85) level = "excellent"
  else if (score >= 70) level = "good"
  else if (score >= 55) level = "average"

  return descriptions[category]?.[level] || `${category} performance: ${score}/100`
}

function determineEnhancedRating(score: number): "EXCELLENT" | "GOOD" | "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "POOR" {
  if (score >= 90) return "EXCELLENT"
  if (score >= 80) return "GOOD"
  if (score >= 70) return "SATISFACTORY"
  if (score >= 60) return "NEEDS_IMPROVEMENT"
  return "POOR"
}

function generateEnhancedBenchmarks(overallScore: number): PreciseScoring["benchmarks"] {
  // Enhanced benchmark data
  const teamAverage = 78
  const companyAverage = 75
  const industryAverage = 72
  const topPerformerAverage = 92

  let performanceRank: string
  let percentile: number

  if (overallScore >= 95) {
    performanceRank = "Top 1%"
    percentile = 99
  } else if (overallScore >= 90) {
    performanceRank = "Top 5%"
    percentile = 95
  } else if (overallScore >= 85) {
    performanceRank = "Top 10%"
    percentile = 90
  } else if (overallScore >= 80) {
    performanceRank = "Top 25%"
    percentile = 75
  } else if (overallScore >= 70) {
    performanceRank = "Above Average"
    percentile = 60
  } else if (overallScore >= 60) {
    performanceRank = "Average"
    percentile = 40
  } else if (overallScore >= 50) {
    performanceRank = "Below Average"
    percentile = 25
  } else {
    performanceRank = "Needs Immediate Attention"
    percentile = 10
  }

  const target = 85
  const variance = overallScore - target
  let status: "EXCEEDS" | "MEETS" | "BELOW"

  if (variance > 5) status = "EXCEEDS"
  else if (variance >= -5) status = "MEETS"
  else status = "BELOW"

  return {
    teamAverage,
    companyAverage,
    industryAverage,
    topPerformerAverage,
    performanceRank,
    percentile,
    comparisonToGoal: {
      target,
      variance,
      status,
    },
  }
}

function identifyDetailedImprovementAreas(
  categoryScores: PreciseScoring["categoryScores"],
  transcript: string,
): PreciseScoring["improvementAreas"] {
  const areas: PreciseScoring["improvementAreas"] = []

  Object.entries(categoryScores).forEach(([category, score]) => {
    if (score < 75) {
      let priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
      let impact: "HIGH" | "MEDIUM" | "LOW"
      let timeframe: string

      if (score < 50) {
        priority = "CRITICAL"
        impact = "HIGH"
        timeframe = "Immediate (1-2 weeks)"
      } else if (score < 60) {
        priority = "HIGH"
        impact = "HIGH"
        timeframe = "Short-term (2-4 weeks)"
      } else if (score < 70) {
        priority = "MEDIUM"
        impact = "MEDIUM"
        timeframe = "Medium-term (1-2 months)"
      } else {
        priority = "LOW"
        impact = "LOW"
        timeframe = "Long-term (2-3 months)"
      }

      const targetScore = Math.min(100, score + 25)
      const recommendations = getDetailedRecommendations(category, score)
      const specificActions = getSpecificActions(category, score)
      const resources = getResources(category)

      areas.push({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        currentScore: score,
        targetScore,
        priority,
        impact,
        recommendations,
        specificActions,
        timeframe,
        resources,
      })
    }
  })

  return areas.sort((a, b) => {
    const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

function getDetailedRecommendations(category: string, score: number): string[] {
  const recommendations: Record<string, string[]> = {
    communication: [
      "Practice active listening techniques with immediate acknowledgment",
      "Use the 'echo' method to confirm understanding",
      "Implement structured communication frameworks",
      "Focus on clear, concise language without jargon",
    ],
    empathy: [
      "Develop emotional intelligence through customer perspective exercises",
      "Practice empathetic language patterns and validation techniques",
      "Learn to identify and respond to emotional cues",
      "Use the 'feel, felt, found' method for difficult situations",
    ],
    problemResolution: [
      "Implement systematic problem-solving methodologies",
      "Develop root cause analysis skills",
      "Practice solution-oriented language and approaches",
      "Create personal toolkit of resolution strategies",
    ],
    // Add more categories
  }

  return recommendations[category] || [`Focus on improving ${category} through targeted practice and training`]
}

function getSpecificActions(category: string, score: number): string[] {
  const actions: Record<string, string[]> = {
    communication: [
      "Record and review 3 practice calls weekly",
      "Complete active listening certification course",
      "Practice summarization techniques daily",
      "Implement pause-and-confirm strategy",
    ],
    empathy: [
      "Complete emotional intelligence assessment",
      "Practice empathy mapping exercises",
      "Shadow top-performing agents for empathy techniques",
      "Implement customer emotion tracking",
    ],
    // Add more categories
  }

  return actions[category] || [`Develop specific action plan for ${category} improvement`]
}

function getResources(category: string): string[] {
  const resources: Record<string, string[]> = {
    communication: [
      "Advanced Communication Skills Workshop",
      "Active Listening Certification Program",
      "Toastmasters International",
      "Internal Communication Coaching",
    ],
    empathy: [
      "Emotional Intelligence Training Module",
      "Customer Psychology Course",
      "Empathy in Customer Service Workshop",
      "Peer Mentoring Program",
    ],
    // Add more categories
  }

  return resources[category] || [`Training resources for ${category} development`]
}

function identifyEnhancedStrengths(categoryScores: PreciseScoring["categoryScores"]): PreciseScoring["strengths"] {
  const strengths: PreciseScoring["strengths"] = []

  Object.entries(categoryScores).forEach(([category, score]) => {
    if (score >= 80) {
      let description: string
      let impact: string

      if (score >= 95) {
        description = `Exceptional ${category} performance - industry leading`
        impact = "Significant positive impact on customer experience and business outcomes"
      } else if (score >= 90) {
        description = `Outstanding ${category} skills - top performer level`
        impact = "Strong positive impact on customer satisfaction and team performance"
      } else if (score >= 85) {
        description = `Excellent ${category} capabilities - above expectations`
        impact = "Positive impact on customer experience and operational efficiency"
      } else {
        description = `Strong ${category} performance - meets high standards`
        impact = "Contributes positively to overall call quality and customer satisfaction"
      }

      strengths.push({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        score,
        description,
        impact,
      })
    }
  })

  return strengths
}

function generateComprehensiveTrends(currentScore: number): PreciseScoring["trends"] {
  // Mock comprehensive trend data - in real implementation, this would come from historical data
  const lastCall = Math.max(0, currentScore + Math.floor(Math.random() * 10 - 5))
  const last5Calls = Math.max(0, currentScore + Math.floor(Math.random() * 8 - 4))
  const last30Days = Math.max(0, currentScore + Math.floor(Math.random() * 6 - 3))
  const last90Days = Math.max(0, currentScore + Math.floor(Math.random() * 8 - 4))
  const yearToDate = Math.max(0, currentScore + Math.floor(Math.random() * 10 - 5))

  const trend30 = currentScore - last30Days
  const trend90 = currentScore - last90Days

  let improvement: "IMPROVING" | "DECLINING" | "STABLE" | "VOLATILE"
  let trajectory: "UPWARD" | "DOWNWARD" | "FLAT"

  if (Math.abs(trend30) > 10 && Math.abs(trend90) > 10) {
    improvement = "VOLATILE"
    trajectory = "FLAT"
  } else if (trend30 > 5 && trend90 > 3) {
    improvement = "IMPROVING"
    trajectory = "UPWARD"
  } else if (trend30 < -5 && trend90 < -3) {
    improvement = "DECLINING"
    trajectory = "DOWNWARD"
  } else {
    improvement = "STABLE"
    trajectory = "FLAT"
  }

  const momentum = Math.round((trend30 + trend90) / 2)
  const consistency = Math.max(0, 100 - Math.abs(trend30 - trend90) * 5)

  return {
    lastCall,
    last5Calls,
    last30Days,
    last90Days,
    yearToDate,
    improvement,
    trajectory,
    momentum,
    consistency,
  }
}

function calculateQualityIndicators(
  transcript: string,
  categoryScores: PreciseScoring["categoryScores"],
  businessConversion: any,
): PreciseScoring["qualityIndicators"] {
  const text = transcript.toLowerCase()

  // Calculate call efficiency (based on resolution indicators)
  const resolutionIndicators = ["resolved", "solved", "fixed", "completed", "addressed"]
  const hasResolution = resolutionIndicators.some((indicator) => text.includes(indicator))
  const callEfficiency = hasResolution
    ? Math.min(100, categoryScores.problemResolution + 10)
    : categoryScores.problemResolution

  // First call resolution
  const firstCallResolution = hasResolution && !text.includes("previous call") && !text.includes("follow up")

  // Customer retention (based on satisfaction indicators)
  const retentionIndicators = ["satisfied", "happy", "pleased", "thank you", "helpful"]
  const retentionScore = retentionIndicators.filter((indicator) => text.includes(indicator)).length * 20
  const customerRetention = Math.min(100, retentionScore)

  // Escalation rate (inverse of call control)
  const escalationIndicators = ["supervisor", "manager", "escalate", "transfer"]
  const hasEscalation = escalationIndicators.some((indicator) => text.includes(indicator))
  const escalationRate = hasEscalation ? 100 : Math.max(0, 100 - categoryScores.callControl)

  // Compliance score
  const complianceScore = categoryScores.compliance

  // Coaching receptivity (based on adaptability and professionalism)
  const coachingReceptivity = Math.round((categoryScores.adaptability + categoryScores.professionalism) / 2)

  return {
    callEfficiency,
    firstCallResolution,
    customerRetention,
    escalationRate,
    complianceScore,
    coachingReceptivity,
  }
}

function generateCoachingInsights(
  categoryScores: PreciseScoring["categoryScores"],
  transcript: string,
  improvementAreas: PreciseScoring["improvementAreas"],
): PreciseScoring["coachingInsights"] {
  const averageScore =
    Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length

  let readinessLevel: "READY" | "DEVELOPING" | "NEEDS_SUPPORT"
  if (averageScore >= 80) readinessLevel = "READY"
  else if (averageScore >= 65) readinessLevel = "DEVELOPING"
  else readinessLevel = "NEEDS_SUPPORT"

  const focusAreas = improvementAreas.slice(0, 3).map((area) => area.category)

  // Determine learning style based on performance patterns
  let learningStyle = "Visual and Practical"
  if (categoryScores.communication > categoryScores.problemResolution) {
    learningStyle = "Auditory and Discussion-based"
  } else if (categoryScores.problemResolution > categoryScores.communication) {
    learningStyle = "Hands-on and Experiential"
  }

  const motivationalFactors = [
    "Recognition for strengths",
    "Clear improvement pathways",
    "Peer collaboration opportunities",
    "Skill development challenges",
  ]

  const developmentPlan = {
    shortTerm: ["Focus on top 2 improvement areas", "Daily practice sessions", "Immediate feedback implementation"],
    mediumTerm: [
      "Complete targeted training modules",
      "Peer mentoring participation",
      "Performance milestone achievement",
    ],
    longTerm: [
      "Advanced certification pursuit",
      "Leadership development preparation",
      "Subject matter expertise development",
    ],
  }

  return {
    readinessLevel,
    focusAreas,
    learningStyle,
    motivationalFactors,
    developmentPlan,
  }
}

function calculateBusinessImpact(
  categoryScores: PreciseScoring["categoryScores"],
  businessConversion: any,
  transcript: string,
): PreciseScoring["businessImpact"] {
  const averageScore =
    Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length

  // Revenue impact (based on conversion and business acumen)
  const conversionMultiplier = businessConversion?.conversionAchieved ? 1.5 : 0.8
  const revenueImpact = Math.round(((categoryScores.businessAcumen * conversionMultiplier) / 100) * 1000)

  // Customer lifetime value impact
  const customerLifetimeValue = Math.round(((categoryScores.customerSatisfaction + categoryScores.empathy) / 2) * 50)

  // Conversion rate
  const conversionRate = businessConversion?.conversionAchieved
    ? Math.min(100, categoryScores.businessAcumen + 20)
    : categoryScores.businessAcumen

  // Upsell success
  const upsellSuccess = Math.round((categoryScores.productKnowledge + categoryScores.businessAcumen) / 2)

  // Customer satisfaction impact
  const customerSatisfactionImpact = categoryScores.customerSatisfaction

  // Brand representation score
  const brandRepresentationScore = Math.round(
    (categoryScores.professionalism + categoryScores.compliance + categoryScores.empathy) / 3,
  )

  return {
    revenueImpact,
    customerLifetimeValue,
    conversionRate,
    upsellSuccess,
    customerSatisfactionImpact,
    brandRepresentationScore,
  }
}
