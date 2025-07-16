/**
 * Utility functions for extracting names and other personal information from transcripts
 */

/**
 * Extract a full name from a transcript using multiple patterns and techniques
 * @param transcript The call transcript text
 * @returns The extracted full name or empty string if none found
 */
export function extractFullNameFromTranscript(transcript: string): string {
  if (!transcript) return ""

  const patterns = [
    // Pattern 1: "My name is [Name]" or variations
    /(?:my name is|i'm|this is|i am|speaking with|calling with|you're speaking (?:to|with))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,

    // Pattern 2: "Hello [Name], how are you?" (greeting patterns)
    /(?:hello|hi|hey|good morning|good afternoon|good evening)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})[\s,.]/gi,

    // Pattern 3: "Mr./Mrs./Ms./Dr. [Name]"
    /(?:mr\.|mrs\.|ms\.|dr\.|miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,

    // Pattern 4: "Thank you [Name]" or "Thanks [Name]"
    /(?:thank you|thanks),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})/gi,

    // Pattern 5: "[Name] speaking" or "[Name] here"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})\s+(?:speaking|here)/gi,

    // Pattern 6: "This is [Name] from [Company]"
    /this is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+from/gi,

    // Pattern 7: "I'll transfer you to [Name]"
    /(?:transfer you to|speak with|connect you to|speak to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})/gi,
  ]

  // Try each pattern and collect all potential names
  const potentialNames: string[] = []

  patterns.forEach((pattern) => {
    const matches = Array.from(transcript.matchAll(pattern))
    matches.forEach((match) => {
      if (match[1] && match[1].trim().length > 1) {
        // Clean up the name and capitalize properly
        const cleanName = match[1]
          .trim()
          .replace(/\s+/g, " ")
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ")

        potentialNames.push(cleanName)
      }
    })
  })

  // Filter out common false positives
  const filteredNames = potentialNames.filter((name) => {
    const lowerName = name.toLowerCase()
    const falsePositives = [
      "speaking",
      "calling",
      "hello",
      "thank",
      "thanks",
      "okay",
      "sure",
      "right",
      "yeah",
      "yes",
      "no",
    ]
    return !falsePositives.some((fp) => lowerName === fp)
  })

  // If we have multiple names, try to determine the most likely one
  if (filteredNames.length > 0) {
    // Count occurrences of each name
    const nameCounts = filteredNames.reduce(
      (acc, name) => {
        acc[name] = (acc[name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Sort by frequency
    const sortedNames = Object.entries(nameCounts)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])

    return sortedNames[0]
  }

  return ""
}

/**
 * Extract a person's title (Mr., Mrs., etc.) from a transcript
 * @param transcript The call transcript text
 * @returns The extracted title or empty string if none found
 */
export function extractTitleFromTranscript(transcript: string): string {
  if (!transcript) return ""

  const titlePattern = /\b(mr\.|mrs\.|ms\.|dr\.|miss)\s+[A-Z][a-z]+/gi
  const match = titlePattern.exec(transcript)

  if (match && match[1]) {
    // Capitalize the title properly
    return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
  }

  return ""
}

/**
 * Determine if a name is likely to be a customer/prospect vs an agent
 * @param name The extracted name
 * @param transcript The call transcript text
 * @returns Boolean indicating if this is likely a customer name
 */
export function isLikelyCustomerName(name: string, transcript: string): boolean {
  if (!name || !transcript) return false

  const lowerTranscript = transcript.toLowerCase()
  const lowerName = name.toLowerCase()

  // Check for agent indicators
  const agentPatterns = [
    new RegExp(`my name is ${lowerName}.*how can I help`, "i"),
    new RegExp(`this is ${lowerName} from`, "i"),
    new RegExp(`${lowerName} speaking, how may I assist`, "i"),
  ]

  // Check for customer indicators
  const customerPatterns = [
    new RegExp(`calling about.*${lowerName}`, "i"),
    new RegExp(`this is ${lowerName}, I'm calling`, "i"),
    new RegExp(`help ${lowerName} with`, "i"),
  ]

  // If any agent patterns match, it's likely an agent
  if (agentPatterns.some((pattern) => pattern.test(lowerTranscript))) {
    return false
  }

  // If any customer patterns match, it's likely a customer
  if (customerPatterns.some((pattern) => pattern.test(lowerTranscript))) {
    return true
  }

  // Default assumption based on position in transcript
  // If name appears in first third of transcript, more likely to be customer
  const firstThird = lowerTranscript.substring(0, Math.floor(lowerTranscript.length / 3))
  return firstThird.includes(lowerName)
}

/**
 * Extract both first and last name separately
 * @param fullName The full name string
 * @returns Object with firstName and lastName properties
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
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
 * Validate if a string looks like a real name
 * @param name The name to validate
 * @returns Boolean indicating if the name appears valid
 */
export function isValidName(name: string): boolean {
  if (!name) return false

  // Check minimum length
  if (name.length < 2) return false

  // Check for invalid characters
  if (/[0-9@#$%^&*()_+=[\]{}|\\:;"'<>,.?/]/.test(name)) return false

  // Check for common non-name words
  const nonNameWords = ["hello", "hi", "hey", "yes", "no", "okay", "right", "sure", "thanks", "thank", "speaking"]
  if (nonNameWords.includes(name.toLowerCase())) return false

  return true
}
