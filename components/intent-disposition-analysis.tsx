"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, CheckCircle2, ArrowRight, MessageSquare, TrendingUp, AlertTriangle, Users, Timer } from "lucide-react"
import {
  CALL_INTENTS,
  CALL_DISPOSITIONS,
  type IntentAnalysis,
  type DispositionAnalysis,
  type CallMetrics,
} from "@/lib/intent-disposition-utils"
import { useMemo } from "react"

interface IntentDispositionAnalysisProps {
  intentAnalysis?: IntentAnalysis | null
  dispositionAnalysis?: DispositionAnalysis | null
  callMetrics?: CallMetrics | null
}

// Default values for safety
const DEFAULT_INTENT_ANALYSIS: IntentAnalysis = {
  primaryIntent: "INFORMATION",
  subcategory: "General Inquiry",
  confidence: 50,
  keywords: [],
  reasoning: "Analysis not available",
}

const DEFAULT_DISPOSITION_ANALYSIS: DispositionAnalysis = {
  disposition: "NO_RESOLUTION",
  confidence: 50,
  reasoning: "Analysis not available",
  nextSteps: [],
}

const DEFAULT_CALL_METRICS: CallMetrics = {
  talkTime: { agent: 50, customer: 50 },
  interruptionCount: 0,
  silenceDuration: 0,
  averageResponseTime: 5,
  questionCount: 0,
  acknowledgmentCount: 0,
}

const DEFAULT_DISPOSITION_CONFIG = {
  name: "Unknown",
  color: "#6b7280",
  description: "Unknown disposition",
}

const DEFAULT_INTENT_CONFIG = {
  name: "Unknown",
  id: "unknown",
}

