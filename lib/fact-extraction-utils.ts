export interface ExtractedFact {
  id: string
  category: "personal" | "contact" | "insurance" | "financial" | "medical" | "general"
  type: string
  value: string
  confidence: number
  context: string
  verified: boolean
  source: "transcript" | "inferred"
}

export interface PersonalInfo {
  firstName?: string
  lastName?: string
  fullName?: string
  age?: number
  dateOfBirth?: string
  gender?: string
}

export interface ContactInfo {
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
}

export interface InsuranceInfo {
  insuranceType?: string
  policyNumber?: string
  groupNumber?: string
  memberID?: string
  insuranceCompany?: string
  planName?: string
  effectiveDate?: string
  copay?: string
  deductible?: string
}

export interface FactExtractionResult {
  personalInfo: PersonalInfo
  contactInfo: ContactInfo
  insuranceInfo: InsuranceInfo
  extractedFacts: ExtractedFact[]
  confidence: number
}

export class FactExtractionService {
  private static instance: FactExtractionService

  public static getInstance(): FactExtractionService {
    if (!FactExtractionService.instance) {
      FactExtractionService.instance = new FactExtractionService()
    }
    return FactExtractionService.instance
  }

  /**
   * Extract comprehensive facts from transcript
   */
  public extractFacts(transcript: string): FactExtractionResult {
    console.log("🔍 Starting comprehensive fact extraction...")

    const extractedFacts: ExtractedFact[] = []

    // Extract personal information
    const personalInfo = this.extractPersonalInfo(transcript, extractedFacts)

    // Extract contact information
    const contactInfo = this.extractContactInfo(transcript, extractedFacts)

    // Extract insurance information
    const insuranceInfo = this.extractInsuranceInfo(transcript, extractedFacts)

    // Extract additional general facts
    this.extractGeneralFacts(transcript, extractedFacts)

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(extractedFacts)

    console.log(`✅ Extracted ${extractedFacts.length} facts with ${confidence}% confidence`)

    return {
      personalInfo,
      contactInfo,
      insuranceInfo,
      extractedFacts,
      confidence,
    }
  }

