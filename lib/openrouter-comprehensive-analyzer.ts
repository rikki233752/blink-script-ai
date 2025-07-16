import { OpenRouterService } from "./openrouter-service"

type IntentAnalysisResult = {
  primaryIntent: string
  subcategory: string
  confidence: number
  intentKeywords: string[]
  reasoning: string
  urgency: "Low" | "Medium" | "High"
  customerNeed: string
}

type DispositionAnalysisResult = {
  disposition: string
  confidence: number
  reasoning: string
  category: string
  outcome: string
  nextSteps: string[]
  followUpRequired: boolean
  customerSatisfaction: "Low" | "Medium" | "High"
}

type FactsAnalysisResult = {
  keyFacts: string[]
  customerInfo: {
    name?: string
    company?: string
    contactInfo?: string
    demographics?: string
  }
  productsMentioned: string[]
  pricesDiscussed: string[]
  timeframes: string[]
  commitments: string[]
  objections: string[]
  competitorsMentioned: string[]
  technicalDetails: string[]
  businessRequirements: string[]
}

type SentimentAnalysisResult = {
  overallSentiment: "Positive" | "Negative" | "Neutral"
  agentSentiment: "Positive" | "Negative" | "Neutral"
  customerSentiment: "Positive" | "Negative" | "Neutral"
  confidence: number
  emotionalJourney: string
  keyMoments: Array<{
    timestamp: string
    sentiment: string
    description: string
  }>
}

type QualityAnalysisResult = {
  overallScore: number
  communicationClarity: number
  professionalism: number
  empathy: number
  problemSolving: number
  productKnowledge: number
  callControl: number
  strengths: string[]
  improvementAreas: string[]
  coachingRecommendations: string[]
}

type BusinessAnalysisResult = {
  conversionPotential: number
  buyingSignals: string[]
  riskFactors: string[]
  valueProposition: string
  competitivePosition: string
  nextBestActions: string[]
  estimatedDealSize: string
  timeToClose: string
}

type ComprehensiveAnalysisResult = {
  intentAnalysis: IntentAnalysisResult
  dispositionAnalysis: DispositionAnalysisResult
  factsAnalysis: FactsAnalysisResult
  sentimentAnalysis: SentimentAnalysisResult
  qualityAnalysis: QualityAnalysisResult
  businessAnalysis: BusinessAnalysisResult
  summary: string
  confidence: number
  processingTime: number
}

export class OpenRouterComprehensiveAnalyzer {
  private openRouter: OpenRouterService

  constructor(apiKey?: string) {
    this.openRouter = new OpenRouterService(apiKey)
  }

  async analyzeCall(transcript: string): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now()

