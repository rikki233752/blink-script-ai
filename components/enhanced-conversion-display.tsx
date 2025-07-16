"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Users,
  BarChart3,
  Star,
  Award,
  Zap,
  MessageSquare,
} from "lucide-react"

interface EnhancedConversionDisplayProps {
  conversionData: any
}

export function EnhancedConversionDisplay({ conversionData }: EnhancedConversionDisplayProps) {
  if (!conversionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Business Conversion Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No conversion data available</p>
        </CardContent>
      </Card>
    )
  }

  const getCommitmentColor = (level: string) => {
    switch (level) {
      case "very_high":
        return "bg-green-500"
      case "high":
        return "bg-blue-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getValueColor = (category: string) => {
    switch (category) {
      case "very_high":
        return "text-green-600"
      case "high":
        return "text-blue-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "very_high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "purchase":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "evaluation":
        return <BarChart3 className="h-5 w-5 text-blue-500" />
      case "intent":
        return <Target className="h-5 w-5 text-purple-500" />
      case "consideration":
        return <MessageSquare className="h-5 w-5 text-yellow-500" />
      case "interest":
        return <Star className="h-5 w-5 text-orange-500" />
      default:
        return <Users className="h-5 w-5 text-gray-500" />
    }
  }

  const formatValue = (value: any) => {
    if (typeof value === "number") {
      return `$${value.toLocaleString()}`
    }
    return value || "Unknown"
  }

  return (
    <div className="space-y-6">
      {/* Main Conversion Status */}
      <Card
        className={`border-2 ${conversionData.conversionAchieved ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            Business Conversion Analysis
            {conversionData.conversionAchieved ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-4 w-4 mr-1" />
                CONVERSION SUCCESS
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-4 w-4 mr-1" />
                NO CONVERSION
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Conversion Probability</p>
                    <p className="text-2xl font-bold text-blue-600">{conversionData.conversionConfidence}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600 flex-shrink-0" />
                </div>
                <Progress value={conversionData.conversionConfidence} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Conversion Stage</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStageIcon(conversionData.conversionStage)}
                      <p className="text-lg font-semibold capitalize">{conversionData.conversionStage}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Customer Commitment</p>
                    <Badge className={`${getCommitmentColor(conversionData.commitmentLevel)} text-white mt-1`}>
                      {conversionData.commitmentLevel?.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <Award className="h-8 w-8 text-purple-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Estimated Value</p>
                    <p className={`text-2xl font-bold ${getValueColor(conversionData.valueCategory)}`}>
                      {formatValue(conversionData.estimatedValue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Type and Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Conversion Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge variant="outline" className="text-sm">
                      {conversionData.conversionType}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stage:</span>
                    <span className="text-sm font-medium capitalize">{conversionData.conversionStage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Value Category:</span>
                    <span className={`text-sm font-medium capitalize ${getValueColor(conversionData.valueCategory)}`}>
                      {conversionData.valueCategory}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Urgency & Follow-up
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Urgency Level:</span>
                    <div className="flex items-center gap-1">
                      {getUrgencyIcon(conversionData.urgency)}
                      <span className="text-sm font-medium capitalize">{conversionData.urgency}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Follow-up Timing:</span>
                    <span className="text-sm font-medium">{conversionData.followUpTiming}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="signals">Conversion Signals</TabsTrigger>
          <TabsTrigger value="effectiveness">Agent Effectiveness</TabsTrigger>
          <TabsTrigger value="risks">Risk Factors</TabsTrigger>
          <TabsTrigger value="action">Next Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="signals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Positive Signals ({conversionData.positiveSignals?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversionData.positiveSignals?.length > 0 ? (
                  <div className="space-y-2">
                    {conversionData.positiveSignals.map((signal: string, index: number) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800 font-medium">"{signal}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No positive signals detected</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Objections/Concerns ({conversionData.negativeSignals?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversionData.negativeSignals?.length > 0 ? (
                  <div className="space-y-2">
                    {conversionData.negativeSignals.map((signal: string, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800 font-medium">"{signal}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium">No objections or concerns detected! 🎉</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="effectiveness">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agent Effectiveness Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {conversionData.agentEffectiveness?.closingAttempts || 0}
                  </div>
                  <div className="text-sm text-gray-600">Closing Attempts</div>
                  <Progress
                    value={(conversionData.agentEffectiveness?.closingAttempts || 0) * 10}
                    className="h-2 mt-2"
                  />
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {conversionData.agentEffectiveness?.objectionHandling || 0}
                  </div>
                  <div className="text-sm text-gray-600">Objection Handling</div>
                  <Progress
                    value={(conversionData.agentEffectiveness?.objectionHandling || 0) * 10}
                    className="h-2 mt-2"
                  />
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {conversionData.agentEffectiveness?.valueProposition || 0}
                  </div>
                  <div className="text-sm text-gray-600">Value Propositions</div>
                  <Progress
                    value={(conversionData.agentEffectiveness?.valueProposition || 0) * 10}
                    className="h-2 mt-2"
                  />
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {conversionData.agentEffectiveness?.urgencyCreation || 0}
                  </div>
                  <div className="text-sm text-gray-600">Urgency Creation</div>
                  <Progress
                    value={(conversionData.agentEffectiveness?.urgencyCreation || 0) * 10}
                    className="h-2 mt-2"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Performance Summary</h4>
                <p className="text-sm text-blue-800">
                  Agent demonstrated{" "}
                  {conversionData.agentEffectiveness?.closingAttempts >= 7
                    ? "excellent"
                    : conversionData.agentEffectiveness?.closingAttempts >= 5
                      ? "good"
                      : "basic"}{" "}
                  closing skills with{" "}
                  {conversionData.agentEffectiveness?.objectionHandling >= 8
                    ? "outstanding"
                    : conversionData.agentEffectiveness?.objectionHandling >= 6
                      ? "solid"
                      : "developing"}{" "}
                  objection handling abilities.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Factors Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversionData.riskFactors?.length > 0 ? (
                <div className="space-y-3">
                  {conversionData.riskFactors.map((risk: string, index: number) => (
                    <Alert key={index} className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Risk Identified:</strong> {risk}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-900 mb-2">No Risk Factors Detected</h3>
                  <p className="text-green-700">
                    Excellent! This conversion opportunity shows minimal risk factors and high probability of success.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="action">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Recommended Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Primary Action</h4>
                    <p className="text-blue-800">{conversionData.nextBestAction}</p>
                  </div>
                </div>
              </div>

              {conversionData.followUpTiming && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">Follow-up Timeline</h4>
                      <p className="text-green-800">{conversionData.followUpTiming}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Success Factors</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• High customer engagement level</li>
                    <li>• Clear value proposition delivered</li>
                    <li>• Strong agent-customer rapport</li>
                    <li>• Appropriate urgency level</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Areas to Monitor</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Customer decision timeline</li>
                    <li>• Budget approval process</li>
                    <li>• Competitor considerations</li>
                    <li>• Implementation readiness</li>
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