  /**
   * Extract personal information with enhanced DOB patterns
   */
  private extractPersonalInfo(transcript: string, facts: ExtractedFact[]): PersonalInfo {
    const text = transcript.toLowerCase()
    const personalInfo: PersonalInfo = {}

    // Enhanced name extraction with better agent/customer distinction
    const namePatterns = [
      /(?:my name is|i'm|i am|this is|call me)\s+([a-zA-Z\s]{2,30})/gi,
      /(?:speaking with|talking to|for)\s+([a-zA-Z\s]{2,30})/gi,
    ]

    namePatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const name = match
            .replace(/(?:my name is|i'm|i am|this is|call me|speaking with|talking to|for)\s+/gi, "")
            .trim()
          if (name.length > 1 && name.length < 50 && !name.match(/\d/)) {
            const context = this.getContext(transcript, match)

            if (name.includes(" ")) {
              const nameParts = name.split(" ")
              personalInfo.firstName = nameParts[0]
              personalInfo.lastName = nameParts[nameParts.length - 1]
              personalInfo.fullName = name
            } else {
              personalInfo.firstName = name
            }

            facts.push({
              id: `name_${Date.now()}_${Math.random()}`,
              category: "personal",
              type: "Name",
              value: name,
              confidence: 90,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    // Enhanced date of birth extraction
    const dobPatterns = [
      // Standard date formats
      /(?:date of birth|birthday|born on|dob).*?(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /(?:date of birth|birthday|born on|dob).*?(\d{1,2}-\d{1,2}-\d{4})/gi,
      /(?:date of birth|birthday|born on|dob).*?(\d{1,2}\.\d{1,2}\.\d{4})/gi,
      // Month day year format
      /(?:date of birth|birthday|born on|dob).*?(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
      // Verbal date formats
      /(?:i was born|born in|birthday is)\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /(?:i was born|born in|birthday is)\s+(\d{1,2}-\d{1,2}-\d{4})/gi,
      /(?:i was born|born in|birthday is)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
      // Just date patterns in context
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
      /\b(\d{1,2}-\d{1,2}-\d{4})\b/g,
    ]

    dobPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          let dob = match
          // Extract just the date if it's in a sentence
          const dateMatch = match.match(
            /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}|(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})/gi,
          )
          if (dateMatch) {
            dob = dateMatch[0]
          }

          const context = this.getContext(transcript, dob)
          personalInfo.dateOfBirth = dob
          facts.push({
            id: `dob_${Date.now()}_${Math.random()}`,
            category: "personal",
            type: "Date of Birth",
            value: dob,
            confidence: 95,
            context,
            verified: false,
            source: "transcript",
          })
        })
      }
    })

    // Age extraction remains the same...
    const agePatterns = [
      /(?:i am|i'm)\s+(\d{1,2})\s+years old/gi,
      /age.*?is.*?(\d{1,2})/gi,
      /(\d{1,2})\s+years of age/gi,
      /born in\s+(\d{4})/gi,
    ]

    agePatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          let age: number
          const context = this.getContext(transcript, match)

          if (match.includes("born in")) {
            const year = Number.parseInt(match.match(/\d{4}/)?.[0] || "0")
            age = new Date().getFullYear() - year
          } else {
            age = Number.parseInt(match.match(/\d{1,2}/)?.[0] || "0")
          }

          if (age > 0 && age < 120) {
            personalInfo.age = age
            facts.push({
              id: `age_${Date.now()}_${Math.random()}`,
              category: "personal",
              type: "Age",
              value: age.toString(),
              confidence: 85,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    // Extract gender
    const genderPatterns = [
      /i am (male|female|man|woman)/gi,
      /i'm a (male|female|man|woman)/gi,
      /gender is (male|female)/gi,
    ]

    genderPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          let gender = match
            .replace(/i am |i'm a |gender is /gi, "")
            .trim()
            .toLowerCase()
          const context = this.getContext(transcript, match)

          // Normalize gender values
          if (gender === "man") gender = "male"
          if (gender === "woman") gender = "female"

          personalInfo.gender = gender
          facts.push({
            id: `gender_${Date.now()}_${Math.random()}`,
            category: "personal",
            type: "Gender",
            value: gender,
            confidence: 85,
            context,
            verified: false,
            source: "transcript",
          })
        })
      }
    })

    return personalInfo
  }

  /**
   * Extract contact information (email, phone, address, city, zip)
   */
  private extractContactInfo(transcript: string, facts: ExtractedFact[]): ContactInfo {
    const contactInfo: ContactInfo = {}

    // Extract email addresses with better patterns
    const emailPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /email.*?is.*?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
      /my email.*?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
    ]

    emailPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const email = match.includes("@")
            ? match
            : match.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/)?.[0]
          if (email) {
            const context = this.getContext(transcript, email)
            contactInfo.email = email
            facts.push({
              id: `email_${Date.now()}_${Math.random()}`,
              category: "contact",
              type: "Email Address",
              value: email,
              confidence: 95,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    // Enhanced phone number extraction
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /$$\d{3}$$\s*\d{3}[-.]?\d{4}/g,
      /\b\d{10}\b/g,
      /phone.*?(?:is|number).*?(\d{3}[-.]?\d{3}[-.]?\d{4})/gi,
    ]

    phonePatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((phone) => {
          const phoneNumber = phone.replace(/phone.*?(?:is|number).*?/gi, "").trim()
          const context = this.getContext(transcript, phoneNumber)
          contactInfo.phone = phoneNumber
          facts.push({
            id: `phone_${Date.now()}_${Math.random()}`,
            category: "contact",
            type: "Phone Number",
            value: phoneNumber,
            confidence: 90,
            context,
            verified: false,
            source: "transcript",
          })
        })
      }
    })

    // Enhanced zip code extraction
    const zipPatterns = [
      /\b\d{5}(?:-\d{4})?\b/g,
      /zip.*?(?:code|is).*?(\d{5}(?:-\d{4})?)/gi,
      /postal.*?code.*?(\d{5}(?:-\d{4})?)/gi,
      /area.*?code.*?(\d{5}(?:-\d{4})?)/gi,
    ]

    zipPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const zip = match.match(/\d{5}(?:-\d{4})?/)?.[0]
          if (zip) {
            const context = this.getContext(transcript, zip)
            contactInfo.zipCode = zip
            facts.push({
              id: `zip_${Date.now()}_${Math.random()}`,
              category: "contact",
              type: "Zip Code",
              value: zip,
              confidence: 95,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    // Enhanced state extraction
    const statePatterns = [
      /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/gi,
      /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/g,
      /(?:state|live in|from|located in|residing in).*?(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)/gi,
    ]

    statePatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          let state = match
          // Extract just the state name if it's in a sentence
          const stateMatch = match.match(
            /(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)/i,
          )
          if (stateMatch) {
            state = stateMatch[0]
          }

          const context = this.getContext(transcript, state)
          contactInfo.state = state
          facts.push({
            id: `state_${Date.now()}_${Math.random()}`,
            category: "contact",
            type: "State",
            value: state,
            confidence: 90,
            context,
            verified: false,
            source: "transcript",
          })
        })
      }
    })

    // Extract cities with better filtering
    const cityPatterns = [
      /(?:live in|from|city is|located in|residing in)\s+([A-Za-z\s]{2,30})(?:\s+(?:in|,))/gi,
      /(?:city|town).*?is.*?([A-Za-z\s]{2,30})/gi,
    ]

    cityPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const city = match.replace(/(?:live in|from|city is|located in|residing in|city|town).*?(?:is)?/gi, "").trim()
          const context = this.getContext(transcript, match)

          // Filter out common false positives and validate city name
          if (
            city.length > 2 &&
            city.length < 30 &&
            !city.match(/\d/) &&
            !city.match(/^(the|and|or|in|on|at|of|for|with|by)$/i)
          ) {
            contactInfo.city = city
            facts.push({
              id: `city_${Date.now()}_${Math.random()}`,
              category: "contact",
              type: "City",
              value: city,
              confidence: 80,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    // Extract addresses
    const addressPatterns = [
      /address is (.+)/gi,
      /live at (.+)/gi,
      /\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)/gi,
    ]

    addressPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          let address = match.replace(/address is |live at /gi, "").trim()
          const context = this.getContext(transcript, match)

          // Clean up address
          address = address.split(".")[0].split(",")[0].trim()

          if (address.length > 5 && address.length < 100) {
            contactInfo.address = address
            facts.push({
              id: `address_${Date.now()}_${Math.random()}`,
              category: "contact",
              type: "Address",
              value: address,
              confidence: 80,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    return contactInfo
  }

  /**
   * Enhanced insurance information extraction including Medicare Parts A & B
   */
  private extractInsuranceInfo(transcript: string, facts: ExtractedFact[]): InsuranceInfo {
    const insuranceInfo: InsuranceInfo = {}

    // Extract Medicare Part A and Part B information
    const medicarePartPatterns = [
      /medicare\s+part\s+a.*?(yes|no|have|don't have|do have)/gi,
      /medicare\s+part\s+b.*?(yes|no|have|don't have|do have)/gi,
      /part\s+a.*?(yes|no|have|don't have|do have)/gi,
      /part\s+b.*?(yes|no|have|don't have|do have)/gi,
      /(?:do you have|have you got)\s+medicare\s+part\s+a.*?(yes|no)/gi,
      /(?:do you have|have you got)\s+medicare\s+part\s+b.*?(yes|no)/gi,
    ]

    medicarePartPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const context = this.getContext(transcript, match)
          const lowerMatch = match.toLowerCase()

          let hasIt = false
          if (lowerMatch.includes("yes") || lowerMatch.includes("do have") || lowerMatch.includes("have")) {
            hasIt = true
          }

          if (lowerMatch.includes("part a")) {
            facts.push({
              id: `medicare_part_a_${Date.now()}_${Math.random()}`,
              category: "insurance",
              type: "Medicare Part A",
              value: hasIt ? "Yes" : "No",
              confidence: 90,
              context,
              verified: false,
              source: "transcript",
            })
          }

          if (lowerMatch.includes("part b")) {
            facts.push({
              id: `medicare_part_b_${Date.now()}_${Math.random()}`,
              category: "insurance",
              type: "Medicare Part B",
              value: hasIt ? "Yes" : "No",
              confidence: 90,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    // Rest of insurance extraction remains the same...
    // Extract insurance company names
    const insuranceCompanies = [
      "blue cross",
      "blue shield",
      "aetna",
      "cigna",
      "humana",
      "united healthcare",
      "anthem",
      "kaiser",
      "medicare",
      "medicaid",
      "tricare",
      "bcbs",
      "uhc",
      "molina",
      "centene",
    ]

    insuranceCompanies.forEach((company) => {
      const pattern = new RegExp(`\\b${company}\\b`, "gi")
      if (pattern.test(transcript)) {
        const context = this.getContext(transcript, company)
        insuranceInfo.insuranceCompany = company
        facts.push({
          id: `insurance_company_${Date.now()}_${Math.random()}`,
          category: "insurance",
          type: "Insurance Company",
          value: company,
          confidence: 90,
          context,
          verified: false,
          source: "transcript",
        })
      }
    })

    // Extract policy numbers
    const policyPatterns = [
      /policy number is ([A-Za-z0-9-]+)/gi,
      /policy id ([A-Za-z0-9-]+)/gi,
      /member id is ([A-Za-z0-9-]+)/gi,
      /group number ([A-Za-z0-9-]+)/gi,
    ]

    policyPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const policyNumber = match.replace(/policy number is |policy id |member id is |group number /gi, "").trim()
          const context = this.getContext(transcript, match)

          if (policyNumber.length > 3 && policyNumber.length < 20) {
            if (match.toLowerCase().includes("member id")) {
              insuranceInfo.memberID = policyNumber
            } else if (match.toLowerCase().includes("group")) {
              insuranceInfo.groupNumber = policyNumber
            } else {
              insuranceInfo.policyNumber = policyNumber
            }

            facts.push({
              id: `policy_${Date.now()}_${Math.random()}`,
              category: "insurance",
              type: match.toLowerCase().includes("member")
                ? "Member ID"
                : match.toLowerCase().includes("group")
                  ? "Group Number"
                  : "Policy Number",
              value: policyNumber,
              confidence: 85,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    // Extract insurance types
    const insuranceTypes = [
      "hmo",
      "ppo",
      "epo",
      "pos",
      "medicare advantage",
      "medicare supplement",
      "medicaid",
      "individual",
      "group",
      "employer",
      "cobra",
      "short term",
      "catastrophic",
    ]

    insuranceTypes.forEach((type) => {
      const pattern = new RegExp(`\\b${type}\\b`, "gi")
      if (pattern.test(transcript)) {
        const context = this.getContext(transcript, type)
        insuranceInfo.insuranceType = type
        facts.push({
          id: `insurance_type_${Date.now()}_${Math.random()}`,
          category: "insurance",
          type: "Insurance Type",
          value: type,
          confidence: 80,
          context,
          verified: false,
          source: "transcript",
        })
      }
    })

    // Extract copay and deductible information
    const financialPatterns = [
      /copay is \$?(\d+)/gi,
      /co-pay \$?(\d+)/gi,
      /deductible is \$?(\d+)/gi,
      /deductible of \$?(\d+)/gi,
    ]

    financialPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const amount = match.match(/\d+/)?.[0]
          const context = this.getContext(transcript, match)

          if (amount) {
            const type =
              match.toLowerCase().includes("copay") || match.toLowerCase().includes("co-pay") ? "copay" : "deductible"
            const value = `$${amount}`

            if (type === "copay") {
              insuranceInfo.copay = value
            } else {
              insuranceInfo.deductible = value
            }

            facts.push({
              id: `${type}_${Date.now()}_${Math.random()}`,
              category: "insurance",
              type: type === "copay" ? "Copay" : "Deductible",
              value,
              confidence: 85,
              context,
              verified: false,
              source: "transcript",
            })
          }
        })
      }
    })

    return insuranceInfo
  }

  /**
   * Extract general facts and important information
   */
  private extractGeneralFacts(transcript: string, facts: ExtractedFact[]): void {
    // Extract dollar amounts
    const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g
    const moneyMatches = transcript.match(moneyPattern)
    if (moneyMatches) {
      moneyMatches.forEach((amount) => {
        const context = this.getContext(transcript, amount)
        facts.push({
          id: `money_${Date.now()}_${Math.random()}`,
          category: "financial",
          type: "Dollar Amount",
          value: amount,
          confidence: 95,
          context,
          verified: false,
          source: "transcript",
        })
      })
    }

    // Extract dates
    const datePatterns = [
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
    ]

    datePatterns.forEach((pattern) => {
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((date) => {
          const context = this.getContext(transcript, date)
          facts.push({
            id: `date_${Date.now()}_${Math.random()}`,
            category: "general",
            type: "Date",
            value: date,
            confidence: 85,
            context,
            verified: false,
            source: "transcript",
          })
        })
      }
    })

    // Extract medical information
    const medicalTerms = [
      "doctor",
      "physician",
      "hospital",
      "clinic",
      "prescription",
      "medication",
      "diagnosis",
      "treatment",
      "surgery",
      "appointment",
      "visit",
      "checkup",
    ]

    medicalTerms.forEach((term) => {
      const pattern = new RegExp(`\\b${term}\\b`, "gi")
      const matches = transcript.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const context = this.getContext(transcript, match)
          facts.push({
            id: `medical_${Date.now()}_${Math.random()}`,
            category: "medical",
            type: "Medical Term",
            value: match,
            confidence: 75,
            context,
            verified: false,
            source: "transcript",
          })
        })
      }
    })
  }

  /**
   * Get context around a matched phrase
   */
  private getContext(transcript: string, match: string, contextLength = 100): string {
    const index = transcript.toLowerCase().indexOf(match.toLowerCase())
    if (index === -1) return match

    const start = Math.max(0, index - contextLength)
    const end = Math.min(transcript.length, index + match.length + contextLength)

    return transcript.substring(start, end).trim()
  }

  /**
   * Calculate overall confidence based on extracted facts
   */
  private calculateOverallConfidence(facts: ExtractedFact[]): number {
    if (facts.length === 0) return 0

    const totalConfidence = facts.reduce((sum, fact) => sum + fact.confidence, 0)
    return Math.round(totalConfidence / facts.length)
  }
}

// Export singleton instance
export const factExtractionService = FactExtractionService.getInstance()
