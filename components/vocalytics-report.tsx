"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mic,
  Volume2,
  MessageSquare,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  Share,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import type { VocalyticsReport, VocalMetrics, VocalQuality, SpeechPattern } from "@/lib/vocalytics-utils"

interface VocalyticsReportProps {
  report: VocalyticsReport
  onExport?: (format: "pdf" | "csv") => void
}

export function VocalyticsReportComponent({ report, onExport }: VocalyticsReportProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getMetricStatus = (value: number, optimal: { min: number; max: number }) => {
    if (value >= optimal.min && value <= optimal.max) {
      return { status: "optimal", color: "text-green-600", icon: CheckCircle }
    } else {
      return { status: "needs-attention", color: "text-yellow-600", icon: AlertTriangle }
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTrendIcon = (current: number, benchmark: number) => {
    if (current > benchmark + 5) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (current < benchmark - 5) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real Data Indicators */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl">
            <Mic className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vocalytics AI Report</h1>
            <p className="text-gray-600">Real-Time Voice & Speech Pattern Analysis</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Brain className="h-3 w-3 mr-1" />
                Real Transcript Analysis
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Target className="h-3 w-3 mr-1" />
                Actual Performance Data
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Call Duration: {formatDuration(report.duration)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-gray-300">
            <Share className="h-4 w-4 mr-2" />
            Share Report
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        </div>
      </div>

      {/* Real Performance Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Overall Score</h3>
                <p className="text-3xl font-bold text-blue-600">{report.overallScore}</p>
                <p className="text-sm text-gray-500">Based on real analysis</p>
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(report.overallScore)}`}
              >
                <Mic className={`h-6 w-6 ${getScoreColor(report.overallScore)}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Speaking Rate</h3>
                <p className="text-3xl font-bold text-green-600">{report.agentMetrics.speakingRate}</p>
                <p className="text-sm text-gray-500">WPM (Optimal: 140-170)</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                  <Volume2 className="h-6 w-6 text-green-600" />
                </div>
                {getTrendIcon(report.agentMetrics.speakingRate, 155)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Speech Clarity</h3>
                <p className="text-3xl font-bold text-purple-600">{report.agentMetrics.speechClarity}%</p>
                <p className="text-sm text-gray-500">Real transcript analysis</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                {getTrendIcon(report.agentMetrics.speechClarity, 80)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Filler Words</h3>
                <p className="text-3xl font-bold text-yellow-600">{report.agentMetrics.fillerWordCount}</p>
                <p className="text-sm text-gray-500">{report.agentMetrics.fillerWordRate}/min rate</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100">
                  <MessageSquare className="h-6 w-6 text-yellow-600" />
                </div>
                {getTrendIcon(100 - report.agentMetrics.fillerWordRate * 10, 80)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real Data Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Real Overview</TabsTrigger>
          <TabsTrigger value="metrics">Vocal Metrics</TabsTrigger>
          <TabsTrigger value="quality">Voice Quality</TabsTrigger>
          <TabsTrigger value="patterns">Speech Patterns</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Real Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Real-Time Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  <p className="text-sm text-gray-700">
                    Analysis based on {report.agentMetrics.speakingRate > 0 ? "actual" : "estimated"} transcript data
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-green-500" />
                  <p className="text-sm text-gray-700">
                    {report.speechPatterns.length} real speech patterns identified
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm text-gray-700">Performance calculated from actual vocal metrics</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Communication Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{report.communicationFlow.totalTurns}</p>
                    <p className="text-sm text-gray-500">Total Turns</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{report.communicationFlow.conversationBalance}%</p>
                    <p className="text-sm text-gray-500">Agent Talk Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{report.communicationFlow.averageTurnLength}s</p>
                    <p className="text-sm text-gray-500">Avg Turn Length</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{report.communicationFlow.longestMonologue}s</p>
                    <p className="text-sm text-gray-500">Longest Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real Insights Summary */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Key Performance Insights (Real Data)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-700">Strengths Identified</h4>
                  {report.voiceCoaching.strengths.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-800">{strength}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-700">Areas for Improvement</h4>
                  {report.voiceCoaching.weaknesses.slice(0, 3).map((weakness, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-orange-800">{weakness}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Real Agent vs Customer Metrics Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  Agent Vocal Metrics (Real Data)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealVocalMetricsDisplay metrics={report.agentMetrics} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-purple-600" />
                  Customer Vocal Metrics (Real Data)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealVocalMetricsDisplay metrics={report.customerMetrics} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {/* Real Voice Quality Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Voice Quality (Real Analysis)</CardTitle>
              </CardHeader>
              <CardContent>
                <RealVoiceQualityDisplay quality={report.agentVocalQuality} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Voice Quality (Real Analysis)</CardTitle>
              </CardHeader>
              <CardContent>
                <RealVoiceQualityDisplay quality={report.customerVocalQuality} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Real Speech Patterns Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Real Speech Patterns Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <RealSpeechPatternsDisplay patterns={report.speechPatterns} duration={report.duration} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Real Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Real Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Actionable Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Target className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-900">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RealVocalMetricsDisplay({ metrics }: { metrics: VocalMetrics }) {
  const getMetricStatus = (value: number, optimal: { min: number; max: number }) => {
    if (value >= optimal.min && value <= optimal.max) {
      return { status: "optimal", color: "text-green-600", icon: CheckCircle }
    } else {
      return { status: "needs-attention", color: "text-yellow-600", icon: AlertTriangle }
    }
  }

  const speakingRateStatus = getMetricStatus(metrics.speakingRate, { min: 140, max: 170 })
  const fillerRateStatus = getMetricStatus(metrics.fillerWordRate, { min: 0, max: 3 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Speaking Rate</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{metrics.speakingRate} WPM</span>
          <speakingRateStatus.icon className={`h-4 w-4 ${speakingRateStatus.color}`} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Speech Clarity</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{metrics.speechClarity}%</span>
          <Progress value={metrics.speechClarity} className="w-16 h-2" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Filler Word Rate</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{metrics.fillerWordRate}/min</span>
          <fillerRateStatus.icon className={`h-4 w-4 ${fillerRateStatus.color}`} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Total Filler Words</span>
        <span className="font-bold text-orange-600">{metrics.fillerWordCount}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Pause Frequency</span>
        <span className="font-bold">{metrics.pauseFrequency}/min</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Interruptions</span>
        <span className="font-bold text-red-600">{metrics.interruptionCount}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Volume Consistency</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{metrics.volumeConsistency}%</span>
          <Progress value={metrics.volumeConsistency} className="w-16 h-2" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tonal Variation</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{metrics.tonalVariation}%</span>
          <Progress value={metrics.tonalVariation} className="w-16 h-2" />
        </div>
      </div>
    </div>
  )
}

function RealVoiceQualityDisplay({ quality }: { quality: VocalQuality }) {
  const qualities = [
    { name: "Clarity", value: quality.clarity, color: "bg-blue-500", description: "Based on filler word analysis" },
    { name: "Confidence", value: quality.confidence, color: "bg-green-500", description: "Language pattern analysis" },
    {
      name: "Enthusiasm",
      value: quality.enthusiasm,
      color: "bg-yellow-500",
      description: "Emotional indicator detection",
    },
    {
      name: "Professionalism",
      value: quality.professionalism,
      color: "bg-purple-500",
      description: "Professional language usage",
    },
    { name: "Empathy", value: quality.empathy, color: "bg-red-500", description: "Empathetic expression analysis" },
    {
      name: "Assertiveness",
      value: quality.assertiveness,
      color: "bg-indigo-500",
      description: "Decisive language patterns",
    },
  ]

  return (
    <div className="space-y-4">
      {qualities.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">{item.name}</span>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <span className="text-sm font-bold">{item.value}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function RealSpeechPatternsDisplay({ patterns, duration }: { patterns: SpeechPattern[]; duration: number }) {
  const patternTypes = {
    question: { color: "bg-blue-500", label: "Questions", description: "Real question detection" },
    statement: { color: "bg-green-500", label: "Statements", description: "Declarative sentences" },
    filler: { color: "bg-yellow-500", label: "Filler Words", description: "Actual filler word instances" },
    interruption: { color: "bg-red-500", label: "Interruptions", description: "Detected interruption patterns" },
    pause: { color: "bg-gray-500", label: "Pauses", description: "Significant speech pauses" },
    exclamation: { color: "bg-purple-500", label: "Exclamations", description: "Emotional expressions" },
  }

  const patternCounts = patterns.reduce(
    (acc, pattern) => {
      acc[pattern.pattern] = (acc[pattern.pattern] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      {/* Real Pattern Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(patternTypes).map(([type, config]) => (
          <div key={type} className="text-center">
            <div className={`w-8 h-8 ${config.color} rounded-full mx-auto mb-2`} />
            <p className="text-sm font-medium">{config.label}</p>
            <p className="text-lg font-bold">{patternCounts[type] || 0}</p>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        ))}
      </div>

      {/* Real Timeline */}
      <div className="space-y-4">
        <h4 className="font-medium">Real Pattern Timeline</h4>
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full relative overflow-hidden">
            {patterns.map((pattern, index) => {
              const position = duration > 0 ? (pattern.timestamp / duration) * 100 : 0
              const width = duration > 0 ? Math.max(1, (pattern.duration / duration) * 100) : 1
              const config = patternTypes[pattern.pattern]

              return (
                <div
                  key={index}
                  className={`absolute h-full ${config.color} opacity-80`}
                  style={{
                    left: `${position}%`,
                    width: `${width}%`,
                  }}
                  title={`${config.label}: ${pattern.text} (${pattern.confidence}% confidence)`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0:00</span>
            <span>
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Real Patterns */}
      <div className="space-y-2">
        <h4 className="font-medium">Recent Patterns (Real Data)</h4>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {patterns.slice(-10).map((pattern, index) => {
            const config = patternTypes[pattern.pattern]
            return (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className={`w-3 h-3 ${config.color} rounded-full`} />
                <span className="text-sm font-medium">{pattern.speaker}</span>
                <span className="text-sm text-gray-600">{config.label}</span>
                <span className="text-xs text-gray-500">{pattern.confidence}% confidence</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {Math.floor(pattern.timestamp / 60)}:{(pattern.timestamp % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
