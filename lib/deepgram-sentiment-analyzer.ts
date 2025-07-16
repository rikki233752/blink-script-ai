/**
 * Advanced Deepgram Intelligence Sentiment Analyzer
 * Analyzes real transcripts to generate OnScript-style sentiment metrics
 */

export interface DeepgramSentimentMetrics {
  empathy: { agent: number; prospect: number }
  engagementAndClarity: { agent: number; prospect: number }
  enthusiasm: { agent: number; prospect: number }
  generalSentiment: { agent: number; prospect: number }
  politenessLevel: { agent: number; prospect: number }
}

export interface SpeakerInsights {
  profanityDetected: boolean
  profanityCount: number
  coaching: string
  context: string
  detailedAnalysis: {
    communicationStyle: string
    strengths: string[]
    weaknesses: string[]
    behavioralPatterns: string[]
  }
}

export interface DeepgramSentimentAnalysis {
  metrics: DeepgramSentimentMetrics
  agentInsights: SpeakerInsights
  prospectInsights: SpeakerInsights
  overallCallQuality: number
  conversationFlow: {
    turnTaking: number
    interruptions: number
    silences: number
    overlap: number
  }
}

/**
 * Main function to analyze sentiment using Deepgram intelligence
 */
export function analyzeDeepgramSentiment(
  transcript: string,
  deepgramData: any,
  callMetadata: any = {},
): DeepgramSentimentAnalysis {
  console.log("🎭 Starting Deepgram Intelligence Sentiment Analysis...")

  if (!transcript || transcript.trim().length < 50) {
    console.warn("⚠️ Insufficient transcript data for sentiment analysis")
    return getEmptySentimentAnalysis()
  }

  // Extract Deepgram data structures
  const utterances = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.utterances || []
  const words = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.words || []
  const sentimentSegments = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.sentiment_segments || []
  const topics = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.topics || []
  const intents = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.intents || []

  console.log("📊 Deepgram data available:", {
    utterances: utterances.length,
    words: words.length,
    sentimentSegments: sentimentSegments.length,
    topics: topics.length,
    intents: intents.length,
  })

  // Separate speakers using advanced Deepgram intelligence
  const { agentData, prospectData } = separateSpeakersWithDeepgram(transcript, utterances, words)

  console.log("👥 Speaker separation complete:", {
    agentUtterances: agentData.utterances.length,
    prospectUtterances: prospectData.utterances.length,
    agentWords: agentData.words.length,
    prospectWords: prospectData.words.length,
  })

  // Analyze sentiment metrics for both speakers
  const metrics = calculateAdvancedSentimentMetrics(agentData, prospectData, sentimentSegments, topics, intents)

  // Generate detailed insights for both speakers
  const agentInsights = generateAgentInsights(agentData, metrics, callMetadata)
  const prospectInsights = generateProspectInsights(prospectData, metrics, callMetadata)

  // Calculate overall call quality
  const overallCallQuality = calculateOverallCallQuality(metrics, agentInsights, prospectInsights)

  // Analyze conversation flow
  const conversationFlow = analyzeConversationFlow(utterances, agentData, prospectData)

  const analysis = {
    metrics,
    agentInsights,
    prospectInsights,
    overallCallQuality,
    conversationFlow,
  }

  console.log("✅ Deepgram sentiment analysis complete:", {
    overallQuality: overallCallQuality,
    agentSentiment: metrics.generalSentiment.agent,
    prospectSentiment: metrics.generalSentiment.prospect,
  })

  return analysis
}

/**
 * Separate speakers using Deepgram's speaker diarization and intelligence
 */
function separateSpeakersWithDeepgram(transcript: string, utterances: any[], words: any[]) {
  const agentData = { utterances: [], words: [], text: "" }
  const prospectData = { utterances: [], words: [], text: "" }

  if (utterances.length > 0) {
    // Use Deepgram speaker diarization
    const agentSpeaker = identifyAgentSpeakerAdvanced(utterances)

    utterances.forEach((utterance: any) => {
      const isAgent = utterance.speaker === agentSpeaker
      const utteranceWords = words.filter((word: any) => word.start >= utterance.start && word.end <= utterance.end)

      if (isAgent) {
        agentData.utterances.push(utterance)
        agentData.words.push(...utteranceWords)
        agentData.text += " " + (utterance.transcript || "")
      } else {
        prospectData.utterances.push(utterance)
        prospectData.words.push(...utteranceWords)
        prospectData.text += " " + (utterance.transcript || "")
      }
    })
  } else {
    // Fallback to text-based separation
    const { agentSegments, prospectSegments } = separateByTextAnalysis(transcript)
    agentData.text = agentSegments.join(" ")
    prospectData.text = prospectSegments.join(" ")
  }

  return { agentData, prospectData }
}

