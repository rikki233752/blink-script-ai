"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Phone, Key, Settings, Zap, ExternalLink, Copy, RefreshCw } from "lucide-react"
import { IntegrationManager } from "@/lib/integrations/integration-manager"

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
}

export function RingBASetupWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [credentials, setCredentials] = useState({
    apiKey: "",
    accountId: "",
    integrationName: "RingBA Production",
  })

  const steps: SetupStep[] = [
    {
      id: "credentials",
      title: "Get RingBA Credentials",
      description: "Obtain your API key and Account ID from RingBA",
      completed: false,
    },
    {
      id: "configure",
      title: "Configure Integration",
      description: "Enter your credentials and test connection",
      completed: false,
    },
    {
      id: "settings",
      title: "Setup Automation",
      description: "Configure sync intervals and filters",
      completed: false,
    },
    {
      id: "complete",
      title: "Start Processing",
      description: "Begin automatic call fetching and analysis",
      completed: false,
    },
  ]

  const handleTestConnection = async () => {
    if (!credentials.apiKey || !credentials.accountId) {
      setError("Please enter both API Key and Account ID")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const integrationManager = IntegrationManager.getInstance()

      // Create temporary integration for testing
      const testIntegration = {
        id: "test-ringba",
        name: credentials.integrationName,
        type: "ringba" as const,
        status: "configuring" as const,
        config: {
          apiKey: credentials.apiKey,
          accountId: credentials.accountId,
          syncInterval: 15,
          autoTranscribe: true,
          autoAnalyze: true,
          filters: {},
          retryAttempts: 3,
          timeout: 30000,
        },
        lastSync: new Date().toISOString(),
        totalCalls: 0,
        successRate: 100,
        errorCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Test the connection
      await integrationManager.addIntegration(testIntegration)

      setSuccess("✅ Connection successful! RingBA integration is ready.")
      setCurrentStep(2)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Connection failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteSetup = async () => {
    setIsLoading(true)

    try {
      // Trigger initial sync
      const integrationManager = IntegrationManager.getInstance()
      await integrationManager.syncAllIntegrations()

      setSuccess("🎉 RingBA integration completed! Calls will now be automatically processed.")
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (error) {
      setError("Setup completed but initial sync failed. You can manually sync from the integrations dashboard.")
      setTimeout(() => {
        onComplete()
      }, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-600" />
            RingBA Integration Setup
          </CardTitle>
          <Progress value={(currentStep / (steps.length - 1)) * 100} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Step 1: Get Credentials */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Step 1: Get Your RingBA Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">📋 What You Need:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Key className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">RingBA API Key</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Settings className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Account ID</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">🔗 Quick Links:</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open("https://app.ringba.com/settings/api", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    RingBA API Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open("https://app.ringba.com/dashboard", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    RingBA Dashboard
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Make sure your API key has permissions for "Calls" and "Recordings"
                endpoints.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">📝 Step-by-Step Instructions:</h4>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <Badge variant="outline">1</Badge>
                  <span>Log into your RingBA dashboard</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline">2</Badge>
                  <span>Navigate to Settings → API Keys</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline">3</Badge>
                  <span>Create a new API key with "Calls" and "Recordings" permissions</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline">4</Badge>
                  <span>Copy your Account ID from the main dashboard URL or settings</span>
                </li>
                <li className="flex gap-2">
                  <Badge variant="outline">5</Badge>
                  <span>Return here and enter your credentials below</span>
                </li>
              </ol>
            </div>

            <Button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              I Have My Credentials →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configure Integration */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Step 2: Configure Your Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="integrationName">Integration Name</Label>
                <Input
                  id="integrationName"
                  value={credentials.integrationName}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, integrationName: e.target.value }))}
                  placeholder="e.g., RingBA Production"
                />
              </div>

              <div>
                <Label htmlFor="apiKey">RingBA API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your RingBA API key"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.apiKey)}
                    disabled={!credentials.apiKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="accountId">Account ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="accountId"
                    value={credentials.accountId}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, accountId: e.target.value }))}
                    placeholder="Enter your RingBA Account ID"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.accountId)}
                    disabled={!credentials.accountId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={handleTestConnection}
                disabled={isLoading || !credentials.apiKey || !credentials.accountId}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Automation Settings */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Step 3: Automation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">⚙️ Default Settings Applied:</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Sync Interval</span>
                    <Badge variant="outline">15 minutes</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Auto-Transcription</span>
                    <Badge variant="outline">✅ Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Auto-Analysis</span>
                    <Badge variant="outline">✅ Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Quality Alerts</span>
                    <Badge variant="outline">✅ Enabled</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">🔄 What Happens Next:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>System will check RingBA every 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>New calls will be automatically downloaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Deepgram will transcribe each call</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>AI analysis will generate insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Results appear in your dashboard</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You can modify these settings anytime from the Integrations dashboard.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Continue to Final Step →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete Setup */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Step 4: Complete Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">🎉 Almost Ready!</h3>
              <p className="text-gray-600">
                Your RingBA integration is configured and ready to start processing calls automatically.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📊 What You'll See:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Real-time call processing status</li>
                <li>• Automatic transcription and analysis</li>
                <li>• Quality scores and sentiment analysis</li>
                <li>• Business conversion tracking</li>
                <li>• Coaching insights and recommendations</li>
              </ul>
            </div>

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1" disabled={isLoading}>
                ← Back
              </Button>
              <Button
                onClick={handleCompleteSetup}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Completing Setup...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Complete Setup & Start Processing
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
