"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  Share,
  Copy,
  Star,
  Phone,
  MessageSquare,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Flag,
  Award,
  Zap,
  Eye,
  BookOpen,
} from "lucide-react"
import type { CallSummary } from "@/lib/call-summary-generator"

interface CallSummaryDisplayProps {
  summary: CallSummary
  onViewFullTranscript?: () => void
  onDownloadReport?: () => void
  onShareSummary?: () => void
}

export function CallSummaryDisplay({
  summary,
  onViewFullTranscript,
  onDownloadReport,
  onShareSummary,
}: CallSummaryDisplayProps) {
  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "successful":
        return "bg-green-500 text-white"
      case "needs_follow_up":
        return "bg-blue-500 text-white"
      case "escalated":
        return "bg-orange-500 text-white"
      case "unresolved":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200"
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "low":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "positive":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "concern":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "opportunity":
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case "action_required":
        return <Flag className="h-4 w-4 text-orange-600" />
      default:
        return <Lightbulb className="h-4 w-4 text-gray-600" />
    }
  }

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "satisfactory":
        return "text-yellow-600"
      case "needs_improvement":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Professional Call Summary</CardTitle>
                <p className="text-gray-600 mt-1">
                  Generated on {new Date(summary.generatedAt).toLocaleDateString()} at{" "}
                  {new Date(summary.generatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                <Phone className="h-3 w-3 mr-1" />
                Call ID: {summary.callId}
              </Badge>
              <Badge className={getOutcomeColor(summary.callDetails.outcome)}>
                {summary.callDetails.outcome.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{summary.callDetails.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="font-semibold">
                  {summary.callDetails.participants.agent} & {summary.callDetails.participants.customer}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Call Type</p>
                <p className="font-semibold">{summary.callDetails.callType}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {onViewFullTranscript && (
          <Button variant="outline" onClick={onViewFullTranscript} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Full Transcript
          </Button>
        )}
        {onDownloadReport && (
          <Button variant="outline" onClick={onDownloadReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        )}
        {onShareSummary && (
          <Button variant="outline" onClick={onShareSummary} className="flex items-center gap-2">
            <Share className="h-4 w-4" />
            Share Summary
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => copyToClipboard(summary.shortSummary)}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy Summary
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="takeaways">Key Takeaways</TabsTrigger>
          <TabsTrigger value="conclusion">Conclusion</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Short Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Quick Summary</h4>
                <p className="text-blue-800">{summary.shortSummary}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Detailed Summary</h4>
                <p className="text-gray-700 leading-relaxed">{summary.executiveSummary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Call Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Intent:</span>
                  <Badge variant="outline">{summary.callDetails.primaryIntent}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Disposition:</span>
                  <Badge variant="outline">{summary.callDetails.disposition}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outcome:</span>
                  <Badge className={getOutcomeColor(summary.callDetails.outcome)}>
                    {summary.callDetails.outcome.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{summary.performanceHighlights.overallScore}/10</span>
                    <Star className={`h-5 w-5 ${getPerformanceColor(summary.performanceHighlights.rating)}`} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating:</span>
                  <Badge className={getPerformanceColor(summary.performanceHighlights.rating)}>
                    {summary.performanceHighlights.rating.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <Progress value={summary.performanceHighlights.overallScore * 10} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Topics Covered ({summary.topicsCovered.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.topicsCovered.map((topic, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{topic.topic}</h4>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            topic.importance === "high"
                              ? "border-red-200 text-red-700"
                              : topic.importance === "medium"
                                ? "border-yellow-200 text-yellow-700"
                                : "border-gray-200 text-gray-700"
                          }
                        >
                          {topic.importance} priority
                        </Badge>
                        <Badge variant="outline" className="text-blue-700">
                          <Clock className="h-3 w-3 mr-1" />
                          {topic.timeSpent}
                        </Badge>
                      </div>
                    </div>
                    {topic.keyPoints.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Key Points:</h5>
                        <ul className="space-y-1">
                          {topic.keyPoints.map((point, pointIndex) => (
                            <li key={pointIndex} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span className="text-gray-700 text-sm">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Takeaways Tab */}
        <TabsContent value="takeaways" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Takeaways ({summary.keyTakeaways.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.keyTakeaways.map((takeaway, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(takeaway.category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={
                              takeaway.category === "positive"
                                ? "border-green-200 text-green-700"
                                : takeaway.category === "concern"
                                  ? "border-red-200 text-red-700"
                                  : takeaway.category === "opportunity"
                                    ? "border-blue-200 text-blue-700"
                                    : "border-orange-200 text-orange-700"
                            }
                          >
                            {takeaway.category.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              takeaway.impact === "high"
                                ? "border-red-200 text-red-700"
                                : takeaway.impact === "medium"
                                  ? "border-yellow-200 text-yellow-700"
                                  : "border-gray-200 text-gray-700"
                            }
                          >
                            {takeaway.impact} impact
                          </Badge>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">{takeaway.insight}</p>
                        {takeaway.recommendation && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-blue-800 text-sm">
                              <strong>Recommendation:</strong> {takeaway.recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call Conclusion Tab */}
        <TabsContent value="conclusion" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Call Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolution Status:</span>
                    <Badge variant="outline">{summary.callConclusion.resolutionStatus}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Satisfaction:</span>
                    <Badge
                      className={
                        summary.callConclusion.customerSatisfaction === "satisfied"
                          ? "bg-green-500 text-white"
                          : summary.callConclusion.customerSatisfaction === "dissatisfied"
                            ? "bg-red-500 text-white"
                            : "bg-gray-500 text-white"
                      }
                    >
                      {summary.callConclusion.customerSatisfaction}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Performance:</span>
                    <Badge className={getPerformanceColor(summary.callConclusion.agentPerformance)}>
                      {summary.callConclusion.agentPerformance.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <h5 className="font-medium text-gray-900 mb-2">Business Outcome:</h5>
                  <p className="text-gray-700 text-sm">{summary.callConclusion.businessOutcome}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.callConclusion.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-700 text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Performance Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-green-900 mb-3">Strengths</h5>
                  <ul className="space-y-2">
                    {summary.performanceHighlights.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-orange-900 mb-3">Areas for Improvement</h5>
                  <ul className="space-y-2">
                    {summary.performanceHighlights.improvementAreas.map((area, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-up Tab */}
        <TabsContent value="followup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Follow-up Items ({summary.followUpItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.followUpItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge
                          variant="outline"
                          className={
                            item.status === "completed"
                              ? "border-green-200 text-green-700"
                              : item.status === "in_progress"
                                ? "border-blue-200 text-blue-700"
                                : "border-gray-200 text-gray-700"
                          }
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                        <p>Assigned: {item.assignedTo}</p>
                      </div>
                    </div>
                    <p className="text-gray-900">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Business Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Conversion Opportunity:</span>
                  <Badge
                    className={
                      summary.businessInsights.conversionOpportunity
                        ? "bg-green-500 text-white"
                        : "bg-gray-500 text-white"
                    }
                  >
                    {summary.businessInsights.conversionOpportunity ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Customer Value:</span>
                  <Badge
                    className={
                      summary.businessInsights.customerValue === "high"
                        ? "bg-green-500 text-white"
                        : summary.businessInsights.customerValue === "medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-500 text-white"
                    }
                  >
                    {summary.businessInsights.customerValue}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.businessInsights.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {summary.businessInsights.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.businessInsights.riskFactors.map((risk, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{risk}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