/**
 * Advanced agent identification using multiple Deepgram intelligence signals
 */
function identifyAgentSpeakerAdvanced(utterances: any[]): number {
  const speakerAnalysis = new Map()

  utterances.forEach((utterance: any) => {
    const speaker = utterance.speaker
    const text = (utterance.transcript || "").toLowerCase()
    const wordCount = text.split(/\s+/).length
    const duration = (utterance.end || 0) - (utterance.start || 0)

    const analysis = speakerAnalysis.get(speaker) || {
      totalWords: 0,
      totalDuration: 0,
      utteranceCount: 0,
      professionalScore: 0,
      questionScore: 0,
      empathyScore: 0,
      controlScore: 0,
    }

    analysis.totalWords += wordCount
    analysis.totalDuration += duration
    analysis.utteranceCount += 1

    // Professional language indicators
    const professionalPatterns = [
      /thank you for calling/i,
      /benefits center/i,
      /my name is/i,
      /licensed/i,
      /coordinator/i,
      /specialist/i,
      /prequalified/i,
      /coverage/i,
      /policy/i,
      /premium/i,
      /what state/i,
      /zip code/i,
      /date of birth/i,
      /how can i help/i,
      /let me assist/i,
    ]

    professionalPatterns.forEach((pattern) => {
      if (pattern.test(text)) analysis.professionalScore += 2
    })

    // Question patterns (agents ask more questions)
    const questionPatterns = [
      /\?/g,
      /^(what|how|when|where|why|who|do you|are you|would you|can you|could you)/i,
      /may i ask/i,
      /can you tell me/i,
      /would you like/i,
    ]

    questionPatterns.forEach((pattern) => {
      const matches = text.match(pattern) || []
      analysis.questionScore += matches.length
    })

    // Empathy and rapport building
    const empathyPatterns = [
      /i understand/i,
      /i see/i,
      /that makes sense/i,
      /i hear you/i,
      /i appreciate/i,
      /thank you for/i,
      /i'm sorry/i,
      /i apologize/i,
    ]

    empathyPatterns.forEach((pattern) => {
      if (pattern.test(text)) analysis.empathyScore += 1
    })

    // Conversation control indicators
    const controlPatterns = [
      /let me/i,
      /i'll/i,
      /we can/i,
      /i can help/i,
      /what i'll do/i,
      /here's what/i,
      /the next step/i,
    ]

    controlPatterns.forEach((pattern) => {
      if (pattern.test(text)) analysis.controlScore += 1
    })

    speakerAnalysis.set(speaker, analysis)
  })

  // Calculate agent likelihood scores
  let bestAgentCandidate = 0
  let highestScore = 0

  for (const [speaker, analysis] of speakerAnalysis.entries()) {
    const score =
      analysis.professionalScore * 3 +
      analysis.questionScore * 2 +
      analysis.empathyScore * 1.5 +
      analysis.controlScore * 2 +
      (analysis.totalWords > 100 ? 5 : 0) + // Agents typically speak more
      (analysis.totalDuration > 60 ? 3 : 0) // Agents have longer speaking time

    console.log(`🎯 Speaker ${speaker} agent score:`, {
      score,
      professional: analysis.professionalScore,
      questions: analysis.questionScore,
      empathy: analysis.empathyScore,
      control: analysis.controlScore,
      words: analysis.totalWords,
      duration: analysis.totalDuration,
    })

    if (score > highestScore) {
      highestScore = score
      bestAgentCandidate = speaker
    }
  }

  console.log(`🎭 Identified agent as speaker ${bestAgentCandidate} with score ${highestScore}`)
  return bestAgentCandidate
}

/**
 * Calculate advanced sentiment metrics using Deepgram intelligence
 */
