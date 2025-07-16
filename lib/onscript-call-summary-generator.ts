import type { IntentAnalysis, DispositionAnalysis } from "./intent-disposition-utils"
import type { SentimentAnalysis } from "./sentiment-analysis"
import { extractFullNameFromTranscript, extractTitleFromTranscript } from "./name-extraction-utils"

export interface OnScriptCallSummary {
  id: string
  callId: string
  generatedAt: string

  // Main Summary - comprehensive paragraph like OnScript
  summary: string

  // Topics Covered - simple bullet list
  topicsCovered: string[]

  // Key Takeaways - important facts and insights
  keyTakeaways: string[]

  // Call Conclusion - how the call ended
  callConclusion: string

  // Call Details - specific events and information shared
  callDetails: string[]

  // Call Followup Items - action items
  callFollowupItems: string[]
}

export interface CallTranscriptData {
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
    businessConversion?: any
    agentPerformance?: any
  }
}

export class OnScriptCallSummaryGenerator {
  /**
   * Generate OnScript-style call summary from transcript and analysis
   */
  static generateOnScriptSummary(data: CallTranscriptData): OnScriptCallSummary {
    const callId = `call_${Date.now()}`
    const timestamp = new Date().toISOString()

    console.log("🎯 Generating OnScript-style call summary...")

    // Extract participants from transcript
    const participants = this.extractParticipants(data.transcript, data.fileName)

    // Generate comprehensive summary paragraph
    const summary = this.generateComprehensiveSummary(data, participants)

    // Extract topics covered from transcript
    const topicsCovered = this.extractTopicsCovered(data.transcript)

    // Generate key takeaways from actual conversation
    const keyTakeaways = this.generateKeyTakeaways(data.transcript, participants)

    // Generate call conclusion
    const callConclusion = this.generateCallConclusion(data.transcript, participants)

    // Extract specific call details
    const callDetails = this.extractCallDetails(data.transcript, participants)

    // Generate follow-up items
    const callFollowupItems = this.generateFollowupItems(data.transcript, participants)

    const summary_obj: OnScriptCallSummary = {
      id: `onscript_summary_${callId}`,
      callId,
      generatedAt: timestamp,
      summary,
      topicsCovered,
      keyTakeaways,
      callConclusion,
      callDetails,
      callFollowupItems,
    }

    console.log("✅ OnScript-style summary generated successfully")
    return summary_obj
  }

  /**
   * Extract participant names from transcript
   */
  private static extractParticipants(
    transcript: string,
    fileName: string,
  ): {
    agents: string[]
    customer: string
    customerTitle?: string
  } {
    const agents: string[] = []
    let customer = "Customer"
    let customerTitle = ""

    // Use our utility function to extract the customer name
    const extractedName = extractFullNameFromTranscript(transcript)
    if (extractedName) {
      customer = extractedName
    }

    // Extract title if available
    const title = extractTitleFromTranscript(transcript)
    if (title) {
      customerTitle = title
    }

    // Look for agent names in transcript
    const agentPatterns = [
      /(?:agent|rep|representative)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /(?:my name is|i'm|this is|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[,.\s]+(?:and I'll|I'm|and I'm|I will)/gi,
      /([A-Z][a-z]+)\s+(?:speaking|here|from)/gi,
    ]

    agentPatterns.forEach((pattern) => {
      const matches = transcript.matchAll(pattern)
      for (const match of matches) {
        const name = match[1]?.trim()
        if (name && name.length > 1 && !agents.includes(name)) {
          agents.push(name)
        }
      }
    })

    // Fallback to filename extraction
    if (agents.length === 0) {
      const fileAgentMatch = fileName.match(/agent[_-]([A-Za-z]+)/i)
      if (fileAgentMatch) {
        agents.push(fileAgentMatch[1])
      } else {
        agents.push("Agent")
      }
    }

    return {
      agents: agents.slice(0, 2), // Limit to 2 agents max
      customer: customerTitle ? `${customerTitle} ${customer}` : customer,
      customerTitle,
    }
  }