    try {
      // Run all analyses in parallel for better performance
      const [intentAnalysis, dispositionAnalysis, factsAnalysis, sentimentAnalysis, qualityAnalysis, businessAnalysis] =
        await Promise.all([
          this.analyzeIntent(transcript),
          this.analyzeDisposition(transcript),
          this.extractFacts(transcript),
          this.analyzeSentiment(transcript),
          this.analyzeQuality(transcript),
          this.analyzeBusiness(transcript),
        ])

      const processingTime = Date.now() - startTime

      // Generate comprehensive summary
      const summary = await this.generateSummary({
        intentAnalysis,
        dispositionAnalysis,
        factsAnalysis,
        sentimentAnalysis,
        qualityAnalysis,
        businessAnalysis,
      })

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence({
        intentAnalysis,
        dispositionAnalysis,
        sentimentAnalysis,
        qualityAnalysis,
        businessAnalysis,
      })

      return {
        intentAnalysis,
        dispositionAnalysis,
        factsAnalysis,
        sentimentAnalysis,
        qualityAnalysis,
        businessAnalysis,
        summary,
        confidence,
        processingTime,
      }
    } catch (error) {
      console.error("OpenRouter comprehensive analysis failed:", error)
      throw error
    }
  }

  private async analyzeIntent(transcript: string): Promise<IntentAnalysisResult> {
    const systemPrompt = `You are an expert call center analyst specializing in intent recognition. Analyze the customer's primary intent from the call transcript.

Focus on:
- What the customer is trying to achieve
- Their underlying needs and motivations
- Urgency level of their request
- Keywords that indicate intent

Respond with a JSON object containing:
- primaryIntent: Main goal (e.g., "Purchase Product", "Technical Support", "Billing Inquiry", "Complaint Resolution")
- subcategory: Specific type within the intent
- confidence: 0-100 confidence score
- intentKeywords: Array of key phrases that indicate this intent
- reasoning: Brief explanation of why this intent was identified
- urgency: "Low", "Medium", or "High"
- customerNeed: What the customer actually needs`

    const prompt = `Analyze this call transcript for customer intent:

${transcript}

Provide detailed intent analysis in JSON format.`

    const response = await this.openRouter.makeRequest(prompt, systemPrompt)
    return this.parseJsonResponse(response, "intent analysis")
  }

  private async analyzeDisposition(transcript: string): Promise<DispositionAnalysisResult> {
    const systemPrompt = `You are an expert call center analyst specializing in call disposition analysis. Determine how the call was resolved and what the outcome was.

Focus on:
- Final outcome of the call
- Whether the customer's issue was resolved
- Next steps required
- Customer satisfaction level
- Follow-up needs

Respond with a JSON object containing:
- disposition: Final call outcome (e.g., "Resolved", "Escalated", "Follow-up Required", "Sale Completed", "No Sale")
- confidence: 0-100 confidence score
- reasoning: Explanation of why this disposition was assigned
- category: Type of resolution (e.g., "Technical", "Sales", "Service", "Billing")
- outcome: Specific result achieved
- nextSteps: Array of required follow-up actions
- followUpRequired: Boolean indicating if follow-up is needed
- customerSatisfaction: "Low", "Medium", or "High" based on customer's final state`

    const prompt = `Analyze this call transcript for call disposition:

${transcript}

Provide detailed disposition analysis in JSON format.`

    const response = await this.openRouter.makeRequest(prompt, systemPrompt)
    return this.parseJsonResponse(response, "disposition analysis")
  }

  private async extractFacts(transcript: string): Promise<FactsAnalysisResult> {
    const systemPrompt = `You are an expert data extraction specialist. Extract all factual information from the call transcript.

Focus on:
- Customer information (names, companies, contact details)
- Products or services mentioned
- Prices, costs, or financial information
- Timeframes and deadlines
- Commitments made by either party
- Technical specifications
- Business requirements
- Competitors mentioned
- Objections raised

Respond with a JSON object containing:
- keyFacts: Array of the most important facts from the call
- customerInfo: Object with name, company, contactInfo, demographics
- productsMentioned: Array of products/services discussed
- pricesDiscussed: Array of any pricing information
- timeframes: Array of dates, deadlines, or time commitments
- commitments: Array of promises or commitments made
- objections: Array of concerns or objections raised
- competitorsMentioned: Array of competitor names or products
- technicalDetails: Array of technical specifications or requirements
- businessRequirements: Array of business needs or requirements`

    const prompt = `Extract all factual information from this call transcript:

${transcript}

Provide comprehensive facts extraction in JSON format.`

    const response = await this.openRouter.makeRequest(prompt, systemPrompt)
    return this.parseJsonResponse(response, "facts analysis")
  }

  private async analyzeSentiment(transcript: string): Promise<SentimentAnalysisResult> {
    const systemPrompt = `You are an expert sentiment analysis specialist. Analyze the emotional tone and sentiment throughout the call.

Focus on:
- Overall sentiment of the conversation
- Agent's emotional tone and professionalism
- Customer's emotional state and satisfaction
- How sentiment changed during the call
- Key emotional moments

Respond with a JSON object containing:
- overallSentiment: "Positive", "Negative", or "Neutral"
- agentSentiment: Agent's emotional tone
- customerSentiment: Customer's emotional state
- confidence: 0-100 confidence score
- emotionalJourney: Description of how emotions evolved
- keyMoments: Array of significant emotional moments with timestamp, sentiment, and description`

    const prompt = `Analyze the sentiment and emotional tone of this call transcript:

${transcript}

Provide detailed sentiment analysis in JSON format.`

    const response = await this.openRouter.makeRequest(prompt, systemPrompt)
    return this.parseJsonResponse(response, "sentiment analysis")
  }

  private async analyzeQuality(transcript: string): Promise<QualityAnalysisResult> {
    const systemPrompt = `You are an expert call quality analyst. Evaluate the agent's performance and call quality.

Focus on:
- Communication clarity and effectiveness
- Professionalism and courtesy
- Empathy and emotional intelligence
- Problem-solving approach
- Product knowledge demonstration
- Call control and structure
- Areas for improvement
- Coaching opportunities

Respond with a JSON object containing:
- overallScore: 0-100 overall quality score
- communicationClarity: 0-100 score for clear communication
- professionalism: 0-100 score for professional behavior
- empathy: 0-100 score for empathy and emotional intelligence
- problemSolving: 0-100 score for problem-solving effectiveness
- productKnowledge: 0-100 score for product knowledge
- callControl: 0-100 score for managing the call flow
- strengths: Array of agent's strong points
- improvementAreas: Array of areas needing improvement
- coachingRecommendations: Array of specific coaching suggestions`

    const prompt = `Analyze the quality and agent performance in this call transcript:

${transcript}

Provide detailed quality analysis in JSON format.`

    const response = await this.openRouter.makeRequest(prompt, systemPrompt)
    return this.parseJsonResponse(response, "quality analysis")
  }

  private async analyzeBusiness(transcript: string): Promise<BusinessAnalysisResult> {
    const systemPrompt = `You are an expert business analyst specializing in sales and customer interactions. Analyze the business aspects of this call.

Focus on:
- Sales potential and conversion likelihood
- Buying signals and interest indicators
- Risk factors and obstacles
- Value proposition effectiveness
- Competitive positioning
- Business impact and opportunity size
- Strategic next steps

Respond with a JSON object containing:
- conversionPotential: 0-100 likelihood of conversion
- buyingSignals: Array of positive buying indicators
- riskFactors: Array of potential obstacles or risks
- valueProposition: How well value was communicated
- competitivePosition: Competitive advantages mentioned
- nextBestActions: Array of recommended next steps
- estimatedDealSize: Estimated value of the opportunity
- timeToClose: Estimated time to close the deal`

    const prompt = `Analyze the business aspects and sales potential of this call transcript:

${transcript}

Provide detailed business analysis in JSON format.`

    const response = await this.openRouter.makeRequest(prompt, systemPrompt)
    return this.parseJsonResponse(response, "business analysis")
  }

  private async generateSummary(analyses: any): Promise<string> {
    const systemPrompt = `You are an expert call center analyst. Create a comprehensive executive summary of the call analysis.

Focus on:
- Key outcomes and decisions
- Most important insights
- Critical action items
- Overall assessment
- Strategic implications

Keep the summary concise but comprehensive, highlighting the most important findings.`

    const prompt = `Based on these comprehensive call analyses, create an executive summary:

Intent Analysis: ${JSON.stringify(analyses.intentAnalysis, null, 2)}
Disposition Analysis: ${JSON.stringify(analyses.dispositionAnalysis, null, 2)}
Facts Analysis: ${JSON.stringify(analyses.factsAnalysis, null, 2)}
Sentiment Analysis: ${JSON.stringify(analyses.sentimentAnalysis, null, 2)}
Quality Analysis: ${JSON.stringify(analyses.qualityAnalysis, null, 2)}
Business Analysis: ${JSON.stringify(analyses.businessAnalysis, null, 2)}

Provide a comprehensive executive summary of the call.`

    return await this.openRouter.makeRequest(prompt, systemPrompt)
  }

  private calculateOverallConfidence(analyses: any): number {
    const confidenceScores = [
      analyses.intentAnalysis.confidence || 0,
      analyses.dispositionAnalysis.confidence || 0,
      analyses.sentimentAnalysis.confidence || 0,
      analyses.qualityAnalysis.overallScore || 0,
      analyses.businessAnalysis.conversionPotential || 0,
    ]

    return Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length)
  }

  private parseJsonResponse(response: string, analysisType: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // If no JSON found, try parsing the entire response
      return JSON.parse(response)
    } catch (error) {
      console.error(`Failed to parse ${analysisType} response:`, error)
      console.error("Raw response:", response)

      // Return a default structure based on analysis type
      return this.getDefaultResponse(analysisType)
    }
  }

  private getDefaultResponse(analysisType: string): any {
    const defaults: Record<string, any> = {
      "intent analysis": {
        primaryIntent: "General Inquiry",
        subcategory: "Information Request",
        confidence: 50,
        intentKeywords: ["help", "information"],
        reasoning: "Default response due to parsing error",
        urgency: "Medium",
        customerNeed: "Information or assistance",
      },
      "disposition analysis": {
        disposition: "Incomplete",
        confidence: 50,
        reasoning: "Default response due to parsing error",
        category: "General",
        outcome: "Requires follow-up",
        nextSteps: ["Review call recording", "Follow up with customer"],
        followUpRequired: true,
        customerSatisfaction: "Medium",
      },
      "facts analysis": {
        keyFacts: ["Call analysis completed with limited data"],
        customerInfo: {},
        productsMentioned: [],
        pricesDiscussed: [],
        timeframes: [],
        commitments: [],
        objections: [],
        competitorsMentioned: [],
        technicalDetails: [],
        businessRequirements: [],
      },
      "sentiment analysis": {
        overallSentiment: "Neutral",
        agentSentiment: "Neutral",
        customerSentiment: "Neutral",
        confidence: 50,
        emotionalJourney: "Unable to determine emotional progression",
        keyMoments: [],
      },
      "quality analysis": {
        overallScore: 50,
        communicationClarity: 50,
        professionalism: 50,
        empathy: 50,
        problemSolving: 50,
        productKnowledge: 50,
        callControl: 50,
        strengths: ["Professional demeanor"],
        improvementAreas: ["Requires detailed analysis"],
        coachingRecommendations: ["Review call recording for detailed feedback"],
      },
      "business analysis": {
        conversionPotential: 50,
        buyingSignals: [],
        riskFactors: ["Incomplete analysis"],
        valueProposition: "Requires evaluation",
        competitivePosition: "Unknown",
        nextBestActions: ["Complete detailed analysis"],
        estimatedDealSize: "To be determined",
        timeToClose: "Unknown",
      },
    }

    return defaults[analysisType] || {}
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return await this.openRouter.testConnection()
  }
}

// Export singleton instance
export const openRouterAnalyzer = new OpenRouterComprehensiveAnalyzer()