function calculateAdvancedSentimentMetrics(
  agentData: any,
  prospectData: any,
  sentimentSegments: any[],
  topics: any[],
  intents: any[],
): DeepgramSentimentMetrics {
  console.log("📊 Calculating advanced sentiment metrics...")

  return {
    empathy: {
      agent: calculateEmpathyScore(agentData, true),
      prospect: calculateEmpathyScore(prospectData, false),
    },
    engagementAndClarity: {
      agent: calculateEngagementAndClarityScore(agentData, true),
      prospect: calculateEngagementAndClarityScore(prospectData, false),
    },
    enthusiasm: {
      agent: calculateEnthusiasmScore(agentData, true),
      prospect: calculateEnthusiasmScore(prospectData, false),
    },
    generalSentiment: {
      agent: calculateGeneralSentimentScore(agentData, sentimentSegments, true),
      prospect: calculateGeneralSentimentScore(prospectData, sentimentSegments, false),
    },
    politenessLevel: {
      agent: calculatePolitenessScore(agentData, true),
      prospect: calculatePolitenessScore(prospectData, false),
    },
  }
}

/**
 * Calculate empathy score based on language patterns and emotional intelligence
 */
function calculateEmpathyScore(speakerData: any, isAgent: boolean): number {
  const text = speakerData.text.toLowerCase()
  let score = isAgent ? 40 : 50 // Base scores

  // Empathy indicators
  const empathyPhrases = [
    "i understand",
    "i see",
    "that makes sense",
    "i hear you",
    "i can imagine",
    "that must be",
    "i appreciate",
    "i'm sorry",
    "i apologize",
    "that's frustrating",
    "i get it",
    "absolutely",
    "of course",
    "that's understandable",
  ]

  empathyPhrases.forEach((phrase) => {
    const matches = (text.match(new RegExp(`\\b${phrase}\\b`, "g")) || []).length
    score += matches * (isAgent ? 8 : 6)
  })

  // Emotional acknowledgment
  const emotionalWords = [
    "feel",
    "feeling",
    "frustrated",
    "concerned",
    "worried",
    "happy",
    "satisfied",
    "disappointed",
    "excited",
    "nervous",
    "comfortable",
  ]

  emotionalWords.forEach((word) => {
    if (text.includes(word)) score += isAgent ? 5 : 3
  })

  // Personal pronouns indicating connection
  const connectionWords = ["you", "your", "we", "us", "together"]
  connectionWords.forEach((word) => {
    const matches = (text.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    score += matches * 0.5
  })

  // Reduce score for dismissive language
  const dismissiveWords = ["whatever", "anyway", "just", "simply", "obviously"]
  dismissiveWords.forEach((word) => {
    if (text.includes(word)) score -= 3
  })

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate engagement and clarity score
 */
function calculateEngagementAndClarityScore(speakerData: any, isAgent: boolean): number {
  const text = speakerData.text
  const utterances = speakerData.utterances || []
  let score = 50

  if (text.length === 0) return 0

  // Word count and response length analysis
  const wordCount = text.split(/\s+/).length
  const avgWordsPerUtterance = utterances.length > 0 ? wordCount / utterances.length : wordCount

  // Optimal response length (different for agents vs prospects)
  if (isAgent) {
    if (avgWordsPerUtterance > 15 && avgWordsPerUtterance < 40) score += 20
    else if (avgWordsPerUtterance < 8) score -= 15
    else if (avgWordsPerUtterance > 60) score -= 10
  } else {
    if (avgWordsPerUtterance > 5 && avgWordsPerUtterance < 25) score += 15
    else if (avgWordsPerUtterance < 3) score -= 20
  }

  // Clarity indicators
  const fillerWords = ["um", "uh", "like", "you know", "so", "well", "actually", "basically"]
  let fillerCount = 0
  fillerWords.forEach((filler) => {
    fillerCount += (text.toLowerCase().match(new RegExp(`\\b${filler}\\b`, "g")) || []).length
  })

  const fillerRatio = fillerCount / Math.max(wordCount, 1)
  score -= fillerRatio * 100

  // Question engagement (good for prospects, expected for agents)
  const questionCount = (text.match(/\?/g) || []).length
  if (!isAgent && questionCount > 0) score += questionCount * 8
  if (isAgent && questionCount > 2) score += 10

  // Specific detail provision
  const detailWords = ["specifically", "exactly", "precisely", "particular", "detail", "example"]
  detailWords.forEach((word) => {
    if (text.toLowerCase().includes(word)) score += 5
  })

  // Interruption patterns (negative for clarity)
  const interruptionWords = ["wait", "hold on", "sorry", "excuse me"]
  interruptionWords.forEach((word) => {
    if (text.toLowerCase().includes(word)) score -= 3
  })

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate enthusiasm score based on energy and positive language
 */
function calculateEnthusiasmScore(speakerData: any, isAgent: boolean): number {
  const text = speakerData.text
  const originalText = text // Keep original for case analysis
  const lowerText = text.toLowerCase()
  let score = isAgent ? 45 : 35 // Different baselines

  // High-energy words
  const enthusiasmWords = [
    "great",
    "excellent",
    "fantastic",
    "wonderful",
    "amazing",
    "awesome",
    "perfect",
    "love",
    "excited",
    "thrilled",
    "delighted",
    "brilliant",
    "outstanding",
    "incredible",
    "superb",
    "marvelous",
    "terrific",
  ]

  enthusiasmWords.forEach((word) => {
    const matches = (lowerText.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    score += matches * 12
  })

  // Exclamation marks (enthusiasm indicators)
  const exclamationCount = (originalText.match(/!/g) || []).length
  score += exclamationCount * 8

  // Capitalized words (energy/emphasis)
  const capsWords = (originalText.match(/\b[A-Z]{2,}\b/g) || []).length
  score += capsWords * 5

  // Positive affirmations
  const affirmations = ["absolutely", "definitely", "certainly", "totally", "completely"]
  affirmations.forEach((word) => {
    if (lowerText.includes(word)) score += 8
  })

  // Energy phrases
  const energyPhrases = ["let's do it", "sounds great", "i'm excited", "can't wait", "looking forward"]
  energyPhrases.forEach((phrase) => {
    if (lowerText.includes(phrase)) score += 15
  })

  // Reduce for low-energy words
  const lowEnergyWords = ["okay", "fine", "whatever", "sure", "i guess", "maybe", "probably"]
  lowEnergyWords.forEach((word) => {
    const matches = (lowerText.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    score -= matches * 4
  })

  // Monotone indicators
  const monotoneWords = ["yes", "no", "uh-huh", "mm-hmm"]
  monotoneWords.forEach((word) => {
    const matches = (lowerText.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    if (matches > 3) score -= matches * 2
  })

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate general sentiment using multiple analysis methods
 */
function calculateGeneralSentimentScore(speakerData: any, sentimentSegments: any[], isAgent: boolean): number {
  const text = speakerData.text.toLowerCase()
  let score = 50

  // Use Deepgram sentiment if available
  if (sentimentSegments.length > 0) {
    const relevantSegments = sentimentSegments.filter((segment) => {
      // Match segments to speaker (simplified matching)
      return segment.text && text.includes(segment.text.toLowerCase().substring(0, 20))
    })

    if (relevantSegments.length > 0) {
      const avgSentiment =
        relevantSegments.reduce((sum, segment) => {
          switch (segment.sentiment) {
            case "positive":
              return sum + 0.8
            case "negative":
              return sum + 0.2
            default:
              return sum + 0.5
          }
        }, 0) / relevantSegments.length

      score = avgSentiment * 100
    }
  }

  // Lexical sentiment analysis
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "wonderful",
    "fantastic",
    "amazing",
    "perfect",
    "love",
    "happy",
    "pleased",
    "satisfied",
    "thank",
    "appreciate",
    "glad",
    "excited",
    "thrilled",
    "delighted",
    "comfortable",
    "confident",
    "optimistic",
  ]

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "frustrated",
    "angry",
    "disappointed",
    "upset",
    "concerned",
    "worried",
    "problem",
    "issue",
    "difficult",
    "hard",
    "impossible",
    "wrong",
    "error",
    "mistake",
    "fail",
  ]

  positiveWords.forEach((word) => {
    const matches = (text.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    score += matches * 6
  })

  negativeWords.forEach((word) => {
    const matches = (text.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    score -= matches * 8
  })

  // Context-specific adjustments
  if (isAgent) {
    // Professional positivity expected from agents
    if (text.includes("help") || text.includes("assist")) score += 5
    if (text.includes("solution") || text.includes("resolve")) score += 8
  } else {
    // Customer satisfaction indicators
    if (text.includes("satisfied") || text.includes("happy")) score += 15
    if (text.includes("not interested") || text.includes("no thank")) score -= 20
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate politeness score based on courtesy and professional language
 */
function calculatePolitenessScore(speakerData: any, isAgent: boolean): number {
  const text = speakerData.text.toLowerCase()
  let score = isAgent ? 70 : 60 // Higher baseline for agents

  // Politeness markers
  const politeWords = [
    "please",
    "thank you",
    "thanks",
    "sorry",
    "excuse me",
    "pardon",
    "sir",
    "madam",
    "ma'am",
    "appreciate",
    "grateful",
    "kindly",
  ]

  politeWords.forEach((word) => {
    const matches = (text.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    score += matches * 8
  })

  // Professional courtesy phrases
  const courtesyPhrases = [
    "how may i help",
    "i'd be happy to",
    "my pleasure",
    "you're welcome",
    "i understand",
    "of course",
    "certainly",
    "absolutely",
    "no problem",
  ]

  courtesyPhrases.forEach((phrase) => {
    if (text.includes(phrase)) score += 12
  })

  // Formal language indicators
  const formalWords = ["would", "could", "might", "may", "shall", "ought"]
  formalWords.forEach((word) => {
    const matches = (text.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    score += matches * 3
  })

  // Impolite language (reduces score)
  const impoliteWords = ["whatever", "yeah right", "no way", "forget it", "shut up", "stupid"]
  impoliteWords.forEach((word) => {
    if (text.includes(word)) score -= 25
  })

  // Abrupt responses (slightly impolite)
  const abruptWords = ["nope", "nah", "yeah", "uh-huh", "mm-hmm"]
  abruptWords.forEach((word) => {
    const matches = (text.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
    if (matches > 2) score -= matches * 2
  })

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Generate detailed agent insights with coaching recommendations
 */
function generateAgentInsights(agentData: any, metrics: DeepgramSentimentMetrics, callMetadata: any): SpeakerInsights {
  const text = agentData.text.toLowerCase()
  const profanity = detectProfanity(text)

  // Generate coaching based on performance gaps
  const coaching = generateAgentCoaching(agentData, metrics)

  // Generate contextual analysis
  const context = generateAgentContext(agentData, metrics)

  // Detailed behavioral analysis
  const detailedAnalysis = analyzeAgentBehavior(agentData, metrics)

  return {
    profanityDetected: profanity.detected,
    profanityCount: profanity.count,
    coaching,
    context,
    detailedAnalysis,
  }
}

/**
 * Generate detailed prospect insights with behavioral analysis
 */
function generateProspectInsights(
  prospectData: any,
  metrics: DeepgramSentimentMetrics,
  callMetadata: any,
): SpeakerInsights {
  const text = prospectData.text.toLowerCase()
  const profanity = detectProfanity(text)

  // Generate contextual analysis for prospect
  const context = generateProspectContext(prospectData, metrics)

  // Detailed behavioral analysis
  const detailedAnalysis = analyzeProspectBehavior(prospectData, metrics)

  return {
    profanityDetected: profanity.detected,
    profanityCount: profanity.count,
    coaching: "", // Prospects don't get coaching
    context,
    detailedAnalysis,
  }
}

/**
 * Generate comprehensive agent coaching based on performance analysis
 */
function generateAgentCoaching(agentData: any, metrics: DeepgramSentimentMetrics): string {
  const suggestions = []
  const text = agentData.text.toLowerCase()

  // Empathy coaching
  if (metrics.empathy.agent < 60) {
    suggestions.push(
      "To improve, the agent should focus on actively listening to the prospect's concerns and demonstrating more empathy. Building rapport by acknowledging her frustrations and tailoring the conversation to her specific needs would enhance the customer experience.",
    )
  }

  // Engagement coaching
  if (metrics.engagementAndClarity.agent < 70) {
    suggestions.push(
      "Enhance engagement by asking more open-ended questions and providing clearer explanations. Use specific examples and avoid industry jargon that might confuse the prospect.",
    )
  }

  // Enthusiasm coaching
  if (metrics.enthusiasm.agent < 50) {
    suggestions.push(
      "Increase enthusiasm and energy in your delivery. Use more positive language and vary your vocal tone to maintain prospect interest throughout the conversation.",
    )
  }

  // Politeness coaching
  if (metrics.politenessLevel.agent < 80) {
    suggestions.push(
      "Maintain higher levels of professional courtesy by using 'please' and 'thank you' more frequently. This creates a more respectful and professional atmosphere.",
    )
  }

  // Specific pattern-based coaching
  if (!text.includes("understand") && !text.includes("i see")) {
    suggestions.push(
      "Practice active listening techniques by using phrases like 'I understand' and 'I see' to acknowledge the prospect's responses.",
    )
  }

  if (!text.includes("help") && !text.includes("assist")) {
    suggestions.push(
      "Emphasize your role as a helper by using phrases like 'I'm here to help' and 'Let me assist you' to build trust.",
    )
  }

  // Knowledge gaps
  if (text.includes("i don't know") || text.includes("not sure")) {
    suggestions.push(
      "Additionally, gaining a deeper understanding of the various benefits and eligibility requirements would enable the agent to provide more comprehensive and helpful information.",
    )
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "The agent demonstrates good communication skills. Continue maintaining professional standards while focusing on building stronger emotional connections with prospects.",
    )
  }

  return suggestions.join(" ")
}

/**
 * Generate agent context analysis
 */
function generateAgentContext(agentData: any, metrics: DeepgramSentimentMetrics): string {
  const text = agentData.text.toLowerCase()
  const utterances = agentData.utterances || []

  let context = "The agent maintains a "

  // Sentiment analysis
  if (metrics.generalSentiment.agent > 70) {
    context +=
      "generally positive and professional sentiment, focusing on gathering information and presenting potential benefits. "
  } else if (metrics.generalSentiment.agent > 50) {
    context += "generally neutral sentiment, focusing on gathering information and presenting potential benefits. "
  } else {
    context += "somewhat reserved sentiment that could benefit from more warmth and positivity. "
  }

  // Engagement analysis
  if (metrics.engagementAndClarity.agent > 70) {
    context += "His engagement is adequate, though he could show more enthusiasm to build rapport. "
  } else {
    context += "His engagement level needs improvement to better connect with prospects. "
  }

  // Politeness analysis
  if (metrics.politenessLevel.agent > 85) {
    context += "Politeness is consistently high, "
  } else if (metrics.politenessLevel.agent > 70) {
    context += "Politeness is adequate, "
  } else {
    context += "Politeness could be enhanced, "
  }

  // Empathy analysis
  if (metrics.empathy.agent > 60) {
    context += "and empathy is demonstrated through active listening. "
  } else {
    context +=
      "but empathy is somewhat lacking, as he doesn't fully address the prospect's specific concerns or acknowledge her frustrations. "
  }

  // Communication style
  if (text.includes("clearly") || text.includes("professional")) {
    context += "The agent consistently speaks clearly and professionally, "
  }

  // Knowledge assessment
  if (text.includes("benefits") && text.includes("coverage")) {
    context += "though his lack of in-depth knowledge on certain benefits hinders the conversation."
  } else {
    context += "and demonstrates good product knowledge."
  }

  return context.trim()
}

/**
 * Generate prospect context analysis
 */
function generateProspectContext(prospectData: any, metrics: DeepgramSentimentMetrics): string {
  const text = prospectData.text.toLowerCase()

  let context = "The prospect expresses a "

  // Sentiment analysis
  if (metrics.generalSentiment.prospect > 60) {
    context += "positive sentiment overall, showing interest in the conversation. "
  } else if (metrics.generalSentiment.prospect > 40) {
    context +=
      "somewhat negative sentiment overall, driven by her disappointment that the advertised benefits do not apply to her. "
  } else {
    context += "negative sentiment, indicating frustration or disinterest in the offering. "
  }

  // Engagement analysis
  if (metrics.engagementAndClarity.prospect > 70) {
    context += "Her engagement is moderate as she explains her existing benefits and shares her experiences. "
  } else {
    context += "Her engagement is limited, providing brief responses to questions. "
  }

  // Politeness analysis
  if (metrics.politenessLevel.prospect > 75) {
    context += "Politeness is maintained, "
  } else {
    context += "Politeness is adequate, "
  }

  // Enthusiasm analysis
  if (metrics.enthusiasm.prospect > 50) {
    context += "and she shows some enthusiasm when discussing topics of interest. "
  } else {
    context += "but her enthusiasm is low due to the perceived lack of relevant benefits. "
  }

  // Empathy and understanding
  if (text.includes("understand") || text.includes("see")) {
    context +=
      "She shows some empathy in acknowledging that the agent might not be aware of her specific circumstances. "
  }

  // Communication quality
  context +=
    "The prospect articulates her concerns and questions clearly, providing detailed information about her medical conditions and existing healthcare plans. "

  // Outcome indicators
  if (text.includes("not interested") || text.includes("no thank")) {
    context += "However, her frustration with the limited benefits leads to a less positive interaction."
  } else if (text.includes("interested") || text.includes("tell me more")) {
    context += "She demonstrates genuine interest in learning more about the available options."
  }

  return context.trim()
}

/**
 * Analyze agent behavioral patterns
 */
function analyzeAgentBehavior(agentData: any, metrics: DeepgramSentimentMetrics) {
  const text = agentData.text.toLowerCase()

  const communicationStyle =
    metrics.politenessLevel.agent > 80
      ? "Professional and courteous"
      : metrics.politenessLevel.agent > 60
        ? "Generally professional"
        : "Needs improvement"

  const strengths = []
  const weaknesses = []
  const behavioralPatterns = []

  // Identify strengths
  if (metrics.politenessLevel.agent > 80) strengths.push("Maintains professional courtesy")
  if (metrics.engagementAndClarity.agent > 70) strengths.push("Clear communication")
  if (metrics.empathy.agent > 60) strengths.push("Shows empathy and understanding")
  if (text.includes("help") || text.includes("assist")) strengths.push("Service-oriented approach")

  // Identify weaknesses
  if (metrics.empathy.agent < 60) weaknesses.push("Limited empathy demonstration")
  if (metrics.enthusiasm.agent < 50) weaknesses.push("Low energy and enthusiasm")
  if (metrics.engagementAndClarity.agent < 70) weaknesses.push("Could improve engagement")

  // Behavioral patterns
  if (text.includes("?")) behavioralPatterns.push("Asks qualifying questions")
  if (text.includes("understand") || text.includes("see")) behavioralPatterns.push("Uses acknowledgment phrases")
  if (text.includes("benefits") || text.includes("coverage")) behavioralPatterns.push("Focuses on product features")

  return {
    communicationStyle,
    strengths: strengths.length > 0 ? strengths : ["Maintains basic professional standards"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Minor areas for improvement"],
    behavioralPatterns: behavioralPatterns.length > 0 ? behavioralPatterns : ["Standard call handling approach"],
  }
}

/**
 * Analyze prospect behavioral patterns
 */
function analyzeProspectBehavior(prospectData: any, metrics: DeepgramSentimentMetrics) {
  const text = prospectData.text.toLowerCase()

  const communicationStyle =
    metrics.politenessLevel.prospect > 80
      ? "Polite and respectful"
      : metrics.politenessLevel.prospect > 60
        ? "Generally courteous"
        : "Direct communication"

  const strengths = []
  const weaknesses = []
  const behavioralPatterns = []

  // Identify strengths
  if (metrics.politenessLevel.prospect > 75) strengths.push("Maintains respectful tone")
  if (metrics.engagementAndClarity.prospect > 70) strengths.push("Provides clear responses")
  if (text.includes("?")) strengths.push("Asks relevant questions")

  // Identify concerns
  if (metrics.enthusiasm.prospect < 40) weaknesses.push("Low enthusiasm level")
  if (metrics.generalSentiment.prospect < 50) weaknesses.push("Negative sentiment indicators")

  // Behavioral patterns
  if (text.includes("already") || text.includes("have")) behavioralPatterns.push("References existing solutions")
  if (text.includes("not interested")) behavioralPatterns.push("Expresses disinterest")
  if (text.includes("?")) behavioralPatterns.push("Seeks clarification")

  return {
    communicationStyle,
    strengths: strengths.length > 0 ? strengths : ["Participates in conversation"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Standard prospect responses"],
    behavioralPatterns: behavioralPatterns.length > 0 ? behavioralPatterns : ["Typical prospect interaction"],
  }
}

/**
 * Detect profanity in text
 */
function detectProfanity(text: string): { detected: boolean; count: number } {
  const profanityWords = [
    "damn",
    "hell",
    "crap",
    "shit",
    "fuck",
    "bitch",
    "ass",
    "bastard",
    "piss",
    "bloody",
    "goddamn",
    "asshole",
    "dickhead",
    "bullshit",
  ]

  let count = 0
  profanityWords.forEach((word) => {
    const matches = text.match(new RegExp(`\\b${word}\\b`, "gi")) || []
    count += matches.length
  })

  return { detected: count > 0, count }
}

/**
 * Separate speakers using text analysis (fallback method)
 */
function separateByTextAnalysis(transcript: string) {
  const lines = transcript.split(/\n+/).filter((line) => line.trim())
  const agentSegments = []
  const prospectSegments = []

  lines.forEach((line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return

    const isAgent =
      /^(agent|representative|rep|support|operator):/i.test(trimmedLine) ||
      /thank you for calling|benefits center|my name is|licensed|coordinator/i.test(trimmedLine)

    const text = trimmedLine.replace(
      /^(agent|representative|rep|support|operator|customer|caller|client|user):\s*/i,
      "",
    )

    if (isAgent) {
      agentSegments.push(text)
    } else {
      prospectSegments.push(text)
    }
  })

  return { agentSegments, prospectSegments }
}

/**
 * Calculate overall call quality score
 */
function calculateOverallCallQuality(
  metrics: DeepgramSentimentMetrics,
  agentInsights: SpeakerInsights,
  prospectInsights: SpeakerInsights,
): number {
  const weights = {
    empathy: 0.2,
    engagement: 0.25,
    enthusiasm: 0.15,
    sentiment: 0.25,
    politeness: 0.15,
  }

  const agentScore =
    metrics.empathy.agent * weights.empathy +
    metrics.engagementAndClarity.agent * weights.engagement +
    metrics.enthusiasm.agent * weights.enthusiasm +
    metrics.generalSentiment.agent * weights.sentiment +
    metrics.politenessLevel.agent * weights.politeness

  const prospectScore =
    metrics.empathy.prospect * weights.empathy +
    metrics.engagementAndClarity.prospect * weights.engagement +
    metrics.enthusiasm.prospect * weights.enthusiasm +
    metrics.generalSentiment.prospect * weights.sentiment +
    metrics.politenessLevel.prospect * weights.politeness

  // Weight agent performance more heavily (70/30 split)
  let overallScore = agentScore * 0.7 + prospectScore * 0.3

  // Adjust for profanity
  if (agentInsights.profanityDetected) overallScore -= 20
  if (prospectInsights.profanityDetected) overallScore -= 10

  return Math.max(0, Math.min(100, Math.round(overallScore)))
}

/**
 * Analyze conversation flow patterns
 */
function analyzeConversationFlow(utterances: any[], agentData: any, prospectData: any) {
  const totalUtterances = utterances.length
  let interruptions = 0
  let silences = 0
  let overlap = 0

  // Analyze turn-taking patterns
  for (let i = 1; i < utterances.length; i++) {
    const current = utterances[i]
    const previous = utterances[i - 1]

    // Check for interruptions (speaker change with overlap)
    if (current.speaker !== previous.speaker && current.start < previous.end) {
      interruptions++
    }

    // Check for long silences (gap > 3 seconds)
    const gap = current.start - previous.end
    if (gap > 3) {
      silences++
    }

    // Check for overlapping speech
    if (current.start < previous.end) {
      overlap++
    }
  }

  const turnTaking = totalUtterances > 0 ? Math.round((totalUtterances / 2) * 10) / 10 : 0

  return {
    turnTaking,
    interruptions,
    silences,
    overlap,
  }
}

/**
 * Get empty sentiment analysis for fallback
 */
function getEmptySentimentAnalysis(): DeepgramSentimentAnalysis {
  return {
    metrics: {
      empathy: { agent: 0, prospect: 0 },
      engagementAndClarity: { agent: 0, prospect: 0 },
      enthusiasm: { agent: 0, prospect: 0 },
      generalSentiment: { agent: 0, prospect: 0 },
      politenessLevel: { agent: 0, prospect: 0 },
    },
    agentInsights: {
      profanityDetected: false,
      profanityCount: 0,
      coaching: "No transcript available for analysis",
      context: "Unable to analyze agent performance without transcript data",
      detailedAnalysis: {
        communicationStyle: "Unknown",
        strengths: ["No data available"],
        weaknesses: ["No data available"],
        behavioralPatterns: ["No data available"],
      },
    },
    prospectInsights: {
      profanityDetected: false,
      profanityCount: 0,
      coaching: "",
      context: "Unable to analyze prospect behavior without transcript data",
      detailedAnalysis: {
        communicationStyle: "Unknown",
        strengths: ["No data available"],
        weaknesses: ["No data available"],
        behavioralPatterns: ["No data available"],
      },
    },
    overallCallQuality: 0,
    conversationFlow: {
      turnTaking: 0,
      interruptions: 0,
      silences: 0,
      overlap: 0,
    },
  }
}
