"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  TrendingUp,
  Target,
  BookOpen,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  MessageSquare,
  Star,
  Award,
  Search,
  Download,
  Share2,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Brain,
  Headphones,
  Zap,
} from "lucide-react"
import {
  generateCoachingInsights,
  generateImprovementPlan,
  type CoachingInsights,
  type ImprovementPlan,
} from "@/lib/coaching-utils"

interface CallRecord {
  id: string
  date: string
  duration: number
  customerName: string
  callType: string
  overallScore: number
  rating: "GOOD" | "BAD" | "UGLY"
  transcript: string
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
  }
  coachingInsights?: CoachingInsights
}

interface AgentProfile {
  id: string
  name: string
  email: string
  department: string
  hireDate: string
  avatar?: string
  overallScore: number
  totalCalls: number
  improvementGoals: string[]
  strengths: string[]
  areasForImprovement: string[]
}

interface AgentSelfCoachingProps {
  currentCall: CallRecord
}

const generateAreasForImprovement = (performance: any) => {
  const areas = []
  if (performance.communicationSkills < 7) areas.push("Communication clarity and structure")
  if (performance.problemSolving < 7) areas.push("Problem-solving methodology")
  if (performance.productKnowledge < 7) areas.push("Product knowledge and technical expertise")
  if (performance.customerService < 7) areas.push("Customer service excellence")

  return areas.length > 0 ? areas : ["Continue maintaining current performance standards"]
}

