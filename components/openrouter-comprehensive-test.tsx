"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Brain,
  Target,
  FileText,
  Heart,
  Star,
  TrendingUp,
  Zap,
  Clock,
  Database,
  MessageSquare,
} from "lucide-react"

type ConnectionStatus = {
  success: boolean
  message: string
  apiKeyConfigured: boolean
  apiKeyPreview?: string
  model?: string
  timestamp: string
}

type ComprehensiveAnalysis = {
  intentAnalysis: any
  dispositionAnalysis: any
  factsAnalysis: any
  sentimentAnalysis: any
  qualityAnalysis: any
  businessAnalysis: any
  summary: string
  confidence: number
  processingTime: number
}

export function OpenRouterComprehensiveTest() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState("")
  const [activeTab, setActiveTab] = useState("connection")

  // Sample transcript for testing
  const sampleTranscript = `Agent: Thank you for calling TechSolutions, this is Sarah. How can I help you today?

Customer: Hi Sarah, I'm John from ABC Corporation. We're looking for a new CRM system for our sales team of about 50 people. We're currently using an outdated system that's causing us a lot of problems.

Agent: I understand, John. CRM issues can really impact productivity. Can you tell me more about the specific problems you're experiencing with your current system?

Customer: Well, it's slow, doesn't integrate with our email system, and the reporting is terrible. We're losing track of leads and our sales team is frustrated. We need something that can handle our volume and integrate with our existing tools.

Agent: That sounds challenging. Our Enterprise CRM solution would be perfect for your needs. It's designed for teams your size, has excellent email integration, and powerful reporting features. The implementation typically takes 4-6 weeks, and we offer comprehensive training.

Customer: That sounds promising. What about pricing? We have a budget of around $15,000 for the first year.

Agent: Great! Our Enterprise package for 50 users would be $12,000 annually, which fits well within your budget. That includes all features, support, and training. Would you like me to schedule a demo for your team?

Customer: Yes, that would be excellent. Can we do it next week? I'd like to get our IT director involved as well.

Agent: I'll set up a demo for next Tuesday at 2 PM. I'll send you a calendar invite and include our technical specifications document. Is there anything else I can help you with today?

Customer: No, that covers everything. Thank you for your help, Sarah. I'm looking forward to the demo.

Agent: You're welcome, John! I'll follow up with that information today. Have a great day!`

  const testConnection = async () => {
    setIsTestingConnection(true)
    setError(null)

    try {
      const response = await fetch("/api/test-openrouter-comprehensive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testConnection: true }),
      })

      const data = await response.json()
      setConnectionStatus(data)

      if (!data.success) {
        setError(data.message || "Connection test failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection test failed"
      setError(errorMessage)
      setConnectionStatus({
        success: false,
        message: errorMessage,
        apiKeyConfigured: false,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const runComprehensiveAnalysis = async () => {
    if (!transcript.trim()) {
      setError("Please provide a transcript to analyze")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch("/api/test-openrouter-comprehensive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      })

      const data = await response.json()

      if (data.success) {
        setAnalysis(data.analysis)
        setActiveTab("results")
      } else {
        setError(data.error || "Analysis failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Analysis failed"
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadSampleTranscript = () => {
    setTranscript(sampleTranscript)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            OpenRouter AI Comprehensive Test (GPT-4o Mini)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Test OpenRouter API integration with GPT-4o Mini for comprehensive call analysis including intent,
            disposition, facts extraction, sentiment, quality, and business analysis.
          </p>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Connection Test</TabsTrigger>
          <TabsTrigger value="analysis">Run Analysis</TabsTrigger>
          <TabsTrigger value="results" disabled={!analysis}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                API Connection Test (GPT-4o Mini)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testConnection} disabled={isTestingConnection} className="w-full">
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Test OpenRouter Connection
                  </>
                )}
              </Button>

              {connectionStatus && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {connectionStatus.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={connectionStatus.success ? "text-green-700" : "text-red-700"}>
                      {connectionStatus.success ? "Connection Successful" : "Connection Failed"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">API Key Configured:</span>
                      <Badge variant={connectionStatus.apiKeyConfigured ? "default" : "destructive"}>
                        {connectionStatus.apiKeyConfigured ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {connectionStatus.apiKeyPreview && (
                      <div className="flex justify-between">
                        <span className="font-medium">API Key Preview:</span>
                        <span className="font-mono text-gray-600">{connectionStatus.apiKeyPreview}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">Model:</span>
                      <Badge variant="outline">{connectionStatus.model || "openai/gpt-4o-mini"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Response:</span>
                      <span className="text-gray-600">{connectionStatus.message}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Timestamp:</span>
                      <span className="text-gray-600">{new Date(connectionStatus.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Comprehensive Analysis Test (GPT-4o Mini)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Call Transcript</label>
                  <Button variant="outline" size="sm" onClick={loadSampleTranscript}>
                    Load Sample
                  </Button>
                </div>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste your call transcript here..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={runComprehensiveAnalysis}
                disabled={isAnalyzing || !transcript.trim()}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing with GPT-4o Mini...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Run Comprehensive Analysis
                  </>
                )}
              </Button>

              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Processing with OpenRouter GPT-4o Mini...</div>
                  <Progress value={undefined} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Analyzing intent, disposition, facts, sentiment, quality, and business metrics...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {analysis && (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Analysis Summary (GPT-4o Mini)
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {analysis.processingTime}ms
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${getConfidenceColor(analysis.confidence)}`}
                      >
                        <Star className="h-3 w-3" />
                        {analysis.confidence}% confidence
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-900">{analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Intent Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-green-600" />
                      Intent Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Primary Intent</div>
                      <div className="text-lg font-semibold">{analysis.intentAnalysis.primaryIntent}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Subcategory</div>
                      <div>{analysis.intentAnalysis.subcategory}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Urgency</div>
                      <Badge
                        variant={
                          analysis.intentAnalysis.urgency === "High"
                            ? "destructive"
                            : analysis.intentAnalysis.urgency === "Medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {analysis.intentAnalysis.urgency}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Confidence</div>
                      <div className="flex items-center gap-2">
                        <Progress value={analysis.intentAnalysis.confidence} className="flex-1 h-2" />
                        <span className="text-sm">{analysis.intentAnalysis.confidence}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Disposition Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Disposition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Disposition</div>
                      <div className="text-lg font-semibold">{analysis.dispositionAnalysis.disposition}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Category</div>
                      <div>{analysis.dispositionAnalysis.category}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Follow-up Required</div>
                      <Badge variant={analysis.dispositionAnalysis.followUpRequired ? "default" : "secondary"}>
                        {analysis.dispositionAnalysis.followUpRequired ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Customer Satisfaction</div>
                      <Badge
                        variant={
                          analysis.dispositionAnalysis.customerSatisfaction === "High"
                            ? "default"
                            : analysis.dispositionAnalysis.customerSatisfaction === "Medium"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {analysis.dispositionAnalysis.customerSatisfaction}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="h-5 w-5 text-red-600" />
                      Sentiment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Overall Sentiment</div>
                      <Badge
                        variant={
                          analysis.sentimentAnalysis.overallSentiment === "Positive"
                            ? "default"
                            : analysis.sentimentAnalysis.overallSentiment === "Neutral"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {analysis.sentimentAnalysis.overallSentiment}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Agent Sentiment</div>
                      <Badge variant="outline">{analysis.sentimentAnalysis.agentSentiment}</Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Customer Sentiment</div>
                      <Badge variant="outline">{analysis.sentimentAnalysis.customerSentiment}</Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Confidence</div>
                      <div className="flex items-center gap-2">
                        <Progress value={analysis.sentimentAnalysis.confidence} className="flex-1 h-2" />
                        <span className="text-sm">{analysis.sentimentAnalysis.confidence}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Star className="h-5 w-5 text-yellow-600" />
                      Quality Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Overall Score</div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(analysis.qualityAnalysis.overallScore)}`}
                        >
                          {analysis.qualityAnalysis.overallScore}
                        </div>
                        <div className="text-lg font-semibold">/ 100</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Communication</span>
                        <span>{analysis.qualityAnalysis.communicationClarity}/100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Professionalism</span>
                        <span>{analysis.qualityAnalysis.professionalism}/100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Empathy</span>
                        <span>{analysis.qualityAnalysis.empathy}/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Business Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Conversion Potential</div>
                      <div className="flex items-center gap-2">
                        <Progress value={analysis.businessAnalysis.conversionPotential} className="flex-1 h-2" />
                        <span className="text-sm">{analysis.businessAnalysis.conversionPotential}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Estimated Deal Size</div>
                      <div className="font-semibold">{analysis.businessAnalysis.estimatedDealSize}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Time to Close</div>
                      <div>{analysis.businessAnalysis.timeToClose}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Buying Signals</div>
                      <div className="text-sm text-green-600">
                        {analysis.businessAnalysis.buyingSignals.length} detected
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Facts Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="h-5 w-5 text-indigo-600" />
                      Extracted Facts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Key Facts</div>
                      <div className="text-sm">{analysis.factsAnalysis.keyFacts.length} facts extracted</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Products Mentioned</div>
                      <div className="text-sm">{analysis.factsAnalysis.productsMentioned.length} products</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Prices Discussed</div>
                      <div className="text-sm">{analysis.factsAnalysis.pricesDiscussed.length} price points</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Commitments</div>
                      <div className="text-sm">{analysis.factsAnalysis.commitments.length} commitments made</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis Results (GPT-4o Mini)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="intent" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="intent">Intent</TabsTrigger>
                      <TabsTrigger value="disposition">Disposition</TabsTrigger>
                      <TabsTrigger value="facts">Facts</TabsTrigger>
                      <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                      <TabsTrigger value="quality">Quality</TabsTrigger>
                      <TabsTrigger value="business">Business</TabsTrigger>
                    </TabsList>

                    <TabsContent value="intent" className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">{JSON.stringify(analysis.intentAnalysis, null, 2)}</pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="disposition" className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify(analysis.dispositionAnalysis, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="facts" className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">{JSON.stringify(analysis.factsAnalysis, null, 2)}</pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="sentiment" className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify(analysis.sentimentAnalysis, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="quality" className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">{JSON.stringify(analysis.qualityAnalysis, null, 2)}</pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="business" className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify(analysis.businessAnalysis, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
