export interface SentimentScore {
  positive: number
  negative: number
  neutral: number
  overall: "Positive" | "Negative" | "Neutral"
  confidence: number
}

export interface SentimentAnalysis {
  agentSentiment: SentimentScore
  customerSentiment: SentimentScore
  overallCallSentiment: SentimentScore
  sentimentTimeline: Array<{
    timestamp: number
    speaker: "agent" | "customer"
    sentiment: "positive" | "negative" | "neutral"
    confidence: number
    text: string
  }>
  keyPhrases: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
  emotionalJourney: {
    startSentiment: "positive" | "negative" | "neutral"
    endSentiment: "positive" | "negative" | "neutral"
    sentimentShifts: number
    dominantEmotion: "positive" | "negative" | "neutral"
  }
}

export function analyzeSentiment(transcript: string): SentimentAnalysis {
  const text = transcript.toLowerCase()

  // Define sentiment keywords
  const positiveKeywords = [
    "thank",
    "thanks",
    "appreciate",
    "excellent",
    "great",
    "wonderful",
    "perfect",
    "amazing",
    "fantastic",
    "helpful",
    "pleased",
    "satisfied",
    "happy",
    "love",
    "awesome",
    "brilliant",
    "outstanding",
    "superb",
    "marvelous",
    "delighted",
  ]

  const negativeKeywords = [
    "frustrated",
    "angry",
    "upset",
    "disappointed",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "disgusted",
    "furious",
    "annoyed",
    "irritated",
    "mad",
    "outraged",
    "dissatisfied",
    "unhappy",
    "complaint",
    "problem",
    "issue",
    "trouble",
  ]

  const neutralKeywords = [
    "okay",
    "fine",
    "alright",
    "understand",
    "see",
    "know",
    "think",
    "maybe",
    "perhaps",
    "possibly",
    "probably",
    "might",
    "could",
    "would",
    "should",
  ]

  // Split transcript into agent and customer parts (simplified)
  const lines = transcript.split("\n").filter((line) => line.trim())
  const agentLines = lines.filter((line) => line.toLowerCase().includes("agent:"))
  const customerLines = lines.filter((line) => line.toLowerCase().includes("customer:"))

  // Analyze agent sentiment
  const agentText = agentLines.join(" ").toLowerCase()
  const agentSentiment = calculateSentimentScore(agentText, positiveKeywords, negativeKeywords, neutralKeywords)

  // Analyze customer sentiment
  const customerText = customerLines.join(" ").toLowerCase()
  const customerSentiment = calculateSentimentScore(customerText, positiveKeywords, negativeKeywords, neutralKeywords)

  // Calculate overall call sentiment
  const overallSentiment = calculateOverallSentiment(agentSentiment, customerSentiment)

  // Generate sentiment timeline
  const sentimentTimeline = generateSentimentTimeline(lines, positiveKeywords, negativeKeywords)

  // Extract key phrases
  const keyPhrases = extractKeyPhrases(text, positiveKeywords, negativeKeywords, neutralKeywords)

  // Analyze emotional journey
  const emotionalJourney = analyzeEmotionalJourney(sentimentTimeline)

  return {
    agentSentiment,
    customerSentiment,
    overallCallSentiment: overallSentiment,
    sentimentTimeline,
    keyPhrases,
    emotionalJourney,
  }
}

function calculateSentimentScore(
  text: string,
  positiveKeywords: string[],
  negativeKeywords: string[],
  neutralKeywords: string[],
): SentimentScore {
  const words = text.split(/\s+/)

  const positiveCount = positiveKeywords.filter((keyword) => text.includes(keyword)).length
  const negativeCount = negativeKeywords.filter((keyword) => text.includes(keyword)).length
  const neutralCount = neutralKeywords.filter((keyword) => text.includes(keyword)).length

  const totalSentimentWords = positiveCount + negativeCount + neutralCount

  if (totalSentimentWords === 0) {
    return {
      positive: 33,
      negative: 33,
      neutral: 34,
      overall: "Neutral",
      confidence: 50,
    }
  }

  const positive = Math.round((positiveCount / totalSentimentWords) * 100)
  const negative = Math.round((negativeCount / totalSentimentWords) * 100)
  const neutral = 100 - positive - negative

  let overall: "Positive" | "Negative" | "Neutral"
  let confidence: number

  if (positive > negative && positive > neutral) {
    overall = "Positive"
    confidence = Math.min(95, 60 + (positive - Math.max(negative, neutral)) * 2)
  } else if (negative > positive && negative > neutral) {
    overall = "Negative"
    confidence = Math.min(95, 60 + (negative - Math.max(positive, neutral)) * 2)
  } else {
    overall = "Neutral"
    confidence = Math.min(95, 50 + Math.abs(positive - negative))
  }

  return {
    positive,
    negative,
    neutral,
    overall,
    confidence: Math.round(confidence),
  }
}