export function AgentSelfCoaching({ currentCall }: AgentSelfCoachingProps) {
  const [selectedCall, setSelectedCall] = useState<CallRecord>(currentCall)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [improvementPlan, setImprovementPlan] = useState<ImprovementPlan | null>(null)
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Initialize with the current call data
  const [callRecords, setCallRecords] = useState<CallRecord[]>([currentCall])

  // And replace the agent profile state with:
  const [agentProfile] = useState<AgentProfile>({
    id: "current-agent",
    name: "Current Agent",
    email: "agent@company.com",
    department: "Customer Support",
    hireDate: new Date().toISOString().split("T")[0],
    overallScore: currentCall.overallScore,
    totalCalls: 1,
    improvementGoals: currentCall.analysis.improvementSuggestions.slice(0, 3),
    strengths: currentCall.analysis.keyInsights,
    areasForImprovement: generateAreasForImprovement(currentCall.analysis.agentPerformance),
  })

  // Filter and search calls
  const filteredCalls = callRecords.filter((call) => {
    const matchesFilter = filterType === "all" || call.rating.toLowerCase() === filterType.toLowerCase()
    const matchesSearch =
      searchTerm === "" ||
      call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callType.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Generate coaching insights for the current call
  useEffect(() => {
    if (currentCall && !currentCall.coachingInsights) {
      const insights = generateCoachingInsights(currentCall.transcript, currentCall.analysis)
      setSelectedCall((prev) => ({ ...prev, coachingInsights: insights }))

      // Update the call records with the insights
      setCallRecords((prev) =>
        prev.map((call) => (call.id === currentCall.id ? { ...call, coachingInsights: insights } : call)),
      )
    }
  }, [currentCall])

  const handleGenerateImprovementPlan = () => {
    // Create a dynamic agent profile based on the current call
    const dynamicAgentProfile = {
      id: "current-agent",
      name: "Current Agent",
      email: "agent@company.com",
      department: "Customer Support",
      hireDate: new Date().toISOString().split("T")[0],
      overallScore: currentCall.overallScore,
      totalCalls: 1,
      improvementGoals: currentCall.analysis.improvementSuggestions.slice(0, 3),
      strengths: currentCall.analysis.keyInsights,
      areasForImprovement: currentCall.analysis.improvementSuggestions,
    }

    const plan = generateImprovementPlan([currentCall], dynamicAgentProfile)
    setImprovementPlan(plan)
  }

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
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Agent Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Call Analysis Session</CardTitle>
                <p className="text-gray-600">Self-Coaching Dashboard</p>
                <p className="text-sm text-gray-500">Session started {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{currentCall.overallScore}/10</span>
              </div>
              <p className="text-sm text-gray-600">Current Call Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Key Insights from This Call
              </h4>
              <ul className="space-y-1">
                {currentCall.analysis.keyInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {currentCall.analysis.improvementSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 text-orange-500 mt-1 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Metrics
              </h4>
              <ul className="space-y-1">
                {Object.entries(currentCall.analysis.agentPerformance).map(([key, value]) => (
                  <li key={key} className="text-sm text-gray-700 flex items-center justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className={`font-semibold ${getScoreColor(value)}`}>{value}/10</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Coaching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call History Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Your Call History
              </CardTitle>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search calls..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="all">All Calls</option>
                  <option value="good">Good Calls</option>
                  <option value="bad">Needs Improvement</option>
                  <option value="ugly">Poor Performance</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 border-b bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{currentCall.customerName}</span>
                    <Badge className={`${getRatingColor(currentCall.rating)} text-white text-xs`}>
                      {currentCall.rating}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>{currentCall.callType}</span>
                      <span className={`font-semibold ${getScoreColor(currentCall.overallScore)}`}>
                        {currentCall.overallScore}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{new Date(currentCall.date).toLocaleDateString()}</span>
                      <span>
                        {Math.floor(currentCall.duration / 60)}m {Math.round(currentCall.duration % 60)}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 text-center text-gray-500 text-sm">
                  <p>Upload more calls to build your coaching history</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {selectedCall ? (
            <Tabs defaultValue="analysis" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                <TabsTrigger value="coaching">Coaching</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Call Performance Analysis
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRatingColor(selectedCall.rating)} text-white`}>
                          {selectedCall.rating}
                        </Badge>
                        <span className={`text-lg font-bold ${getScoreColor(selectedCall.overallScore)}`}>
                          {selectedCall.overallScore}/10
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedCall.analysis.agentPerformance).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className={`font-semibold ${getScoreColor(value)}`}>{value}/10</span>
                          </div>
                          <Progress value={value * 10} className="h-2" />
                        </div>
                      ))}
                    </div>

                    {/* Key Insights */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Key Insights
                      </h4>
                      <ul className="space-y-2">
                        {selectedCall.analysis.keyInsights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvement Suggestions */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Improvement Suggestions
                      </h4>
                      <ul className="space-y-2">
                        {selectedCall.analysis.improvementSuggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coaching">
                {selectedCall.coachingInsights ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Coaching Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Coaching Score */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Coaching Score</h4>
                          <span className="text-2xl font-bold text-blue-600">
                            {selectedCall.coachingInsights.coachingScore}/100
                          </span>
                        </div>
                        <Progress value={selectedCall.coachingInsights.coachingScore} className="h-3" />
                      </div>

                      {/* Specific Feedback */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            What You Did Well
                          </h4>
                          <ul className="space-y-2">
                            {selectedCall.coachingInsights.positivePoints.map((point, index) => (
                              <li key={index} className="text-sm bg-green-50 p-2 rounded border-l-4 border-green-400">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Areas to Focus On
                          </h4>
                          <ul className="space-y-2">
                            {selectedCall.coachingInsights.improvementAreas.map((area, index) => (
                              <li key={index} className="text-sm bg-orange-50 p-2 rounded border-l-4 border-orange-400">
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Actionable Tips */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          Actionable Tips for Next Time
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedCall.coachingInsights.actionableTips.map((tip, index) => (
                            <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <h5 className="font-medium text-purple-800">{tip.title}</h5>
                                  <p className="text-sm text-purple-700 mt-1">{tip.description}</p>
                                  {tip.example && (
                                    <div className="mt-2 p-2 bg-white rounded border border-purple-200">
                                      <p className="text-xs text-gray-600 font-medium">Example:</p>
                                      <p className="text-xs text-gray-700 italic">"{tip.example}"</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Learning Resources */}
                      {selectedCall.coachingInsights.learningResources.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            Recommended Learning Resources
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedCall.coachingInsights.learningResources.map((resource, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div>
                                  <h5 className="font-medium text-blue-800">{resource.title}</h5>
                                  <p className="text-sm text-blue-600">{resource.description}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  Learn
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Generating AI coaching insights...</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="transcript">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Call Transcript
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Audio Player Simulation */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                          {isPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                          <Progress value={(currentTime / selectedCall.duration) * 100} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, "0")} /{" "}
                          {Math.floor(selectedCall.duration / 60)}:
                          {(selectedCall.duration % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Click play to listen to the call recording while reviewing the transcript
                      </div>
                    </div>

                    {/* Transcript with Annotations */}
                    <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="space-y-4">
                        {selectedCall.transcript.split("\n").map((line, index) => {
                          const isAgent = line.toLowerCase().startsWith("agent:")
                          const isCustomer = line.toLowerCase().startsWith("customer:")

                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg ${
                                isAgent
                                  ? "bg-blue-50 border-l-4 border-blue-400"
                                  : isCustomer
                                    ? "bg-green-50 border-l-4 border-green-400"
                                    : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isAgent
                                      ? "bg-blue-500 text-white"
                                      : isCustomer
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-400 text-white"
                                  }`}
                                >
                                  {isAgent ? "A" : isCustomer ? "C" : "?"}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm">{line}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="practice">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Practice Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Based on this call, practice:</h4>
                      <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          Handling frustrated customers with empathy
                        </li>
                        <li className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          Using active listening techniques
                        </li>
                        <li className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          Providing clear technical explanations
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button className="h-20 flex-col gap-2">
                        <PlayCircle className="h-6 w-6" />
                        <span>Role-Play Scenario</span>
                        <span className="text-xs opacity-75">Practice similar situations</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2">
                        <BookOpen className="h-6 w-6" />
                        <span>Study Materials</span>
                        <span className="text-xs opacity-75">Review best practices</span>
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="reflection">Self-Reflection Notes</Label>
                      <Textarea
                        id="reflection"
                        placeholder="What did you learn from this call? What would you do differently next time?"
                        className="mt-1"
                        rows={4}
                      />
                      <Button className="mt-2" size="sm">
                        Save Reflection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Headphones className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Call to Review</h3>
                <p className="text-gray-600 mb-6">
                  Choose a call from your history to see detailed AI analysis and coaching insights
                </p>
                <Button onClick={handleGenerateImprovementPlan} className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Generate Personal Improvement Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Improvement Plan Modal/Section */}
      {improvementPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Personal Improvement Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-blue-700 mb-3">Priority Focus Areas</h4>
                <ul className="space-y-2">
                  {improvementPlan.priorityAreas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-700 mb-3">Weekly Goals</h4>
                <ul className="space-y-2">
                  {improvementPlan.weeklyGoals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700 mb-3">Learning Path</h4>
                <ul className="space-y-2">
                  {improvementPlan.learningPath.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Your Progress Tracking</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{improvementPlan.currentScore}</div>
                  <div className="text-xs text-gray-600">Current Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{improvementPlan.targetScore}</div>
                  <div className="text-xs text-gray-600">Target Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{improvementPlan.timeframe}</div>
                  <div className="text-xs text-gray-600">Timeframe</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{improvementPlan.estimatedImprovement}</div>
                  <div className="text-xs text-gray-600">Est. Improvement</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
