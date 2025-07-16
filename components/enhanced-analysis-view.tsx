"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Brain,
  CheckCircle,
  Users,
  Phone,
  Award,
  Calendar,
  Shield,
  AlertTriangle,
  Target,
  GraduationCap,
  FileText,
  User,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  Copy,
  Check,
  Building,
  Hash,
  Cake,
  UserCheck,
} from "lucide-react"
import { factExtractionService, type FactExtractionResult } from "@/lib/fact-extraction-utils"

interface CallAnalysis {
  transcript: string
  analysis: {
    overallRating: "GOOD" | "BAD" | "UGLY"
    overallScore: number
    intentAnalysis?: any
    dispositionAnalysis?: any
    sentimentAnalysis?: any
    businessConversion?: any
    agentPerformance?: any
    keyInsights?: string[]
    improvementSuggestions?: string[]
    summary?: string
  }
  fileName: string
  duration: number
}

interface EnhancedAnalysisViewProps {
  analysis: CallAnalysis
}

export function EnhancedAnalysisView({ analysis }: EnhancedAnalysisViewProps) {
  // State for copy button feedback
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [expandedCoaching, setExpandedCoaching] = useState(false)
  const [factExtractionResult, setFactExtractionResult] = useState<FactExtractionResult | null>(null)

  // Extract facts when component mounts or transcript changes
  useState(() => {
    if (analysis.transcript) {
      const result = factExtractionService.extractFacts(analysis.transcript)
      setFactExtractionResult(result)
    }
  })

  // Function to copy text and show feedback
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied({ ...copied, [id]: true })
    setTimeout(() => {
      setCopied({ ...copied, [id]: false })
    }, 2000)
  }

  // Extract agent insights for coaching
  const extractAgentInsights = () => {
    const transcript = analysis.transcript.toLowerCase()

    // Profanity detection
    const profanityWords = ["damn", "hell", "crap", "stupid", "idiot", "suck", "hate"]
    const hasProfanity = profanityWords.some((word) => transcript.includes(word))

    // Mock agent performance data based on analysis
    const agentPerformance = {
      communicationSkills: analysis.analysis.overallScore >= 8 ? 8 : analysis.analysis.overallScore >= 6 ? 6 : 4,
      problemSolving: analysis.analysis.overallScore >= 8 ? 7 : analysis.analysis.overallScore >= 6 ? 6 : 5,
      productKnowledge: analysis.analysis.overallScore >= 8 ? 8 : analysis.analysis.overallScore >= 6 ? 5 : 4,
      customerService: analysis.analysis.overallScore >= 8 ? 9 : analysis.analysis.overallScore >= 6 ? 7 : 5,
    }

    // Generate coaching areas based on performance
    const coachingAreas = []

    if (agentPerformance.communicationSkills < 7) {
      coachingAreas.push({
        area: "Communication Skills",
        priority: "High",
        description: "Work on clarity and structure in responses to improve customer understanding.",
        suggestions: [
          "Use the STAR method for structured responses",
          "Practice active listening techniques",
          "Speak clearly and at appropriate pace",
        ],
      })
    }

    if (agentPerformance.productKnowledge < 7) {
      coachingAreas.push({
        area: "Product Knowledge",
        priority: "High",
        description: "Enhance understanding of products and features to better serve customers.",
        suggestions: [
          "Review product documentation daily",
          "Practice explaining features in simple terms",
          "Stay updated on new product releases",
        ],
      })
    }

    if (agentPerformance.customerService < 7) {
      coachingAreas.push({
        area: "Customer Service",
        priority: "Medium",
        description: "Focus on empathy and customer satisfaction to build stronger relationships.",
        suggestions: [
          "Use empathy statements to acknowledge feelings",
          "Follow up on customer concerns",
          "Maintain positive tone throughout the call",
        ],
      })
    }

    return {
      profanityDetected: hasProfanity,
      overallCoachingGrade: coachingAreas.length <= 1 ? "A" : coachingAreas.length <= 2 ? "B" : "C",
      agentPerformance,
      coachingAreas,
      strengthsIdentified: [
        "Maintained professional tone throughout the call",
        "Demonstrated active listening skills",
        "Followed proper call procedures",
      ].slice(0, Math.max(1, 3 - coachingAreas.length)),
    }
  }

  const agentInsights = extractAgentInsights()

  // Get icon for fact category
  const getFactIcon = (category: string, type: string) => {
    switch (category) {
      case "personal":
        if (type.toLowerCase().includes("name")) return User
        if (type.toLowerCase().includes("age")) return Cake
        if (type.toLowerCase().includes("gender")) return UserCheck
        return User
      case "contact":
        if (type.toLowerCase().includes("email")) return Mail
        if (type.toLowerCase().includes("phone")) return Phone
        if (type.toLowerCase().includes("city") || type.toLowerCase().includes("address")) return MapPin
        if (type.toLowerCase().includes("zip")) return Hash
        return MapPin
      case "insurance":
        return CreditCard
      case "financial":
        return DollarSign
      case "medical":
        return Building
      default:
        return FileText
    }
  }

  // Get color for fact category
  const getFactColor = (category: string) => {
    switch (category) {
      case "personal":
        return "bg-blue-50 border-blue-200 text-blue-800"
      case "contact":
        return "bg-green-50 border-green-200 text-green-800"
      case "insurance":
        return "bg-purple-50 border-purple-200 text-purple-800"
      case "financial":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "medical":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Call Overview */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Call Analysis Report</CardTitle>
                <p className="text-gray-600">Comprehensive AI-powered analysis using Deepgram technology</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${analysis.analysis.overallRating === "GOOD" ? "bg-green-500" : analysis.analysis.overallRating === "BAD" ? "bg-yellow-500" : "bg-red-500"} text-white px-4 py-2`}
              >
                {analysis.analysis.overallRating}
              </Badge>
              <span className="text-2xl font-bold">{analysis.analysis.overallScore}/10</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-13 gap-1 bg-white border border-gray-200 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs">
            Overview
          </TabsTrigger>
          <TabsTrigger value="intent" className="text-xs">
            Intent
          </TabsTrigger>
          <TabsTrigger value="topics" className="text-xs">
            Topics
          </TabsTrigger>
          <TabsTrigger value="takeaways" className="text-xs">
            Takeaways
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="text-xs">
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs">
            Details
          </TabsTrigger>
          <TabsTrigger value="agent" className="text-xs">
            Agent
          </TabsTrigger>
          <TabsTrigger value="coaching" className="text-xs">
            Coaching
          </TabsTrigger>
          <TabsTrigger value="prospect" className="text-xs">
            Prospect
          </TabsTrigger>
          <TabsTrigger value="facts" className="text-xs">
            Facts
          </TabsTrigger>
          <TabsTrigger value="metadata" className="text-xs">
            Metadata
          </TabsTrigger>
          <TabsTrigger value="conclusion" className="text-xs">
            Conclusion
          </TabsTrigger>
          <TabsTrigger value="additional" className="text-xs">
            Additional
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI-Generated Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">
                    {analysis.analysis.summary ||
                      "This call analysis provides comprehensive insights into agent performance, customer interaction quality, and areas for improvement. The AI has analyzed speech patterns, conversation flow, and customer satisfaction indicators to generate actionable coaching recommendations."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Call Quality</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Excellent
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Agent Performance</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(analysis.analysis.overallScore / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{analysis.analysis.overallScore * 10}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Facts Tab - Enhanced with comprehensive fact extraction */}
        <TabsContent value="facts" className="space-y-6">
          <div className="space-y-6">
            {/* Facts Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Key Facts Extracted from Call</h2>
                  <p className="text-sm text-gray-600">
                    AI-powered extraction of personal, contact, and insurance information
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {factExtractionResult?.extractedFacts.length || 0} Facts Found
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {factExtractionResult?.confidence || 0}% Confidence
                </Badge>
              </div>
            </div>

            {/* Personal Information Section */}
            {factExtractionResult?.personalInfo && Object.keys(factExtractionResult.personalInfo).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {factExtractionResult.personalInfo.fullName && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Full Name</p>
                          <p className="text-blue-800">{factExtractionResult.personalInfo.fullName}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.personalInfo.age && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Cake className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Age</p>
                          <p className="text-blue-800">{factExtractionResult.personalInfo.age} years old</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.personalInfo.dateOfBirth && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Date of Birth</p>
                          <p className="text-blue-800">{factExtractionResult.personalInfo.dateOfBirth}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.personalInfo.gender && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <UserCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Gender</p>
                          <p className="text-blue-800 capitalize">{factExtractionResult.personalInfo.gender}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information Section */}
            {factExtractionResult?.contactInfo && Object.keys(factExtractionResult.contactInfo).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {factExtractionResult.contactInfo.email && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Mail className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Email Address</p>
                          <p className="text-green-800">{factExtractionResult.contactInfo.email}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.contactInfo.phone && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Phone Number</p>
                          <p className="text-green-800">{factExtractionResult.contactInfo.phone}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.contactInfo.city && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">City</p>
                          <p className="text-green-800">{factExtractionResult.contactInfo.city}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.contactInfo.zipCode && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Hash className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Zip Code</p>
                          <p className="text-green-800">{factExtractionResult.contactInfo.zipCode}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.contactInfo.address && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 md:col-span-2">
                        <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Address</p>
                          <p className="text-green-800">{factExtractionResult.contactInfo.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insurance Information Section */}
            {factExtractionResult?.insuranceInfo && Object.keys(factExtractionResult.insuranceInfo).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <CreditCard className="h-5 w-5" />
                    Insurance Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {factExtractionResult.insuranceInfo.insuranceCompany && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Building className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">Insurance Company</p>
                          <p className="text-purple-800 capitalize">
                            {factExtractionResult.insuranceInfo.insuranceCompany}
                          </p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.insuranceInfo.insuranceType && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <CreditCard className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">Insurance Type</p>
                          <p className="text-purple-800 uppercase">
                            {factExtractionResult.insuranceInfo.insuranceType}
                          </p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.insuranceInfo.policyNumber && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Hash className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">Policy Number</p>
                          <p className="text-purple-800">{factExtractionResult.insuranceInfo.policyNumber}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.insuranceInfo.memberID && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Hash className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">Member ID</p>
                          <p className="text-purple-800">{factExtractionResult.insuranceInfo.memberID}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.insuranceInfo.copay && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <DollarSign className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">Copay</p>
                          <p className="text-purple-800">{factExtractionResult.insuranceInfo.copay}</p>
                        </div>
                      </div>
                    )}
                    {factExtractionResult.insuranceInfo.deductible && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <DollarSign className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">Deductible</p>
                          <p className="text-purple-800">{factExtractionResult.insuranceInfo.deductible}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Extracted Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  All Extracted Facts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {factExtractionResult?.extractedFacts && factExtractionResult.extractedFacts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {factExtractionResult.extractedFacts.map((fact) => {
                      const IconComponent = getFactIcon(fact.category, fact.type)
                      const colorClass = getFactColor(fact.category)

                      return (
                        <div key={fact.id} className={`flex items-start gap-3 p-4 rounded-lg border ${colorClass}`}>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{fact.type}</p>
                              <Badge variant="outline" className="text-xs">
                                {fact.confidence}%
                              </Badge>
                            </div>
                            <p className="font-semibold mb-2">{fact.value}</p>
                            <p className="text-xs opacity-75 line-clamp-2">{fact.context}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => copyToClipboard(fact.value, fact.id)}
                              >
                                {copied[fact.id] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                              <Badge variant="outline" className="text-xs capitalize">
                                {fact.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Facts Extracted</h3>
                    <p className="text-gray-600">
                      The AI couldn't extract specific facts from this transcript. Try uploading a call with more
                      detailed customer information.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Coaching Tab */}
        <TabsContent value="coaching" className="space-y-6">
          <div className="space-y-6">
            {/* Coaching Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Agent Coaching Insights</h2>
                  <p className="text-sm text-gray-600">Personalized feedback and improvement recommendations</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                AI-Powered Analysis
              </Badge>
            </div>

            {/* Coaching Grade */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-orange-600" />
                    Coaching Grade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 ${
                        agentInsights.overallCoachingGrade === "A"
                          ? "bg-green-500 text-white"
                          : agentInsights.overallCoachingGrade === "B"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                      }`}
                    >
                      {agentInsights.overallCoachingGrade}
                    </div>
                    <p className="text-sm text-gray-600">
                      {agentInsights.overallCoachingGrade === "A"
                        ? "Excellent performance"
                        : agentInsights.overallCoachingGrade === "B"
                          ? "Good with room for improvement"
                          : "Needs focused attention"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Profanity Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Professionalism Check
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profanity Detected</span>
                    <div className="flex items-center gap-2">
                      {agentInsights.profanityDetected ? (
                        <>
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <Badge className="bg-red-100 text-red-800">Yes</Badge>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">None</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {agentInsights.profanityDetected && (
                    <p className="text-sm text-red-700 mt-2">Maintain professional language standards at all times.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Strengths Identified
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agentInsights.strengthsIdentified.map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <Award className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{strength}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agentInsights.coachingAreas.length > 0 ? (
                    agentInsights.coachingAreas.slice(0, 3).map((area, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-orange-900">{area.area}</h4>
                          <Badge
                            className={
                              area.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : area.priority === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {area.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-orange-700 mb-3">{area.description}</p>
                        <div className="space-y-1">
                          <h5 className="font-medium text-xs text-orange-900">Quick Tips:</h5>
                          {area.suggestions.slice(0, 2).map((suggestion, sugIndex) => (
                            <div key={sugIndex} className="flex items-start gap-2 text-xs text-orange-600">
                              <span className="text-orange-500 mt-1">•</span>
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">Excellent Performance!</p>
                      <p className="text-sm text-green-700">No major areas for improvement identified.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actionable Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Target className="h-5 w-5" />
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Schedule Practice Session</p>
                      <p className="text-xs text-blue-700">Focus on your top improvement areas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <FileText className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Review Training Materials</p>
                      <p className="text-xs text-purple-700">Access relevant learning resources</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Peer Learning</p>
                      <p className="text-xs text-green-700">Connect with top performers for tips</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7-Day Action Plan */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Calendar className="h-5 w-5" />
                  Your 7-Day Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Days 1-2: Focus on immediate improvements</p>
                      <p className="text-sm text-gray-600">Practice key phrases and review product knowledge</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Days 3-5: Apply new techniques</p>
                      <p className="text-sm text-gray-600">Implement coaching feedback in live calls</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Days 6-7: Review and refine</p>
                      <p className="text-sm text-gray-600">Self-assess progress and plan next steps</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs content would go here */}
        <TabsContent value="intent" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Intent analysis content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Topics analysis content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="takeaways" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Takeaways content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Sentiment analysis content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Details content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Agent analysis content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prospect" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Prospect analysis content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Metadata content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conclusion" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Conclusion content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Additional analysis content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add other tab contents as needed */}
      </Tabs>
    </div>
  )
}
