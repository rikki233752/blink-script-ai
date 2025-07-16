"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Award,
  TrendingUp,
  Target,
  Star,
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import type { SentimentAnalysis } from "@/lib/sentiment-analysis"
import type { PreciseScoring } from "@/lib/precise-scoring"
import type { IntentAnalysis, DispositionAnalysis, CallMetrics } from "@/lib/intent-disposition-utils"

interface AgentScorecardProps {
  analysis: {
    overallRating: "GOOD" | "BAD" | "UGLY"
    overallScore: number
    toneQuality: {
      agent: string
      customer: string
      score: number
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
      conversionConfidence: number
    }
    agentPerformance: {
      communicationSkills: number
      problemSolving: number
      productKnowledge: number
      customerService: number
    }
    keyInsights: string[]
    improvementSuggestions: string[]
    callDuration: string
    summary: string
    sentimentAnalysis: SentimentAnalysis
    preciseScoring: PreciseScoring
    intentAnalysis: IntentAnalysis
    dispositionAnalysis: DispositionAnalysis
    callMetrics: CallMetrics
  }
  agentName: string
  callData: {
    fileName: string
    duration: number
    date: string
  }
}

export function AgentScorecard({ analysis, agentName, callData }: AgentScorecardProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "GOOD":
        return "bg-green-500"
      case "BAD":
        return "bg-yellow-500"
      case "UGLY":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Improving":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "Declining":
        return <ArrowDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-600" />
                Agent Performance Scorecard
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {agentName} • {formatDate(callData.date)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${getRatingColor(analysis.overallRating)} text-white`}>
                  {analysis.overallRating}
                </Badge>
                <span className="text-2xl font-bold">{analysis.preciseScoring.overallScore}/100</span>
              </div>
              <p className="text-sm text-gray-600">Overall Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{analysis.preciseScoring.benchmarks.performanceRank}</div>
              <div className="text-sm text-gray-600">Performance Rank</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{analysis.sentimentAnalysis.agentSentiment.overall}</div>
              <div className="text-sm text-gray-600">Agent Sentiment</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {analysis.businessConversion.conversionAchieved ? "Yes" : "No"}
              </div>
              <div className="text-sm text-gray-600">Conversion Achieved</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {Math.round(callData.duration / 60)}m {callData.duration % 60}s
              </div>
              <div className="text-sm text-gray-600">Call Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scorecard */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="improvement">Improvement</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysis.preciseScoring.categoryScores).map(([category, score]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className={`font-semibold ${getScoreColor(score)}`}>{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Weighted Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysis.preciseScoring.weightedScores).map(([category, data]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</span>
                      <div className="text-right">
                        <span className={`font-semibold ${getScoreColor(data.score)}`}>
                          {data.weightedScore.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">({data.weight * 100}%)</span>
                      </div>
                    </div>
                    <Progress value={data.weightedScore} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Score Comparisons</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Your Score</span>
                      <span className="font-bold text-lg">{analysis.preciseScoring.overallScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Team Average</span>
                      <span className="font-medium">{analysis.preciseScoring.benchmarks.teamAverage}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Company Average</span>
                      <span className="font-medium">{analysis.preciseScoring.benchmarks.companyAverage}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Industry Average</span>
                      <span className="font-medium">{analysis.preciseScoring.benchmarks.industryAverage}/100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Performance Ranking</h4>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {analysis.preciseScoring.benchmarks.performanceRank}
                    </div>
                    <p className="text-sm text-gray-600">You're performing better than most agents in your category</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>vs Team</span>
                      <span
                        className={
                          analysis.preciseScoring.overallScore > analysis.preciseScoring.benchmarks.teamAverage
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {analysis.preciseScoring.overallScore > analysis.preciseScoring.benchmarks.teamAverage
                          ? "+"
                          : ""}
                        {analysis.preciseScoring.overallScore - analysis.preciseScoring.benchmarks.teamAverage} points
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>vs Company</span>
                      <span
                        className={
                          analysis.preciseScoring.overallScore > analysis.preciseScoring.benchmarks.companyAverage
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {analysis.preciseScoring.overallScore > analysis.preciseScoring.benchmarks.companyAverage
                          ? "+"
                          : ""}
                        {analysis.preciseScoring.overallScore - analysis.preciseScoring.benchmarks.companyAverage}{" "}
                        points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Score History</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Current Call</span>
                      <span className="font-bold">{analysis.preciseScoring.overallScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Call</span>
                      <span className="font-medium">{analysis.preciseScoring.trends.lastCall}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last 5 Calls</span>
                      <span className="font-medium">{analysis.preciseScoring.trends.last5Calls}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last 30 Days</span>
                      <span className="font-medium">{analysis.preciseScoring.trends.last30Days}/100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Trend Analysis</h4>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getTrendIcon(analysis.preciseScoring.trends.improvement)}
                      <span className="text-lg font-semibold">{analysis.preciseScoring.trends.improvement}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analysis.preciseScoring.trends.improvement === "Improving" &&
                        "Your performance is trending upward"}
                      {analysis.preciseScoring.trends.improvement === "Declining" &&
                        "Focus on improvement areas to reverse the trend"}
                      {analysis.preciseScoring.trends.improvement === "Stable" && "Your performance is consistent"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>vs Last Call</span>
                      <span
                        className={
                          analysis.preciseScoring.overallScore > analysis.preciseScoring.trends.lastCall
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {analysis.preciseScoring.overallScore > analysis.preciseScoring.trends.lastCall ? "+" : ""}
                        {analysis.preciseScoring.overallScore - analysis.preciseScoring.trends.lastCall} points
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>vs 30-Day Avg</span>
                      <span
                        className={
                          analysis.preciseScoring.overallScore > analysis.preciseScoring.trends.last30Days
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {analysis.preciseScoring.overallScore > analysis.preciseScoring.trends.last30Days ? "+" : ""}
                        {analysis.preciseScoring.overallScore - analysis.preciseScoring.trends.last30Days} points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvement">
          <div className="space-y-6">
            {analysis.preciseScoring.improvementAreas.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.preciseScoring.improvementAreas.map((area, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{area.category}</h4>
                            <Badge
                              variant={
                                area.priority === "High"
                                  ? "destructive"
                                  : area.priority === "Medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {area.priority} Priority
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Current: {area.currentScore}/100</div>
                            <div className="text-sm text-gray-600">Target: {area.targetScore}/100</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Progress value={area.currentScore} className="h-2" />
                          <div className="space-y-1">
                            {area.recommendations.map((rec, recIndex) => (
                              <div key={recIndex} className="flex items-start gap-2 text-sm">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Excellent Performance!</h3>
                  <p className="text-gray-600">All performance areas are meeting or exceeding expectations.</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>General Improvement Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.improvementSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strengths">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Performance Strengths</h4>
                  {analysis.preciseScoring.strengths.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.preciseScoring.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-green-800">{strength}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Continue developing your skills to identify key strengths.</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    {analysis.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Call Summary</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{analysis.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex-1">
          <Target className="h-4 w-4 mr-2" />
          Set Performance Goals
        </Button>
        <Button variant="outline" className="flex-1">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Detailed Analytics
        </Button>
        <Button variant="outline" className="flex-1">
          <Users className="h-4 w-4 mr-2" />
          Compare with Team
        </Button>
      </div>
    </div>
  )
}
