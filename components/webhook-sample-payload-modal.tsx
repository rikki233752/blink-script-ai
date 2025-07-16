"use client"

import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, Eye, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WebhookSamplePayloadModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  payloadConfig: any
}

export function WebhookSamplePayloadModal({
  isOpen,
  onClose,
  campaignId,
  payloadConfig,
}: WebhookSamplePayloadModalProps) {
  const [payload, setPayload] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const generateSamplePayload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/webhooks/campaign/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          payloadConfig,
        }),
      })
      const result = await response.json()

      if (result.success) {
        setPayload(result.payload)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sample payload",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyPayload = () => {
    if (payload) {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      toast({
        title: "Copied",
        description: "Sample payload copied to clipboard",
      })
    }
  }

  const downloadPayload = () => {
    if (payload) {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `webhook-sample-payload-${campaignId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Downloaded",
        description: "Sample payload downloaded as JSON file",
      })
    }
  }

  const enabledFields = Object.values(payloadConfig).filter(Boolean).length
  const totalFields = Object.keys(payloadConfig).length

  // Generate payload when modal opens
  React.useEffect(() => {
    if (isOpen && !payload) {
      generateSamplePayload()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Sample Webhook Payload</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Preview the JSON structure that will be sent to your webhook endpoint
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Stats Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Campaign: {campaignId.slice(-8)}
              </Badge>
              <Badge variant="outline">
                {enabledFields} of {totalFields} fields enabled
              </Badge>
              {payload && <Badge variant="outline">{JSON.stringify(payload).length} bytes</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyPayload} disabled={!payload}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPayload} disabled={!payload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button size="sm" onClick={generateSamplePayload} disabled={isLoading}>
                {isLoading ? "Generating..." : "Regenerate"}
              </Button>
            </div>
          </div>

          {/* Payload Display */}
          <ScrollArea className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Generating sample payload...</p>
                </div>
              </div>
            ) : payload ? (
              <div className="space-y-4">
                {/* Payload Structure Overview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Payload Structure</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Event Type</div>
                      <div className="text-gray-600">{payload.event}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Timestamp</div>
                      <div className="text-gray-600">{new Date(payload.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Call ID</div>
                      <div className="text-gray-600 font-mono">{payload.callId}</div>
                    </div>
                  </div>
                </div>

                {/* JSON Payload */}
                <div className="bg-gray-900 rounded-lg p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">JSON Payload</h3>
                    <Badge className="bg-green-600 text-white">Valid JSON</Badge>
                  </div>
                  <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </div>

                {/* Field Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Core Data */}
                  {(payload.metadata || payload.callDetails || payload.disposition) && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Core Data
                      </h4>
                      <div className="space-y-2 text-sm">
                        {payload.metadata && <div className="text-gray-600">✓ Metadata</div>}
                        {payload.callDetails && <div className="text-gray-600">✓ Call Details</div>}
                        {payload.disposition && <div className="text-gray-600">✓ Disposition</div>}
                      </div>
                    </div>
                  )}

                  {/* Analysis & Insights */}
                  {(payload.scorecard || payload.callSummary || payload.callFacts || payload.intent) && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Analysis & Insights
                      </h4>
                      <div className="space-y-2 text-sm">
                        {payload.scorecard && <div className="text-gray-600">✓ Scorecard</div>}
                        {payload.callSummary && <div className="text-gray-600">✓ Call Summary</div>}
                        {payload.callFacts && <div className="text-gray-600">✓ Call Facts</div>}
                        {payload.intent && <div className="text-gray-600">✓ Intent</div>}
                      </div>
                    </div>
                  )}

                  {/* Content & Transcription */}
                  {(payload.transcript || payload.markers || payload.questions || payload.vocalytics) && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Content & Transcription
                      </h4>
                      <div className="space-y-2 text-sm">
                        {payload.transcript && <div className="text-gray-600">✓ Transcript</div>}
                        {payload.markers && <div className="text-gray-600">✓ Markers</div>}
                        {payload.questions && <div className="text-gray-600">✓ Questions</div>}
                        {payload.vocalytics && <div className="text-gray-600">✓ Vocalytics</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payload generated yet</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