  /**
   * Generate comprehensive summary paragraph like OnScript
   */
  private static generateComprehensiveSummary(data: CallTranscriptData, participants: any): string {
    const transcript = data.transcript.toLowerCase()
    const customer = participants.customer
    const primaryAgent = participants.agents[0] || "the agent"
    const secondaryAgent = participants.agents[1]

    // Determine call purpose/topic
    let callPurpose = "general inquiry"
    let mainTopic = ""
    let specificDetails = ""

    // Healthcare/Medicare patterns
    if (transcript.includes("medicare") || transcript.includes("medicaid")) {
      callPurpose = "exploring Medicare benefits"
      if (transcript.includes("advantage")) mainTopic = "Medicare Advantage plans"
      if (transcript.includes("medicaid")) specificDetails = "including potential Medicaid application"
      if (transcript.includes("spending card") || transcript.includes("grocery")) {
        specificDetails += specificDetails
          ? " and a potential spending card for groceries"
          : "including a potential spending card for groceries"
      }
    }
    // Insurance patterns
    else if (transcript.includes("insurance") || transcript.includes("policy")) {
      callPurpose = "discussing insurance options"
      if (transcript.includes("health")) mainTopic = "health insurance"
      if (transcript.includes("life")) mainTopic = "life insurance"
      if (transcript.includes("auto")) mainTopic = "auto insurance"
    }
    // Sales patterns
    else if (transcript.includes("product") || transcript.includes("service") || transcript.includes("offer")) {
      callPurpose = "discussing product/service offerings"
      if (transcript.includes("upgrade")) specificDetails = "including potential upgrades"
      if (transcript.includes("discount") || transcript.includes("deal")) {
        specificDetails += specificDetails ? " and available discounts" : "including available discounts"
      }
    }
    // Support patterns
    else if (transcript.includes("problem") || transcript.includes("issue") || transcript.includes("help")) {
      callPurpose = "addressing customer support needs"
      if (transcript.includes("technical")) mainTopic = "technical issues"
      if (transcript.includes("billing")) mainTopic = "billing concerns"
    }

    // Extract current status/enrollment
    let currentStatus = ""
    if (transcript.includes("currently enrolled") || transcript.includes("current plan")) {
      const enrollmentMatch = transcript.match(/currently enrolled in ([^.]+)/i)
      if (enrollmentMatch) {
        currentStatus = `, who is currently enrolled in ${enrollmentMatch[1]}`
      }
    }

    // Build the summary
    let summary = `The call is about ${callPurpose} for ${customer}${currentStatus}. `

    if (secondaryAgent) {
      summary += `The agent, ${primaryAgent}, and later ${secondaryAgent}, guide ${customer.split(" ").pop()} through the process`
    } else {
      summary += `The agent, ${primaryAgent}, guides ${customer.split(" ").pop()} through the process`
    }

    if (mainTopic) {
      summary += ` of understanding ${mainTopic}`
    } else {
      summary += ` of understanding their options`
    }

    if (specificDetails) {
      summary += `, ${specificDetails}`
    }

    // Add conversation insights
    if (transcript.includes("eligibility")) {
      summary += ". The conversation reveals eligibility requirements and available benefits"
    }

    if (transcript.includes("application") || transcript.includes("apply")) {
      summary += ". The discussion includes application processes and next steps"
    }

    summary += "."

    return summary
  }

