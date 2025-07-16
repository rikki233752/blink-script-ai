"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, XCircle, Brain, Mic } from "lucide-react"

export function RatingCriteria() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI-Enhanced Call Quality Rating System
          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
            <Mic className="h-3 w-3 mr-1" />
            Deepgram AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-gray-600 mb-4">
          Our AI-enhanced rating system uses Deepgram's advanced speech analytics including sentiment analysis, intent
          detection, and topic modeling to provide accurate call quality assessments.
        </div>

        {/* GOOD Rating */}
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <Badge className="bg-green-500 text-white">GOOD</Badge>
            <span className="font-semibold text-green-800">Score: 7.5 - 10.0</span>
            <span className="text-sm text-green-600">(Excellent Performance)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <h4 className="font-medium text-green-800 mb-2">AI-Detected Characteristics:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• High speech clarity and confidence {">"}90%</li>
                <li>• Positive sentiment throughout call</li>
                <li>• Clear intent recognition and resolution</li>
                <li>• Professional language patterns</li>
                <li>• Effective problem-solving approach</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Performance Indicators:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Excellent communication skills (8.0+)</li>
                <li>• Strong customer service delivery (8.0+)</li>
                <li>• Comprehensive product knowledge (7.5+)</li>
                <li>• Successful business outcomes</li>
                <li>• Consistent positive tone quality</li>
              </ul>
            </div>
          </div>
        </div>

        {/* BAD Rating */}
        <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <Badge className="bg-yellow-500 text-white">BAD</Badge>
            <span className="font-semibold text-yellow-800">Score: 5.1 - 7.4</span>
            <span className="text-sm text-yellow-600">(Needs Improvement)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">AI-Detected Characteristics:</h4>
              <ul className="space-y-1 text-yellow-700">
                <li>• Moderate speech clarity (70-90%)</li>
                <li>• Mixed sentiment patterns</li>
                <li>• Unclear intent or partial resolution</li>
                <li>• Some unprofessional language</li>
                <li>• Basic problem-solving attempts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Performance Indicators:</h4>
              <ul className="space-y-1 text-yellow-700">
                <li>• Average communication skills (5.1-7.4)</li>
                <li>• Adequate customer service (5.1-7.4)</li>
                <li>• Limited product knowledge (5.1-7.4)</li>
                <li>• Partial business outcomes</li>
                <li>• Inconsistent tone quality</li>
              </ul>
            </div>
          </div>
        </div>

        {/* UGLY Rating */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <Badge className="bg-red-500 text-white">UGLY</Badge>
            <span className="font-semibold text-red-800">Score: 1.0 - 5.0</span>
            <span className="text-sm text-red-600">(Poor Performance)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <h4 className="font-medium text-red-800 mb-2">AI-Detected Characteristics:</h4>
              <ul className="space-y-1 text-red-700">
                <li>• Low speech clarity (&lt;70%)</li>
                <li>• Negative sentiment patterns</li>
                <li>• Unclear or unresolved intent</li>
                <li>• Unprofessional language usage</li>
                <li>• Poor problem-solving approach</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-800 mb-2">Performance Indicators:</h4>
              <ul className="space-y-1 text-red-700">
                <li>• Poor communication skills (≤5.0)</li>
                <li>• Inadequate customer service (≤5.0)</li>
                <li>• Insufficient product knowledge (≤5.0)</li>
                <li>• No business conversion achieved</li>
                <li>• Poor tone quality and engagement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Enhancement Features */}
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Deepgram AI Enhancement Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-blue-700 mb-2">Speech Analytics</h5>
              <ul className="space-y-1 text-blue-600">
                <li>• Real-time sentiment analysis</li>
                <li>• Speech clarity confidence scoring</li>
                <li>• Filler word detection</li>
                <li>• Speaking pace analysis</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2">Intent & Topics</h5>
              <ul className="space-y-1 text-blue-600">
                <li>• Automatic intent classification</li>
                <li>• Topic modeling and extraction</li>
                <li>• Conversation flow analysis</li>
                <li>• Key phrase identification</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2">Quality Metrics</h5>
              <ul className="space-y-1 text-blue-600">
                <li>• AI-powered quality scoring</li>
                <li>• Automated coaching insights</li>
                <li>• Performance trend analysis</li>
                <li>• Benchmarking against standards</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
          <strong>Note:</strong> All ratings are generated using Deepgram's advanced AI models including Nova-2 for
          transcription, sentiment analysis, intent detection, and topic modeling. The system analyzes speech patterns,
          language usage, conversation flow, and business outcomes to provide comprehensive call quality assessments.
        </div>
      </CardContent>
    </Card>
  )
}
