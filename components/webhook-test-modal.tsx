"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, X, CheckCircle, XCircle, Clock, Globe, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WebhookTestModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  webhookUrl: string
  payloadConfig: any
}

export function WebhookTestModal({
  isOpen,
  onClose,
  campaignId,
  webhookUrl: initialWebhookUrl,
  payloadConfig,
}: WebhookTestModalProps) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl)
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      const startTime = Date.now()
      const response = await fetch("/api/webhooks/campaign/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          webhookUrl,
          payloadConfig,
        }),
      })
      const endTime = Date.now()
      const result = await response.json()

      setTestResult({
        ...result,
        responseTime: endTime - startTime,
        timestamp: new Date().toISOString(),
      })

      if (result.success) {
        toast({
          title: "Webhook Test Successful",
          description: `Test completed in ${endTime - startTime}ms`,
        })
      } else {
        toast({
          title: "Webhook Test Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error occurred",
        responseTime: 0,
        timestamp: new Date().toISOString(),
      })
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const enabledFields = Object.values(payloadConfig).filter(Boolean).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Test Webhook</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Send a test payload to verify your webhook endpoint</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-120px)]">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Test Configuration */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Test Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Campaign</span>
                    </div>
                    <div className="text-sm text-blue-700 font-mono">{campaignId}</div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Payload Fields</span>
                    </div>
                    <div className="text-sm text-purple-700">{enabledFields} fields enabled</div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">Test Type</span>
                    </div>
                    <div className="text-sm text-green-700">HTTP POST</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-url" className="text-sm font-medium">
                    Webhook URL
                  </Label>
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-endpoint.com/webhook"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">Must be a valid HTTPS URL that can receive POST requests</p>
                </div>
              </div>

              {/* Test Button */}
              <div className="flex justify-center">
                <Button
                  onClick={testWebhook}
                  disabled={isLoading || !webhookUrl}
                  className="bg-green-600 hover:bg-green-700 px-8"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Send Test Request
                    </>
                  )}
                </Button>
              </div>

              {/* Test Results */}
              {testResult && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Test Results</h3>

                  {/* Status Alert */}
                  <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                        {testResult.success ? "Webhook test successful!" : "Webhook test failed"}
                      </AlertDescription>
                    </div>
                  </Alert>

                  {/* Detailed Results */}
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Status Code</div>
                        <Badge
                          variant={
                            testResult.statusCode >= 200 && testResult.statusCode < 300 ? "default" : "destructive"
                          }
                          className="mt-1"
                        >
                          {testResult.statusCode || "N/A"}
                        </Badge>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Response Time</div>
                        <div className="text-gray-600 mt-1">{testResult.responseTime}ms</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Timestamp</div>
                        <div className="text-gray-600 mt-1 font-mono text-xs">
                          {new Date(testResult.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">URL</div>
                        <div className="text-gray-600 mt-1 truncate font-mono text-xs">{webhookUrl}</div>
                      </div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {!testResult.success && testResult.message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                      <p className="text-sm text-red-700">{testResult.message}</p>
                    </div>
                  )}

                  {/* Response Body */}
                  {testResult.response && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Response Body</h4>
                      <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
                        {testResult.response}
                      </pre>
                    </div>
                  )}

                  {/* Success Tips */}
                  {testResult.success && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">✅ Test Successful</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• Your webhook endpoint is properly configured</p>
                        <p>• The endpoint can receive and process POST requests</p>
                        <p>• You'll now receive real webhook notifications when calls are processed</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
