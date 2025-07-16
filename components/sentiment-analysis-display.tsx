"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, User, Users, TrendingUp, MessageSquare, Clock } from "lucide-react"
import type { SentimentAnalysis } from "@/lib/sentiment-analysis"

interface SentimentAnalysisDisplayProps {
  sentimentAnalysis: SentimentAnalysis
  transcript: string
}

export function SentimentAnalysisDisplay({ sentimentAnalysis, transcript }: SentimentAnalysisDisplayProps) {
  // Add safety checks and default values
  if (!sentimentAnalysis) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sentiment Data Available</h3>
          <p className="text-gray-600">Sentiment analysis data is not available for this call.</p>
        </CardContent>
      </Card>
    )
  }

  // Provide default values for all sentiment analysis properties
  const safeAnalysis = {
    agentSentiment: {
      overall: "Neutral",
      confidence: 0,
      positive: 0,
      negative: 0,
      ...sentimentAnalysis.agentSentiment,
    },
    customerSentiment: {
      overall: "Neutral",
      confidence: 0,
      positive: 0,
      negative: 0,
      ...sentimentAnalysis.customerSentiment,
    },
    overallCallSentiment: {
      overall: "Neutral",
      confidence: 0,
      positive: 0,
      negative: 0,
      ...sentimentAnalysis.overallCallSentiment,
    },
    sentimentTimeline: sentimentAnalysis.sentimentTimeline || [],
    emotionalJourney: {
      startSentiment: "Neutral",
      endSentiment: "Neutral",
      sentimentShifts: 0,
      dominantEmotion: "Neutral",
      ...sentimentAnalysis.emotionalJourney,
    },
    keyPhrases: {
      positive: [],
      negative: [],
      neutral: [],
      ...sentimentAnalysis.keyPhrases,
    },
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-green-600 bg-green-50 border-green-200"
      case "negative":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "😊"
      case "negative":
        return "😞"
      default:
        return "😐"
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Agent Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getSentimentColor(safeAnalysis.agentSentiment.overall)}>
                  {getSentimentIcon(safeAnalysis.agentSentiment.overall)} {safeAnalysis.agentSentiment.overall}
                </Badge>
                <span className="text-sm font-medium">{safeAnalysis.agentSentiment.confidence}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Positive</span>
                  <span>{safeAnalysis.agentSentiment.positive}%</span>
                </div>
                <Progress value={safeAnalysis.agentSentiment.positive} className="h-1" />
                <div className="flex justify-between text-xs">
                  <span>Negative</span>
                  <span>{safeAnalysis.agentSentiment.negative}%</span>
                </div>
                <Progress value={safeAnalysis.agentSentiment.negative} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              Customer Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getSentimentColor(safeAnalysis.customerSentiment.overall)}>
                  {getSentimentIcon(safeAnalysis.customerSentiment.overall)} {safeAnalysis.customerSentiment.overall}
                </Badge>
                <span className="text-sm font-medium">{safeAnalysis.customerSentiment.confidence}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Positive</span>
                  <span>{safeAnalysis.customerSentiment.positive}%</span>
                </div>
                <Progress value={safeAnalysis.customerSentiment.positive} className="h-1" />
                <div className="flex justify-between text-xs">
                  <span>Negative</span>
                  <span>{safeAnalysis.customerSentiment.negative}%</span>
                </div>
                <Progress value={safeAnalysis.customerSentiment.negative} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Overall Call Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getSentimentColor(safeAnalysis.overallCallSentiment.overall)}>
                  {getSentimentIcon(safeAnalysis.overallCallSentiment.overall)}{" "}
                  {safeAnalysis.overallCallSentiment.overall}
                </Badge>
                <span className="text-sm font-medium">{safeAnalysis.overallCallSentiment.confidence}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Positive</span>
                  <span>{safeAnalysis.overallCallSentiment.positive}%</span>
                </div>
                <Progress value={safeAnalysis.overallCallSentiment.positive} className="h-1" />
                <div className="flex justify-between text-xs">
                  <span>Negative</span>
                  <span>{safeAnalysis.overallCallSentiment.negative}%</span>
                </div>
                <Progress value={safeAnalysis.overallCallSentiment.negative} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Sentiment Timeline</TabsTrigger>
          <TabsTrigger value="journey">Emotional Journey</TabsTrigger>
          <TabsTrigger value="phrases">Key Phrases</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sentiment Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(safeAnalysis.sentimentTimeline || []).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={item.speaker === "agent" ? "border-blue-200" : "border-purple-200"}
                      >
                        {item.speaker === "agent" ? "Agent" : "Customer"}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getSentimentIcon(item.sentiment)}</span>
                        <Badge className={getSentimentColor(item.sentiment)} variant="outline">
                          {item.sentiment}
                        </Badge>
                        <span className="text-xs text-gray-500">{item.confidence}% confidence</span>
                      </div>
                      <p className="text-sm text-gray-700">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Emotional Journey Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Journey Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Start Sentiment:</span>
                        <Badge className={getSentimentColor(safeAnalysis.emotionalJourney.startSentiment)}>
                          {getSentimentIcon(safeAnalysis.emotionalJourney.startSentiment)}{" "}
                          {safeAnalysis.emotionalJourney.startSentiment}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>End Sentiment:</span>
                        <Badge className={getSentimentColor(safeAnalysis.emotionalJourney.endSentiment)}>
                          {getSentimentIcon(safeAnalysis.emotionalJourney.endSentiment)}{" "}
                          {safeAnalysis.emotionalJourney.endSentiment}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Sentiment Shifts:</span>
                        <span className="font-medium">{safeAnalysis.emotionalJourney.sentimentShifts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dominant Emotion:</span>
                        <Badge className={getSentimentColor(safeAnalysis.emotionalJourney.dominantEmotion)}>
                          {getSentimentIcon(safeAnalysis.emotionalJourney.dominantEmotion)}{" "}
                          {safeAnalysis.emotionalJourney.dominantEmotion}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Journey Insights</h4>
                    <div className="space-y-2 text-sm">
                      {safeAnalysis.emotionalJourney.sentimentShifts === 0 && (
                        <p className="text-gray-600">• Consistent emotional tone throughout the call</p>
                      )}
                      {safeAnalysis.emotionalJourney.sentimentShifts > 0 &&
                        safeAnalysis.emotionalJourney.sentimentShifts <= 2 && (
                          <p className="text-gray-600">• Stable emotional progression with minimal fluctuations</p>
                        )}
                      {safeAnalysis.emotionalJourney.sentimentShifts > 2 && (
                        <p className="text-gray-600">• Dynamic emotional journey with multiple sentiment changes</p>
                      )}
                      {safeAnalysis.emotionalJourney.startSentiment === "negative" &&
                        safeAnalysis.emotionalJourney.endSentiment === "positive" && (
                          <p className="text-green-600">
                            • Successful sentiment recovery - call ended on a positive note
                          </p>
                        )}
                      {safeAnalysis.emotionalJourney.startSentiment === "positive" &&
                        safeAnalysis.emotionalJourney.endSentiment === "negative" && (
                          <p className="text-red-600">• Sentiment declined during the call - may need follow-up</p>
                        )}
                      {safeAnalysis.emotionalJourney.dominantEmotion === "positive" && (
                        <p className="text-green-600">• Overall positive interaction experience</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phrases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Key Sentiment Phrases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">Positive Phrases</h4>
                  <div className="space-y-2">
                    {(safeAnalysis.keyPhrases.positive || []).length > 0 ? (
                      (safeAnalysis.keyPhrases.positive || []).map((phrase, index) => (
                        <Badge key={index} variant="outline" className="text-green-600 border-green-200">
                          {phrase}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No positive phrases detected</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-red-600">Negative Phrases</h4>
                  <div className="space-y-2">
                    {(safeAnalysis.keyPhrases.negative || []).length > 0 ? (
                      (safeAnalysis.keyPhrases.negative || []).map((phrase, index) => (
                        <Badge key={index} variant="outline" className="text-red-600 border-red-200">
                          {phrase}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No negative phrases detected</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-600">Neutral Phrases</h4>
                  <div className="space-y-2">
                    {(safeAnalysis.keyPhrases.neutral || []).length > 0 ? (
                      (safeAnalysis.keyPhrases.neutral || []).map((phrase, index) => (
                        <Badge key={index} variant="outline" className="text-gray-600 border-gray-200">
                          {phrase}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No neutral phrases detected</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Sentiment Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Agent maintained {safeAnalysis.agentSentiment.overall.toLowerCase()} sentiment with{" "}
                        {safeAnalysis.agentSentiment.confidence}% confidence
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Customer sentiment was {safeAnalysis.customerSentiment.overall.toLowerCase()} throughout the
                        interaction
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Call experienced {safeAnalysis.emotionalJourney.sentimentShifts} sentiment changes during the
                        conversation
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Overall interaction sentiment: {safeAnalysis.overallCallSentiment.overall.toLowerCase()}
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {safeAnalysis.agentSentiment.overall === "Negative" && (
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Focus on using more positive language and empathetic responses</span>
                      </li>
                    )}
                    {safeAnalysis.customerSentiment.overall === "Negative" && (
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Implement additional customer recovery strategies for negative sentiment</span>
                      </li>
                    )}
                    {safeAnalysis.emotionalJourney.sentimentShifts > 3 && (
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Work on maintaining consistent emotional tone throughout the call</span>
                      </li>
                    )}
                    {safeAnalysis.keyPhrases.positive.length === 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>Incorporate more positive phrases and affirmations in conversations</span>
                      </li>
                    )}
                    {safeAnalysis.overallCallSentiment.overall === "Positive" && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Excellent sentiment management - continue current approach</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
