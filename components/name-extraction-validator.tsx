"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { EnhancedNameExtractor, type NameExtractionResult } from "../lib/enhanced-name-extraction"
import { CheckCircle, XCircle, AlertCircle, User, Target } from "lucide-react"

const SAMPLE_TRANSCRIPTS = [
  {
    name: "Medicare Call - Alexandria Castro",
    transcript: `Hello, this is Alexandria Castro. I'm calling about Medicare benefits. I currently have Medicare Part A and B, but I'm interested in learning about additional coverage options. My phone number is 555-123-4567 and I live in Virginia.`,
    expectedName: "Alexandria Castro",
  },
  {
    name: "Insurance Inquiry - John Smith",
    transcript: `Hi, my name is John Smith and I'm looking for health insurance options. I'm currently uninsured and need coverage for my family. Can you help me understand what plans are available?`,
    expectedName: "John Smith",
  },
  {
    name: "Customer Service - Dr. Maria Rodriguez",
    transcript: `Good morning, this is Dr. Maria Rodriguez calling about my account. I need to update my contact information and have some questions about my current plan.`,
    expectedName: "Dr. Maria Rodriguez",
  },
  {
    name: "Complex Call - Multiple Names",
    transcript: `Hello, I'm calling on behalf of my mother, Mrs. Patricia Williams. She's 75 years old and currently enrolled in Medicare. My name is David Williams and I'm her son. We need help understanding her benefits.`,
    expectedName: "Patricia Williams",
  },
  {
    name: "Agent Introduction - Should Not Extract",
    transcript: `Hello, my name is Sarah Johnson and I'm a customer service representative. How can I help you today? I see you're calling about Medicare benefits.`,
    expectedName: "", // Should not extract agent name
  },
]

export function NameExtractionValidator() {
  const [customTranscript, setCustomTranscript] = useState("")
  const [extractionResult, setExtractionResult] = useState<NameExtractionResult | null>(null)
  const [extractionStats, setExtractionStats] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])

  const handleExtractName = (transcript: string) => {
    if (!transcript.trim()) return

    console.log("🧪 Testing name extraction...")

    const result = EnhancedNameExtractor.extractProspectName(transcript)
    const stats = EnhancedNameExtractor.getExtractionStats(transcript)

    setExtractionResult(result)
    setExtractionStats(stats)
  }

  const runAllTests = () => {
    console.log("🧪 Running comprehensive name extraction tests...")

    const results = SAMPLE_TRANSCRIPTS.map((test) => {
      const result = EnhancedNameExtractor.extractProspectName(test.transcript)
      const stats = EnhancedNameExtractor.getExtractionStats(test.transcript)

      const success = test.expectedName
        ? result.fullName.toLowerCase().includes(test.expectedName.toLowerCase())
        : !result.isValid || !result.fullName

      return {
        ...test,
        result,
        stats,
        success,
        actualName: result.fullName,
      }
    })

    setTestResults(results)

    const successCount = results.filter((r) => r.success).length
    console.log(`✅ Test Results: ${successCount}/${results.length} tests passed`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Name Extraction Validator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Transcript:</label>
            <Textarea
              value={customTranscript}
              onChange={(e) => setCustomTranscript(e.target.value)}
              placeholder="Enter a call transcript to test name extraction..."
              rows={4}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleExtractName(customTranscript)} disabled={!customTranscript.trim()}>
              Extract Name
            </Button>
            <Button variant="outline" onClick={runAllTests}>
              Run All Tests
            </Button>
          </div>

          {/* Extraction Result */}
          {extractionResult && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Extraction Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name:</label>
                    <p className="font-medium">{extractionResult.fullName || "None extracted"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Confidence:</label>
                    <p className="font-medium">{Math.round(extractionResult.confidence * 100)}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Method:</label>
                    <p className="font-medium">{extractionResult.extractionMethod.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Valid:</label>
                    <div className="flex items-center gap-1">
                      {extractionResult.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>{extractionResult.isValid ? "Yes" : "No"}</span>
                    </div>
                  </div>
                  {extractionResult.title && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Title:</label>
                      <p className="font-medium">{extractionResult.title}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extraction Stats */}
          {extractionStats && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Extraction Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-600">Total Candidates:</label>
                    <p>{extractionStats.totalCandidates}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Valid Candidates:</label>
                    <p>{extractionStats.validCandidates}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Customer Candidates:</label>
                    <p>{extractionStats.customerCandidates}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Best Match:</label>
                    <p>{extractionStats.bestCandidate?.fullName || "None"}</p>
                  </div>
                </div>

                {extractionStats.allCandidates.length > 0 && (
                  <div className="mt-4">
                    <label className="font-medium text-gray-600 block mb-2">All Candidates:</label>
                    <div className="space-y-1">
                      {extractionStats.allCandidates.map((candidate: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{candidate.fullName}</Badge>
                          <span className="text-gray-500">
                            {candidate.extractionMethod} ({Math.round(candidate.confidence * 100)}%)
                          </span>
                          {candidate.isValid ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Automated Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((test, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{test.name}</h4>
                    <div className="flex items-center gap-2">
                      {test.success ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          PASS
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          FAIL
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-600">Expected:</label>
                      <p>{test.expectedName || "No name (agent call)"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">Extracted:</label>
                      <p>{test.actualName || "None"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">Confidence:</label>
                      <p>{Math.round(test.result.confidence * 100)}%</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">Method:</label>
                      <p>{test.result.extractionMethod.replace(/_/g, " ")}</p>
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600">View Transcript</summary>
                    <p className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded">{test.transcript}</p>
                  </details>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Test Summary: {testResults.filter((r) => r.success).length}/{testResults.length} tests passed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Transcripts */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomTranscript(sample.transcript)
                  handleExtractName(sample.transcript)
                }}
                className="mr-2 mb-2"
              >
                {sample.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