function calculateOverallSentiment(agentSentiment: SentimentScore, customerSentiment: SentimentScore): SentimentScore {
  const avgPositive = Math.round((agentSentiment.positive + customerSentiment.positive) / 2)
  const avgNegative = Math.round((agentSentiment.negative + customerSentiment.negative) / 2)
  const avgNeutral = 100 - avgPositive - avgNegative

  let overall: "Positive" | "Negative" | "Neutral"
  if (avgPositive > avgNegative && avgPositive > avgNeutral) {
    overall = "Positive"
  } else if (avgNegative > avgPositive && avgNegative > avgNeutral) {
    overall = "Negative"
  } else {
    overall = "Neutral"
  }

  const confidence = Math.round((agentSentiment.confidence + customerSentiment.confidence) / 2)

  return {
    positive: avgPositive,
    negative: avgNegative,
    neutral: avgNeutral,
    overall,
    confidence,
  }
}

function generateSentimentTimeline(
  lines: string[],
  positiveKeywords: string[],
  negativeKeywords: string[],
): Array<{
  timestamp: number
  speaker: "agent" | "customer"
  sentiment: "positive" | "negative" | "neutral"
  confidence: number
  text: string
}> {
  return lines.map((line, index) => {
    const text = line.toLowerCase()
    const speaker = text.includes("agent:") ? "agent" : "customer"

    const positiveCount = positiveKeywords.filter((keyword) => text.includes(keyword)).length
    const negativeCount = negativeKeywords.filter((keyword) => text.includes(keyword)).length

    let sentiment: "positive" | "negative" | "neutral"
    let confidence: number

    if (positiveCount > negativeCount) {
      sentiment = "positive"
      confidence = Math.min(95, 60 + positiveCount * 10)
    } else if (negativeCount > positiveCount) {
      sentiment = "negative"
      confidence = Math.min(95, 60 + negativeCount * 10)
    } else {
      sentiment = "neutral"
      confidence = 50
    }

    return {
      timestamp: index * 10, // Approximate timestamp
      speaker,
      sentiment,
      confidence,
      text: line.replace(/^(Agent:|Customer:)\s*/i, ""),
    }
  })
}

function extractKeyPhrases(
  text: string,
  positiveKeywords: string[],
  negativeKeywords: string[],
  neutralKeywords: string[],
): { positive: string[]; negative: string[]; neutral: string[] } {
  const positive = positiveKeywords.filter((keyword) => text.includes(keyword))
  const negative = negativeKeywords.filter((keyword) => text.includes(keyword))
  const neutral = neutralKeywords.filter((keyword) => text.includes(keyword))

  return { positive, negative, neutral }
}

function analyzeEmotionalJourney(
  timeline: Array<{
    sentiment: "positive" | "negative" | "neutral"
  }>,
): {
  startSentiment: "positive" | "negative" | "neutral"
  endSentiment: "positive" | "negative" | "neutral"
  sentimentShifts: number
  dominantEmotion: "positive" | "negative" | "neutral"
} {
  if (timeline.length === 0) {
    return {
      startSentiment: "neutral",
      endSentiment: "neutral",
      sentimentShifts: 0,
      dominantEmotion: "neutral",
    }
  }

  const startSentiment = timeline[0].sentiment
  const endSentiment = timeline[timeline.length - 1].sentiment

  // Count sentiment shifts
  let sentimentShifts = 0
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].sentiment !== timeline[i - 1].sentiment) {
      sentimentShifts++
    }
  }

  // Find dominant emotion
  const sentimentCounts = timeline.reduce(
    (acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const dominantEmotion = Object.entries(sentimentCounts).sort(([, a], [, b]) => b - a)[0][0] as
    | "positive"
    | "negative"
    | "neutral"

  return {
    startSentiment,
    endSentiment,
    sentimentShifts,
    dominantEmotion,
  }
}
