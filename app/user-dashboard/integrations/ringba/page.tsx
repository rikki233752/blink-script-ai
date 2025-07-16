"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Check, Loader2, Shield, Key, LinkIcon } from "lucide-react"
import Link from "next/link"

export default function RingbaIntegrationPage() {
  const [step, setStep] = useState<"setup" | "testing" | "success">("setup")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [credentials, setCredentials] = useState({
    apiKey: "",
    accountId: "",
    webhookUrl: "",
  })

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!credentials.apiKey || !credentials.accountId) {
        throw new Error("Please fill in all required fields")
      }

      setStep("testing")

      // Simulate API connection test
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setStep("success")
    } catch (err: any) {
      setError(err.message || "Connection failed")
      setStep("setup")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "testing") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing Connection</h2>
              <p className="text-gray-600 mb-6">
                We're verifying your Ringba credentials and setting up the integration...
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Validating API credentials</p>
                <p>✓ Testing account access</p>
                <p>⏳ Setting up webhook endpoints</p>
                <p>⏳ Configuring data sync</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ringba Connected Successfully!</h2>
              <p className="text-gray-600 mb-8">
                Your Ringba account is now connected and we'll start analyzing your calls automatically.
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• We'll sync your existing call data</p>
                  <p>• New calls will be analyzed automatically</p>
                  <p>• Reports will be available in your dashboard</p>
                  <p>• You'll receive insights and recommendations</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/user-dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/user-dashboard?tab=calls">View Call Analysis</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/user-dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connect Ringba Account</h1>
          <p className="text-gray-600 mt-2">
            Integrate your Ringba call tracking platform to start analyzing your calls
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Setup Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ringba API Configuration</CardTitle>
                <CardDescription>Enter your Ringba API credentials to establish the connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Ringba API Key*
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your Ringba API key"
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, apiKey: e.target.value }))}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">Found in your Ringba account under Settings → API Keys</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountId" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Account ID*
                    </Label>
                    <Input
                      id="accountId"
                      type="text"
                      placeholder="Enter your Ringba account ID"
                      value={credentials.accountId}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, accountId: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500">Your unique Ringba account identifier</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl" className="flex items-center">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Webhook URL (Optional)
                    </Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      placeholder="https://your-webhook-endpoint.com"
                      value={credentials.webhookUrl}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500">
                      For real-time call notifications (we'll provide this if needed)
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleConnect}
                    disabled={isLoading || !credentials.apiKey || !credentials.accountId}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Ringba Account"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to find your credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">API Key</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Log into your Ringba account</li>
                    <li>Go to Settings → API Keys</li>
                    <li>Create a new API key or copy existing one</li>
                    <li>Ensure it has "Read" permissions</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Account ID</h4>
                  <p className="text-sm text-gray-600">Found in your Ringba dashboard URL or account settings page</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What we'll access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Call recordings and metadata</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Campaign information</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Call performance metrics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Agent and caller information</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Your data is encrypted and only used for analysis. We never share or sell your information.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