  /**
   * Extract topics covered from transcript
   */
  private static extractTopicsCovered(transcript: string): string[] {
    const topics: string[] = []
    const text = transcript.toLowerCase()

    // Define topic detection patterns
    const topicPatterns = {
      "Medicare benefits": ["medicare benefit", "medicare coverage", "medicare plan"],
      "Medicare Advantage plans": ["medicare advantage", "advantage plan", "ma plan"],
      Medicaid: ["medicaid", "state insurance", "low income insurance"],
      "Spending cards for groceries": ["spending card", "grocery card", "food benefit", "grocery benefit"],
      "Health insurance": ["health insurance", "medical coverage", "health plan"],
      "Life insurance": ["life insurance", "life policy", "life coverage"],
      "Prescription coverage": ["prescription", "drug coverage", "medication", "pharmacy"],
      "Dental coverage": ["dental", "teeth", "dental plan"],
      "Vision coverage": ["vision", "eye", "glasses", "vision plan"],
      "Premium costs": ["premium", "monthly cost", "payment", "cost"],
      Deductibles: ["deductible", "out of pocket", "copay"],
      "Provider networks": ["network", "doctor", "provider", "physician"],
      "Enrollment periods": ["enrollment", "open enrollment", "sign up period"],
      "Eligibility requirements": ["eligible", "qualify", "qualification", "requirement"],
      "Application process": ["application", "apply", "sign up", "enroll"],
      "Customer service": ["customer service", "support", "help", "assistance"],
      "Billing questions": ["billing", "invoice", "payment", "charge"],
      "Technical support": ["technical", "website", "online", "computer"],
      "Account management": ["account", "profile", "login", "password"],
    }

    // Check for each topic
    Object.entries(topicPatterns).forEach(([topic, keywords]) => {
      if (keywords.some((keyword) => text.includes(keyword))) {
        topics.push(topic)
      }
    })

    // Extract company/plan names mentioned
    const companyPatterns = [
      /humana/gi,
      /aetna/gi,
      /cigna/gi,
      /blue cross/gi,
      /united healthcare/gi,
      /kaiser/gi,
      /anthem/gi,
    ]

    companyPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        const company = matches[0]
        if (!topics.some((topic) => topic.toLowerCase().includes(company.toLowerCase()))) {
          topics.push(company.charAt(0).toUpperCase() + company.slice(1).toLowerCase())
        }
      }
    })

    // Extract state-specific programs
    const statePatterns = [/texas medicaid/gi, /california medicaid/gi, /florida medicaid/gi, /new york medicaid/gi]

    statePatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        topics.push(matches[0])
      }
    })

    return topics.slice(0, 8) // Limit to most relevant topics
  }

  /**
   * Generate key takeaways from actual conversation
   */
  private static generateKeyTakeaways(transcript: string, participants: any): string[] {
    const takeaways: string[] = []
    const text = transcript.toLowerCase()
    const customer = participants.customer
    const customerLastName = customer.split(" ").pop()

    // Extract current enrollment status
    const enrollmentPatterns = [
      /currently enrolled in ([^.]+)/i,
      /has ([^.]+) as (?:his|her|their) plan/i,
      /member of ([^.]+)/i,
    ]

    enrollmentPatterns.forEach((pattern) => {
      const match = transcript.match(pattern)
      if (match) {
        takeaways.push(`${customerLastName} is currently enrolled in ${match[1].trim()}.`)
      }
    })

    // Extract benefit information
    if (text.includes("spending card") && text.includes("groceries")) {
      takeaways.push(
        `Applying for Medicaid may provide ${customerLastName} with extra benefits, including a spending card for groceries.`,
      )
    }

    // Extract recommendations
    const recommendationPatterns = [
      /recommend(?:s)? that ([^.]+)/i,
      /suggest(?:s)? that ([^.]+)/i,
      /advise(?:s)? ([^.]+)/i,
    ]

    recommendationPatterns.forEach((pattern) => {
      const match = transcript.match(pattern)
      if (match) {
        const recommendation = match[1].trim()
        if (recommendation.length > 10) {
          takeaways.push(
            `${participants.agents[participants.agents.length - 1] || "Agent"} recommends that ${recommendation}.`,
          )
        }
      }
    })

    // Extract contact information provided
    if (text.includes("direct line") || text.includes("phone number")) {
      const agent = participants.agents[participants.agents.length - 1] || "the agent"
      takeaways.push(`${agent} provides ${customerLastName} with a direct line for follow-up.`)
    }

    // Extract eligibility information
    const eligibilityMatch = transcript.match(/eligible for ([^.]+)/i)
    if (eligibilityMatch) {
      takeaways.push(`${customerLastName} may be eligible for ${eligibilityMatch[1].trim()}.`)
    }

    // Extract plan information
    const planPatterns = [/medicare part[s]? ([ab]) and ([ab])/i, /medicare advantage plan/i, /supplemental insurance/i]

    planPatterns.forEach((pattern) => {
      const match = transcript.match(pattern)
      if (match && !takeaways.some((t) => t.includes(match[0]))) {
        takeaways.push(`Discussion includes ${match[0].toLowerCase()} coverage options.`)
      }
    })

    return takeaways.slice(0, 5) // Limit to most important takeaways
  }

  /**
   * Generate call conclusion
   */
  private static generateCallConclusion(transcript: string, participants: any): string {
    const text = transcript.toLowerCase()
    const customer = participants.customer
    const customerLastName = customer.split(" ").pop()
    const finalAgent = participants.agents[participants.agents.length - 1] || "the agent"

    let conclusion = `The call concludes with ${customerLastName} being advised to `

    // Determine main action
    if (text.includes("apply for medicaid")) {
      conclusion += "apply for Medicaid to potentially receive extra benefits"
      if (text.includes("spending card")) {
        conclusion += ", including a spending card"
      }
    } else if (text.includes("application") || text.includes("apply")) {
      conclusion += "complete an application for additional benefits"
    } else if (text.includes("follow up") || text.includes("call back")) {
      conclusion += "follow up for additional information"
    } else {
      conclusion += "consider the discussed options"
    }

    conclusion += ". "

    // Add contact information
    if (text.includes("direct line") || text.includes("phone number")) {
      conclusion += `${finalAgent} provides ${customerLastName === customer ? "the customer" : customerLastName} with a direct line for follow-up`
    }

    // Add well wishes
    if (text.includes("good luck") || text.includes("best of luck")) {
      conclusion += ` and wishes ${customerLastName} the best of luck with the application.`
    } else if (text.includes("thank") || text.includes("appreciate")) {
      conclusion += " and thanks them for their time."
    } else {
      conclusion += "."
    }

    return conclusion
  }

  /**
   * Extract specific call details with enhanced context analysis
   */
  private static extractCallDetails(transcript: string, participants: any): string[] {
    const details: string[] = []
    const text = transcript.toLowerCase()
    const originalTranscript = transcript // Keep original case for extraction
    const customer = participants.customer
    const customerFirstName = customer.split(" ")[0]
    const customerLastName = customer.split(" ").pop()

    console.log("🔍 Extracting detailed call information...")

    // Extract prospect information and current enrollment
    const prospectPatterns = [
      // Current enrollment patterns
      /([^.]*(?:currently enrolled|has|member of)[^.]*(?:medicare|medicaid|insurance|plan)[^.]*)/gi,
      /([^.]*(?:medicare|medicaid)[^.]*(?:part[s]?\s*[ab]|advantage|supplement)[^.]*)/gi,
      // Plan information
      /([^.]*(?:humana|aetna|cigna|blue cross|united healthcare|kaiser|anthem)[^.]*(?:plan|insurance|coverage)[^.]*)/gi,
      // Prospect identification
      /([^.]*(?:prospect|customer|caller)[^.]*(?:is|named)[^.]*)/gi,
    ]

    prospectPatterns.forEach((pattern) => {
      const matches = originalTranscript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const cleanMatch = match.trim()
          if (
            cleanMatch.length > 20 &&
            !details.some((d) => d.toLowerCase().includes(cleanMatch.toLowerCase().substring(0, 30)))
          ) {
            // Capitalize first letter and ensure proper formatting
            const formattedDetail = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)
            if (!formattedDetail.endsWith(".")) {
              details.push(formattedDetail + ".")
            } else {
              details.push(formattedDetail)
            }
          }
        })
      }
    })

    // Extract agent introductions and handoffs
    const agentPatterns = [
      // Agent introductions
      /([^.]*(?:agent|representative|my name is)[^.]*(?:introduces|explains|purpose)[^.]*)/gi,
      /([^.]*(?:licensed officer|specialist|advisor)[^.]*(?:takes over|discusses|handles)[^.]*)/gi,
      // Call purpose and explanations
      /([^.]*(?:explains|discusses|purpose of)[^.]*(?:call|conversation|benefits)[^.]*)/gi,
      // Agent actions
      /([^.]*(?:provides|gives|offers)[^.]*(?:phone number|contact|information|direct line)[^.]*)/gi,
    ]

    agentPatterns.forEach((pattern) => {
      const matches = originalTranscript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const cleanMatch = match.trim()
          if (
            cleanMatch.length > 20 &&
            !details.some((d) => d.toLowerCase().includes(cleanMatch.toLowerCase().substring(0, 30)))
          ) {
            const formattedDetail = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)
            if (!formattedDetail.endsWith(".")) {
              details.push(formattedDetail + ".")
            } else {
              details.push(formattedDetail)
            }
          }
        })
      }
    })

    // Extract customer interests and needs
    const customerInterestPatterns = [
      // Customer interests
      /([^.]*(?:interested in|looking for|wants|needs)[^.]*(?:benefits|coverage|plan|card|assistance)[^.]*)/gi,
      /([^.]*(?:exploring|considering|thinking about)[^.]*(?:additional|extra|more)[^.]*)/gi,
      // Specific benefits mentioned
      /([^.]*(?:spending card|grocery|food|dental|vision|prescription)[^.]*)/gi,
    ]

    customerInterestPatterns.forEach((pattern) => {
      const matches = originalTranscript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const cleanMatch = match.trim()
          if (
            cleanMatch.length > 20 &&
            !details.some((d) => d.toLowerCase().includes(cleanMatch.toLowerCase().substring(0, 30)))
          ) {
            const formattedDetail = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)
            if (!formattedDetail.endsWith(".")) {
              details.push(formattedDetail + ".")
            } else {
              details.push(formattedDetail)
            }
          }
        })
      }
    })

    // Extract specific recommendations and explanations
    const recommendationPatterns = [
      // Agent recommendations
      /([^.]*(?:recommends|suggests|advises)[^.]*(?:applying|getting|signing up)[^.]*)/gi,
      /([^.]*(?:explains that|mentions that|states that)[^.]*(?:medicare|medicaid|plans|benefits)[^.]*)/gi,
      // Eligibility and requirements
      /([^.]*(?:eligible|qualify|qualifies)[^.]*(?:for|to receive)[^.]*)/gi,
      /([^.]*(?:does not have|doesn't have|lacks)[^.]*(?:medicaid|coverage|benefits)[^.]*)/gi,
    ]

    recommendationPatterns.forEach((pattern) => {
      const matches = originalTranscript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const cleanMatch = match.trim()
          if (
            cleanMatch.length > 20 &&
            !details.some((d) => d.toLowerCase().includes(cleanMatch.toLowerCase().substring(0, 30)))
          ) {
            const formattedDetail = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)
            if (!formattedDetail.endsWith(".")) {
              details.push(formattedDetail + ".")
            } else {
              details.push(formattedDetail)
            }
          }
        })
      }
    })

    // Extract contact information and follow-up details
    const contactPatterns = [
      /([^.]*(?:provides|gives)[^.]*(?:phone number|contact|direct line)[^.]*(?:texas medicaid|medicaid|follow.?up)[^.]*)/gi,
      /([^.]*(?:phone number|contact information|direct line)[^.]*(?:for|to)[^.]*)/gi,
    ]

    contactPatterns.forEach((pattern) => {
      const matches = originalTranscript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const cleanMatch = match.trim()
          if (
            cleanMatch.length > 20 &&
            !details.some((d) => d.toLowerCase().includes(cleanMatch.toLowerCase().substring(0, 30)))
          ) {
            const formattedDetail = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)
            if (!formattedDetail.endsWith(".") && !formattedDetail.endsWith("?")) {
              details.push(formattedDetail + ".")
            } else {
              details.push(formattedDetail)
            }
          }
        })
      }
    })

    // If we have specific names, try to extract more contextual details
    if (participants.customer !== "Customer") {
      const nameBasedPatterns = [
        new RegExp(`([^.]*${customerFirstName}[^.]*(?:is|has|wants|needs|interested)[^.]*)`, "gi"),
        new RegExp(`([^.]*${customerLastName}[^.]*(?:is|has|wants|needs|interested)[^.]*)`, "gi"),
      ]

      nameBasedPatterns.forEach((pattern) => {
        const matches = originalTranscript.match(pattern)
        if (matches) {
          matches.forEach((match) => {
            const cleanMatch = match.trim()
            if (
              cleanMatch.length > 20 &&
              cleanMatch.length < 200 &&
              !details.some((d) => d.toLowerCase().includes(cleanMatch.toLowerCase().substring(0, 30)))
            ) {
              const formattedDetail = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)
              if (!formattedDetail.endsWith(".")) {
                details.push(formattedDetail + ".")
              } else {
                details.push(formattedDetail)
              }
            }
          })
        }
      })
    }

    // Extract agent names and their actions
    participants.agents.forEach((agentName) => {
      const agentPatterns = [
        new RegExp(
          `([^.]*${agentName}[^.]*(?:explains|discusses|provides|recommends|takes over|introduces)[^.]*)`,
          "gi",
        ),
      ]

      agentPatterns.forEach((pattern) => {
        const matches = originalTranscript.match(pattern)
        if (matches) {
          matches.forEach((match) => {
            const cleanMatch = match.trim()
            if (
              cleanMatch.length > 20 &&
              cleanMatch.length < 200 &&
              !details.some((d) => d.toLowerCase().includes(cleanMatch.toLowerCase().substring(0, 30)))
            ) {
              const formattedDetail = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)
              if (!formattedDetail.endsWith(".")) {
                details.push(formattedDetail + ".")
              } else {
                details.push(formattedDetail)
              }
            }
          })
        }
      })
    })

    // Remove duplicates and sort by relevance
    const uniqueDetails = details.filter(
      (detail, index, self) =>
        index === self.findIndex((d) => d.toLowerCase().substring(0, 50) === detail.toLowerCase().substring(0, 50)),
    )

    // Sort details by importance (prospect info first, then agent actions, then recommendations)
    const sortedDetails = uniqueDetails.sort((a, b) => {
      const aLower = a.toLowerCase()
      const bLower = b.toLowerCase()

      // Prospect information first
      if (
        aLower.includes("prospect") ||
        aLower.includes("enrolled") ||
        aLower.includes("medicare") ||
        aLower.includes("plan")
      ) {
        if (
          !(
            bLower.includes("prospect") ||
            bLower.includes("enrolled") ||
            bLower.includes("medicare") ||
            bLower.includes("plan")
          )
        ) {
          return -1
        }
      }

      // Agent actions second
      if (aLower.includes("agent") || aLower.includes("introduces") || aLower.includes("takes over")) {
        if (!(bLower.includes("agent") || bLower.includes("introduces") || bLower.includes("takes over"))) {
          return -1
        }
      }

      return 0
    })

    console.log(`✅ Extracted ${sortedDetails.length} detailed call points`)
    return sortedDetails.slice(0, 12) // Limit to most relevant details
  }

  /**
   * Generate follow-up items
   */
  private static generateFollowupItems(transcript: string, participants: any): string[] {
    const followupItems: string[] = []
    const text = transcript.toLowerCase()
    const customer = participants.customer
    const customerLastName = customer.split(" ").pop()

    // Extract application follow-ups
    if (text.includes("apply for medicaid") || text.includes("medicaid application")) {
      followupItems.push(`${customerLastName} to apply for Medicaid through Texas Medicaid.`)
    }

    // Extract callback follow-ups
    if (text.includes("call back") || text.includes("follow up call")) {
      const agent = participants.agents[participants.agents.length - 1] || "the agent"
      followupItems.push(
        `${customerLastName} to call ${agent} back if approved for Medicaid to discuss additional benefits.`,
      )
    }

    // Extract contact follow-ups
    if (text.includes("direct line") || text.includes("phone number")) {
      followupItems.push(`${customerLastName} has direct contact information for future inquiries.`)
    }

    // Extract documentation follow-ups
    if (text.includes("paperwork") || text.includes("documents")) {
      followupItems.push(`${customerLastName} to complete required documentation.`)
    }

    // Extract appointment follow-ups
    if (text.includes("appointment") || text.includes("meeting")) {
      followupItems.push(`Schedule follow-up appointment to review application status.`)
    }

    // Extract benefit review follow-ups
    if (text.includes("review benefits") || text.includes("additional benefits")) {
      followupItems.push(`Review additional benefits once Medicaid application is processed.`)
    }

    return followupItems.slice(0, 4) // Limit to most important follow-ups
  }
}
