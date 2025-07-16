"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  BookOpen,
  Lightbulb,
  CheckCircle,
  Users,
  Calendar,
  Copy,
  Download,
  Share,
  FileText,
} from "lucide-react"
import type { OnScriptCallSummary } from "@/lib/onscript-call-summary-generator"

interface OnScriptCallSummaryDisplayProps {
  summary: OnScriptCallSummary
  onCopyToClipboard?: () => void
  onDownloadReport?: () => void
  onShareSummary?: () => void
}

export function OnScriptCallSummaryDisplay({
  summary,
  onCopyToClipboard,
  onDownloadReport,
  onShareSummary,
}: OnScriptCallSummaryDisplayProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const copyFullSummary = () => {
    const fullText = `
CALL SUMMARY
${summary.summary}

TOPICS COVERED
${summary.topicsCovered?.map((topic) => `• ${topic}`).join("\n") || "No topics available"}

KEY TAKEAWAYS
${summary.keyTakeaways?.map((takeaway) => `• ${takeaway}`).join("\n") || "No takeaways available"}

CALL CONCLUSION
${summary.callConclusion || "No conclusion available"}

CALL DETAILS
${summary.callDetails?.map((detail) => `• ${detail}`).join("\n") || "No details available"}

CALL FOLLOWUP ITEMS
${summary.callFollowupItems?.map((item) => `• ${item}`).join("\n") || summary.actionItems?.map((item) => `• ${item}`).join("\n") || "No followup items"}
    `.trim()

    copyToClipboard(fullText)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">OnScript AI Call Summary</CardTitle>
                <p className="text-gray-600 mt-1">
                  Generated on {new Date(summary.generatedAt).toLocaleDateString()} at{" "}
                  {new Date(summary.generatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              Call ID: {summary.callId || "N/A"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={copyFullSummary} className="flex items-center gap-2 bg-transparent">
              <Copy className="h-4 w-4" />
              Copy Summary
            </Button>
            {onDownloadReport && (
              <Button variant="outline" onClick={onDownloadReport} className="flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
            {onShareSummary && (
              <Button variant="outline" onClick={onShareSummary} className="flex items-center gap-2 bg-transparent">
                <Share className="h-4 w-4" />
                Share Summary
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Call Transcript with Speaker A/B and Events */}
      {summary.formattedTranscript && summary.formattedTranscript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Enhanced Call Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.formattedTranscript.map((segment: any, index: number) => (
                <div key={index} className="space-y-2">
                  {/* Speaker and timestamp header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold text-lg ${
                          segment.speaker === "Speaker A" ? "text-blue-700" : "text-green-700"
                        }`}
                      >
                        {segment.speaker}
                      </span>
                      {segment.timestamp && <span className="text-sm text-gray-500">{segment.timestamp}</span>}
                    </div>
                    <div className="flex gap-1">
                      {segment.events &&
                        segment.events.map((event: string, eventIndex: number) => (
                          <Badge
                            key={eventIndex}
                            variant="outline"
                            className={`text-xs ${
                              event.includes("START")
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : event.includes("END")
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {event}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {/* Speaker content */}
                  <div
                    className={`p-4 rounded-lg ${
                      segment.speaker === "Speaker A"
                        ? "bg-blue-50 border-l-4 border-blue-400"
                        : "bg-green-50 border-l-4 border-green-400"
                    }`}
                  >
                    <p className="text-gray-800 leading-relaxed">{segment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800 leading-relaxed text-base">{summary.summary}</p>
        </CardContent>
      </Card>

      {/* Topics Covered */}
      {summary.topicsCovered && summary.topicsCovered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Topics Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.topicsCovered.map((topic, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-800">{topic}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Takeaways */}
      {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-800">{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Call Conclusion */}
      {summary.callConclusion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Call Conclusion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 leading-relaxed text-base">{summary.callConclusion}</p>
          </CardContent>
        </Card>
      )}

      {/* Call Details */}
      {summary.callDetails && summary.callDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Call Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.callDetails.map((detail, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-800">{detail}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Call Followup Items */}
      {(summary.callFollowupItems?.length > 0 || summary.actionItems?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              Call Followup Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(summary.callFollowupItems || summary.actionItems || []).map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Conversation Flow Metrics Section */}
      {summary.conversationFlow && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Conversation Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Speaker Turns:</span>
                <p className="font-medium">{summary.conversationFlow.speakerTurns}</p>
              </div>
              <div>
                <span className="text-gray-600">Avg Segment:</span>
                <p className="font-medium">{summary.conversationFlow.avgSegmentLength} chars</p>
              </div>
              <div>
                <span className="text-gray-600">Balance:</span>
                <p className="font-medium capitalize">{summary.conversationFlow.conversationBalance}</p>
              </div>
              <div>
                <span className="text-gray-600">Events:</span>
                <p className="font-medium">{summary.conversationFlow.events?.length || 0}</p>
              </div>
            </div>
            {summary.conversationFlow.events && summary.conversationFlow.events.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-2">Call Events:</h5>
                <div className="flex flex-wrap gap-1">
                  {summary.conversationFlow.events.map((event: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