export function IntentDispositionAnalysis({
  intentAnalysis,
  dispositionAnalysis,
  callMetrics,
}: IntentDispositionAnalysisProps) {
  // Memoize safe data to prevent unnecessary re-renders
  const safeData = useMemo(() => {
    const safeIntentAnalysis = intentAnalysis || DEFAULT_INTENT_ANALYSIS
    const safeDispositionAnalysis = dispositionAnalysis || DEFAULT_DISPOSITION_ANALYSIS
    const safeCallMetrics = callMetrics || DEFAULT_CALL_METRICS

    // Safely get configuration with proper fallbacks
    const primaryIntentConfig =
      safeIntentAnalysis.primaryIntent && CALL_INTENTS[safeIntentAnalysis.primaryIntent]
        ? CALL_INTENTS[safeIntentAnalysis.primaryIntent]
        : DEFAULT_INTENT_CONFIG

    const dispositionConfig =
      safeDispositionAnalysis.disposition && CALL_DISPOSITIONS[safeDispositionAnalysis.disposition]
        ? CALL_DISPOSITIONS[safeDispositionAnalysis.disposition]
        : DEFAULT_DISPOSITION_CONFIG

    return {
      intentAnalysis: safeIntentAnalysis,
      dispositionAnalysis: safeDispositionAnalysis,
      callMetrics: safeCallMetrics,
      primaryIntentConfig,
      dispositionConfig,
    }
  }, [intentAnalysis, dispositionAnalysis, callMetrics])

  // Early return if no data is available
  if (!intentAnalysis && !dispositionAnalysis && !callMetrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Intent & Disposition Analysis</h3>
              <p className="text-gray-500 mt-1">
                Upload a call recording to see detailed intent and disposition analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const {
    intentAnalysis: safeIntentAnalysis,
    dispositionAnalysis: safeDispositionAnalysis,
    callMetrics: safeCallMetrics,
    primaryIntentConfig,
    dispositionConfig,
  } = safeData

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600">Call Intent</p>
                <p className="text-lg font-semibold truncate">{primaryIntentConfig.name}</p>
                <p className="text-xs text-gray-500 truncate">{safeIntentAnalysis.subcategory}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600 flex-shrink-0" />
            </div>
            <div className="mt-2">
              <Progress value={Math.min(100, Math.max(0, safeIntentAnalysis.confidence))} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{safeIntentAnalysis.confidence}% confidence</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600">Call Disposition</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dispositionConfig.color }}
                    aria-hidden="true"
                  />
                  <p className="text-lg font-semibold truncate">{dispositionConfig.name}</p>
                </div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
            <div className="mt-2">
              <Progress value={Math.min(100, Math.max(0, safeDispositionAnalysis.confidence))} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{safeDispositionAnalysis.confidence}% confidence</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600">Talk Time Ratio</p>
                <p className="text-lg font-semibold">
                  {safeCallMetrics.talkTime.agent}% / {safeCallMetrics.talkTime.customer}%
                </p>
                <p className="text-xs text-gray-500">Agent / Customer</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="intent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="intent">Intent Analysis</TabsTrigger>
          <TabsTrigger value="disposition">Disposition</TabsTrigger>
          <TabsTrigger value="metrics">Call Metrics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="intent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Primary Intent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline" className="text-lg p-2">
                    {primaryIntentConfig.name}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Subcategory:</span>
                  <span className="text-gray-700">{safeIntentAnalysis.subcategory}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Confidence:</span>
                    <span className="font-semibold">{safeIntentAnalysis.confidence}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, safeIntentAnalysis.confidence))} className="h-2" />
                </div>

                <div>
                  <span className="font-medium">Detected Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {safeIntentAnalysis.keywords.slice(0, 6).map((keyword, index) => (
                      <Badge key={`keyword-${index}`} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {safeIntentAnalysis.keywords.length === 0 && (
                      <span className="text-sm text-gray-500">No keywords detected</span>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Analysis:</strong> {safeIntentAnalysis.reasoning}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intent Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(CALL_INTENTS).map(([key, intent]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          key === safeIntentAnalysis.primaryIntent ? "text-blue-600" : "text-gray-600"
                        }`}
                      >
                        {intent.name}
                      </span>
                      {key === safeIntentAnalysis.primaryIntent && <Badge className="bg-blue-500">Primary</Badge>}
                      {key === safeIntentAnalysis.secondaryIntent && <Badge variant="outline">Secondary</Badge>}
                    </div>
                  ))}
                </div>

                {safeIntentAnalysis.secondaryIntent && CALL_INTENTS[safeIntentAnalysis.secondaryIntent] && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Secondary Intent:</strong> {CALL_INTENTS[safeIntentAnalysis.secondaryIntent].name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="disposition">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Call Disposition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dispositionConfig.color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-lg">{dispositionConfig.name}</p>
                    <p className="text-sm text-gray-600">{dispositionConfig.description}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Confidence:</span>
                    <span className="font-semibold">{safeDispositionAnalysis.confidence}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, safeDispositionAnalysis.confidence))} className="h-2" />
                </div>

                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Reasoning:</strong> {safeDispositionAnalysis.reasoning}
                  </p>
                </div>

                {safeDispositionAnalysis.escalationReason && (
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Escalation Reason</span>
                    </div>
                    <p className="text-sm text-yellow-700">{safeDispositionAnalysis.escalationReason}</p>
                  </div>
                )}

                {safeDispositionAnalysis.transferDepartment && (
                  <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowRight className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Transfer Department</span>
                    </div>
                    <p className="text-sm text-purple-700">{safeDispositionAnalysis.transferDepartment}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                {safeDispositionAnalysis.nextSteps && safeDispositionAnalysis.nextSteps.length > 0 ? (
                  <ul className="space-y-2">
                    {safeDispositionAnalysis.nextSteps.map((step, index) => (
                      <li key={`step-${index}`} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No specific next steps identified</p>
                )}

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">All Dispositions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(CALL_DISPOSITIONS).map(([key, disposition]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: disposition.color }}
                          aria-hidden="true"
                        />
                        <span
                          className={`truncate ${
                            key === safeDispositionAnalysis.disposition ? "font-semibold" : "text-gray-600"
                          }`}
                        >
                          {disposition.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Talk Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Agent Talk Time:</span>
                    <span className="font-semibold">{safeCallMetrics.talkTime.agent}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, safeCallMetrics.talkTime.agent))} className="h-3" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Customer Talk Time:</span>
                    <span className="font-semibold">{safeCallMetrics.talkTime.customer}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, safeCallMetrics.talkTime.customer))} className="h-3" />
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Ideal Ratio:</strong> A balanced conversation typically has 40-60% agent talk time, allowing
                    customers to fully express their needs while ensuring comprehensive support.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Conversation Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-2xl font-bold text-blue-600">{safeCallMetrics.questionCount}</p>
                    <p className="text-sm text-gray-600">Questions Asked</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-2xl font-bold text-green-600">{safeCallMetrics.acknowledgmentCount}</p>
                    <p className="text-sm text-gray-600">Acknowledgments</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-2xl font-bold text-orange-600">{safeCallMetrics.interruptionCount}</p>
                    <p className="text-sm text-gray-600">Interruptions</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-2xl font-bold text-purple-600">{safeCallMetrics.averageResponseTime}s</p>
                    <p className="text-sm text-gray-600">Avg Response</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Silence Duration:</span>
                    <span className="font-medium">{safeCallMetrics.silenceDuration}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Intent & Disposition Correlation</h4>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-800">
                      The combination of <strong>{primaryIntentConfig.name}</strong> intent with
                      <strong> {dispositionConfig.name}</strong> disposition suggests a
                      {safeDispositionAnalysis.disposition === "RESOLVED"
                        ? " successful"
                        : safeDispositionAnalysis.disposition === "ESCALATED"
                          ? " complex"
                          : " standard"}
                      customer interaction.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Performance Indicators</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Intent Detection Accuracy:</span>
                      <Badge variant={safeIntentAnalysis.confidence > 80 ? "default" : "secondary"}>
                        {safeIntentAnalysis.confidence > 80 ? "High" : "Medium"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Disposition Confidence:</span>
                      <Badge variant={safeDispositionAnalysis.confidence > 75 ? "default" : "secondary"}>
                        {safeDispositionAnalysis.confidence > 75 ? "High" : "Medium"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Talk Time Balance:</span>
                      <Badge
                        variant={
                          safeCallMetrics.talkTime.agent >= 40 && safeCallMetrics.talkTime.agent <= 60
                            ? "default"
                            : "secondary"
                        }
                      >
                        {safeCallMetrics.talkTime.agent >= 40 && safeCallMetrics.talkTime.agent <= 60
                          ? "Balanced"
                          : "Unbalanced"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {safeCallMetrics.talkTime.agent > 70 && (
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Talk Time:</strong> Agent dominated the conversation. Consider allowing more customer
                        input.
                      </p>
                    </div>
                  )}

                  {safeCallMetrics.interruptionCount > 3 && (
                    <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                      <p className="text-sm text-orange-800">
                        <strong>Interruptions:</strong> High interruption count detected. Focus on active listening
                        skills.
                      </p>
                    </div>
                  )}

                  {safeDispositionAnalysis.disposition === "NO_RESOLUTION" && (
                    <div className="bg-red-50 p-3 rounded-md border border-red-200">
                      <p className="text-sm text-red-800">
                        <strong>Resolution:</strong> Call ended without resolution. Consider follow-up training on
                        problem-solving techniques.
                      </p>
                    </div>
                  )}

                  {safeIntentAnalysis.confidence < 70 && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Intent Clarity:</strong> Intent detection confidence is low. Agent should clarify
                        customer needs earlier in the call.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
