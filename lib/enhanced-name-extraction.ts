/**
 * Enhanced name extraction utilities for call center transcripts
 * Specifically designed to replace mock data with real extracted names
 */

export interface NameExtractionResult {
  fullName: string
  firstName: string
  lastName: string
  title: string
  confidence: number
  extractionMethod: string
  isValid: boolean
}

export interface NameExtractionOptions {
  preferCustomerNames: boolean
  includeAgentNames: boolean
  minimumConfidence: number
  validateNames: boolean
}

/**
 * Advanced name extraction with confidence scoring and validation
 */
export class EnhancedNameExtractor {
  private static readonly DEFAULT_OPTIONS: NameExtractionOptions = {
    preferCustomerNames: true,
    includeAgentNames: false,
    minimumConfidence: 0.6,
    validateNames: true,
  }

  /**
   * Extract prospect name with high confidence scoring
   */
  static extractProspectName(transcript: string, options: Partial<NameExtractionOptions> = {}): NameExtractionResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }

    if (!transcript || transcript.trim().length === 0) {
      return this.createEmptyResult()
    }

    console.log("🔍 Starting enhanced name extraction for prospect...")

    // Get all potential names with confidence scores
    const candidates = this.getAllNameCandidates(transcript)

    // Filter and score candidates
    const validCandidates = candidates
      .filter((candidate) => candidate.confidence >= opts.minimumConfidence)
      .filter((candidate) => (opts.validateNames ? this.validateName(candidate.fullName) : true))
      .filter((candidate) => (opts.preferCustomerNames ? this.isLikelyCustomer(candidate, transcript) : true))

    if (validCandidates.length === 0) {
      console.warn("⚠️ No valid name candidates found in transcript")
      return this.createEmptyResult()
    }

    // Select the best candidate
    const bestCandidate = validCandidates.sort((a, b) => b.confidence - a.confidence)[0]

    console.log(`✅ Extracted prospect name: "${bestCandidate.fullName}" (confidence: ${bestCandidate.confidence})`)

    return bestCandidate
  }

  /**
   * Get all potential name candidates with confidence scores
   */
  private static getAllNameCandidates(transcript: string): NameExtractionResult[] {
    const candidates: NameExtractionResult[] = []

    // Pattern 1: Direct self-introduction (highest confidence)
    const selfIntroPatterns = [
      {
        pattern: /(?:my name is|i'm|this is|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
        confidence: 0.95,
        method: "self_introduction",
      },
      {
        pattern: /(?:you can call me|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        confidence: 0.9,
        method: "call_me",
      },
    ]

    selfIntroPatterns.forEach(({ pattern, confidence, method }) => {
      const matches = Array.from(transcript.matchAll(pattern))
      matches.forEach((match) => {
        if (match[1]) {
          candidates.push(this.createNameResult(match[1], confidence, method))
        }
      })
    })

    // Pattern 2: Formal address with titles (high confidence)
    const formalPatterns = [
      {
        pattern: /(?:mr\.?|mrs\.?|ms\.?|dr\.?|miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        confidence: 0.85,
        method: "formal_title",
      },
      {
        pattern: /(?:hello|hi)\s+(?:mr\.?|mrs\.?|ms\.?|dr\.?)\s+([A-Z][a-z]+)/gi,
        confidence: 0.8,
        method: "greeting_title",
      },
    ]

    formalPatterns.forEach(({ pattern, confidence, method }) => {
      const matches = Array.from(transcript.matchAll(pattern))
      matches.forEach((match) => {
        if (match[1]) {
          // Extract title separately
          const titleMatch = transcript.match(new RegExp(`(mr\\.?|mrs\\.?|ms\\.?|dr\\.?)\\s+${match[1]}`, "i"))
          const title = titleMatch ? titleMatch[1] : ""
          candidates.push(this.createNameResult(match[1], confidence, method, title))
        }
      })
    })

    // Pattern 3: Customer identification patterns (medium-high confidence)
    const customerPatterns = [
      {
        pattern: /(?:customer|caller|prospect)\s+(?:is|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        confidence: 0.8,
        method: "customer_identification",
      },
      {
        pattern: /(?:speaking with|calling for|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        confidence: 0.75,
        method: "speaking_with",
      },
    ]

    customerPatterns.forEach(({ pattern, confidence, method }) => {
      const matches = Array.from(transcript.matchAll(pattern))
      matches.forEach((match) => {
        if (match[1]) {
          candidates.push(this.createNameResult(match[1], confidence, method))
        }
      })
    })

    // Pattern 4: Contextual name mentions (medium confidence)
    const contextualPatterns = [
      { pattern: /(?:thank you|thanks),?\s+([A-Z][a-z]+)/gi, confidence: 0.7, method: "thank_you" },
      { pattern: /(?:help|assist)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, confidence: 0.65, method: "help_context" },
      { pattern: /([A-Z][a-z]+),?\s+(?:how can|what can|may I)/gi, confidence: 0.6, method: "question_context" },
    ]

    contextualPatterns.forEach(({ pattern, confidence, method }) => {
      const matches = Array.from(transcript.matchAll(pattern))
      matches.forEach((match) => {
        if (match[1]) {
          candidates.push(this.createNameResult(match[1], confidence, method))
        }
      })
    })

    // Pattern 5: Phone/contact context (medium confidence)
    const contactPatterns = [
      {
        pattern: /(?:phone number|contact)\s+for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        confidence: 0.7,
        method: "contact_context",
      },
      {
        pattern: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at|phone|number)/gi,
        confidence: 0.65,
        method: "phone_context",
      },
    ]

    contactPatterns.forEach(({ pattern, confidence, method }) => {
      const matches = Array.from(transcript.matchAll(pattern))
      matches.forEach((match) => {
        if (match[1]) {
          candidates.push(this.createNameResult(match[1], confidence, method))
        }
      })
    })

    return candidates
  }

  /**
   * Create a name result object
   */
  private static createNameResult(
    fullName: string,
    confidence: number,
    method: string,
    title = "",
  ): NameExtractionResult {
    const cleanName = this.cleanName(fullName)
    const { firstName, lastName } = this.splitName(cleanName)

    return {
      fullName: cleanName,
      firstName,
      lastName,
      title,
      confidence,
      extractionMethod: method,
      isValid: this.validateName(cleanName),
    }
  }

  /**
   * Create empty result for when no name is found
   */
  private static createEmptyResult(): NameExtractionResult {
    return {
      fullName: "",
      firstName: "",
      lastName: "",
      title: "",
      confidence: 0,
      extractionMethod: "none",
      isValid: false,
    }
  }

  /**
   * Clean and format extracted name
   */
  private static cleanName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ")
  }

  /**
   * Split full name into first and last name
   */
  private static splitName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) return { firstName: "", lastName: "" }

    const parts = fullName.trim().split(/\s+/)

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" }
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    }
  }

  /**
   * Validate if extracted text is a real name
   */
  private static validateName(name: string): boolean {
    if (!name || name.length < 2) return false

    // Check for invalid characters
    if (/[0-9@#$%^&*()_+=[\]{}|\\:;"'<>,.?/]/.test(name)) return false

    // Check for common non-name words
    const nonNameWords = [
      "hello",
      "hi",
      "hey",
      "yes",
      "no",
      "okay",
      "right",
      "sure",
      "thanks",
      "thank",
      "speaking",
      "calling",
      "help",
      "assist",
      "customer",
      "service",
      "support",
      "agent",
      "representative",
    ]

    const lowerName = name.toLowerCase()
    if (nonNameWords.includes(lowerName)) return false

    // Check for minimum realistic name length
    if (name.replace(/\s/g, "").length < 2) return false

    // Check for reasonable name patterns
    if (!/^[A-Za-z\s'-]+$/.test(name)) return false

    return true
  }

  /**
   * Determine if a name candidate is likely a customer vs agent
   */
  private static isLikelyCustomer(candidate: NameExtractionResult, transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase()
    const lowerName = candidate.fullName.toLowerCase()

    // Agent indicators (reduce confidence if found)
    const agentIndicators = [
      `my name is ${lowerName}.*(?:how can I help|may I assist|from|representative)`,
      `this is ${lowerName} from`,
      `${lowerName} speaking.*(?:how may I|customer service|support)`,
    ]

    // Customer indicators (increase confidence if found)
    const customerIndicators = [
      `help ${lowerName}`,
      `${lowerName}.*calling about`,
      `this is ${lowerName}.*I need`,
      `${lowerName}.*looking for`,
    ]

    // Check for agent patterns
    for (const pattern of agentIndicators) {
      if (new RegExp(pattern, "i").test(lowerTranscript)) {
        return false
      }
    }

    // Check for customer patterns
    for (const pattern of customerIndicators) {
      if (new RegExp(pattern, "i").test(lowerTranscript)) {
        return true
      }
    }

    // Default: assume customer if name appears in first half of transcript
    const firstHalf = lowerTranscript.substring(0, Math.floor(lowerTranscript.length / 2))
    return firstHalf.includes(lowerName)
  }

  /**
   * Extract multiple names and rank them by likelihood of being the prospect
   */
  static extractAllProspectCandidates(transcript: string): NameExtractionResult[] {
    const candidates = this.getAllNameCandidates(transcript)

    return candidates
      .filter((candidate) => this.validateName(candidate.fullName))
      .filter((candidate) => this.isLikelyCustomer(candidate, transcript))
      .sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Get extraction statistics for debugging
   */
  static getExtractionStats(transcript: string): {
    totalCandidates: number
    validCandidates: number
    customerCandidates: number
    bestCandidate: NameExtractionResult | null
    allCandidates: NameExtractionResult[]
  } {
    const allCandidates = this.getAllNameCandidates(transcript)
    const validCandidates = allCandidates.filter((c) => this.validateName(c.fullName))
    const customerCandidates = validCandidates.filter((c) => this.isLikelyCustomer(c, transcript))
    const bestCandidate =
      customerCandidates.length > 0 ? customerCandidates.sort((a, b) => b.confidence - a.confidence)[0] : null

    return {
      totalCandidates: allCandidates.length,
      validCandidates: validCandidates.length,
      customerCandidates: customerCandidates.length,
      bestCandidate,
      allCandidates,
    }
  }
}
