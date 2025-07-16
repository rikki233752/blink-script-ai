"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { extractFullNameFromTranscript, extractTitleFromTranscript, isValidName } from "@/lib/name-extraction-utils"

export function NameExtractionTester() {
  const [transcript, setTranscript] = useState("")
  const [extractedName, setExtractedName] = useState("")
  const [extractedTitle, setExtractedTitle] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  const handleExtract = () => {
    const name = extractFullNameFromTranscript(transcript)
    const title = extractTitleFromTranscript(transcript)
    const valid = isValidName(name)

    setExtractedName(name)
    setExtractedTitle(title)
    setIsValid(valid)

    // Generate debug information
    const patterns = [
      /(?:my name is|i'm|this is|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
      /(?:hello|hi|hey|good morning|good afternoon|good evening)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})[\s,.]/gi,
      /(?:mr\.|mrs\.|ms\.|dr\.|miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
      /(?:thank you|thanks),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})\s+(?:speaking|here)/gi,
      /this is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+from/gi,
      /(?:transfer you to|speak with|connect you to|speak to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})/gi,
    ]

    const patternMatches: Record<string, string[]> = {}

    patterns.forEach((pattern, index) => {
      const matches: string[] = []
      const regex = new RegExp(pattern)
      let match

      // Reset regex lastIndex
      regex.lastIndex = 0

      // Find all matches
      while ((match = regex.exec(transcript)) !== null) {
        if (match[1]) {
          matches.push(match[1])
        }
      }

      patternMatches[`Pattern ${index + 1}`] = matches
    })

    setDebugInfo({
      patternMatches,
      finalName: name,
      title,
      isValid: valid,
    })
  }

  const handleClear = () => {
    setTranscript("")
    setExtractedName("")
    setExtractedTitle("")
    setIsValid(false)
    setDebugInfo({})
  }

  const sampleTranscripts = [
    "Hello, my name is John Smith and I'm calling about your services.",
    "Good morning, this is Sarah Johnson from Acme Corp. How can I help you today?",
    "Hi, I'm calling to speak with Dr. Robert Williams about my appointment.",
    "Thank you for calling support, this is Michael speaking. How may I assist you?",
    "Hello Mrs. Anderson, I'm calling regarding your recent purchase.",
    "I'd like to speak with James, please. This is Thomas calling.",
  ]

  const handleUseSample = (sample: string) => {
    setTranscript(sample)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Name Extraction Tester</CardTitle>
        <CardDescription>Test the name extraction algorithm with different transcript samples</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Call Transcript</label>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Enter call transcript text here..."
            className="min-h-[150px]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {sampleTranscripts.map((sample, index) => (
            <Button key={index} variant="outline" size="sm" onClick={() => handleUseSample(sample)}>
              Sample {index + 1}
            </Button>
          ))}
        </div>

        {extractedName && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Extraction Results:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Extracted Name:</div>
              <div className={`text-sm ${isValid ? "text-green-600" : "text-red-600"}`}>
                {extractedName || "None found"}
              </div>

              <div className="text-sm font-medium">Title:</div>
              <div className="text-sm">{extractedTitle || "None found"}</div>

              <div className="text-sm font-medium">Full Name:</div>
              <div className="text-sm font-medium">
                {extractedTitle && extractedName ? `${extractedTitle} ${extractedName}` : extractedName}
              </div>

              <div className="text-sm font-medium">Validation:</div>
              <div className={`text-sm ${isValid ? "text-green-600" : "text-red-600"}`}>
                {isValid ? "Valid name" : "Invalid or uncertain name"}
              </div>
            </div>
          </div>
        )}

        {Object.keys(debugInfo).length > 0 && (
          <div className="mt-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium">Show Debug Information</summary>
              <div className="mt-2 p-3 bg-slate-50 rounded text-xs overflow-auto max-h-[300px]">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button onClick={handleExtract}>Extract Name</Button>
      </CardFooter>
    </Card>
  )
}
