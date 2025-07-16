"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mic, Brain, BarChart3, Settings, CheckCircle, Target, PhoneCall } from "lucide-react"
import Link from "next/link"

export default function RingbaWorkflowPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Ringba + Deepgram AI Workflow</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Seamlessly fetch calls from your Ringba campaigns and analyze them with our advanced Deepgram AI transcription
          system
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mb-2">
              <Settings className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">1. Configure Ringba</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">Set up your Ringba API credentials and verify connection</p>
            <Link href="/ringba-settings">
              <Button variant="outline" size="sm">
                Configure API
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center mb-2">
              <Target className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">2. Browse Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">View your Ringba campaigns and select calls to analyze</p>
            <Link href="/ringba-campaigns">
              <Button variant="outline" size="sm">
                View Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mb-2">
              <Mic className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">3. Transcribe Calls</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">Use Deepgram AI to transcribe and analyze call recordings</p>
            <Link href="/ringba-all-calls">
              <Button variant="outline" size="sm">
                Fetch & Transcribe
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center mb-2">
              <BarChart3 className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">4. Analyze Results</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">Review AI-powered insights and performance metrics</p>
            <Link href="/">
              <Button variant="outline" size="sm">
                View Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/ringba-all-calls">
              <Card className="border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Phone className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <h3 className="font-semibold mb-2">Fetch All Calls</h3>
                  <p className="text-sm text-gray-600">Get calls from all campaigns</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/ringba-campaigns">
              <Card className="border-2 border-dashed border-green-300 hover:border-green-500 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <h3 className="font-semibold mb-2">Browse by Campaign</h3>
                  <p className="text-sm text-gray-600">Select specific campaigns</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/ringba-diagnostics">
              <Card className="border-2 border-dashed border-purple-300 hover:border-purple-500 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Settings className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <h3 className="font-semibold mb-2">Test Connection</h3>
                  <p className="text-sm text-gray-600">Verify API setup</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Analysis Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Enhanced Deepgram Transcription</h4>
                <p className="text-sm text-gray-600">Nova-2 model with sentiment analysis</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Business Conversion Analysis</h4>
                <p className="text-sm text-gray-600">Detect sales outcomes and opportunities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Agent Performance Scoring</h4>
                <p className="text-sm text-gray-600">Comprehensive quality metrics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Vocalytics Analysis</h4>
                <p className="text-sm text-gray-600">Speech patterns and vocal quality</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Intent & Disposition Detection</h4>
                <p className="text-sm text-gray-600">AI-powered call categorization</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Coaching Recommendations</h4>
                <p className="text-sm text-gray-600">Personalized improvement suggestions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">System Ready</h3>
              <p className="text-green-700">
                Your Ringba integration is configured and ready to fetch and analyze calls with Deepgram AI
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
