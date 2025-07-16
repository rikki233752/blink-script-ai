"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Mic, Clock, DollarSign } from "lucide-react"
import { checkDeepgramApiKey } from "@/app/actions/check-deepgram"

export function DeepgramStatus() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{
    success: boolean
    data: any
    statusCode: number
  } | null>(null)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  // Check status on component mount
  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const result = await checkDeepgramApiKey()
      setStatus(result)
      setLastChecked(new Date().toISOString())
    } catch (error) {
      console.error("Failed to check Deepgram status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!status) {
      return <Badge className="bg-gray-500 text-white">Unknown</Badge>
    }

    if (!status.success) {
      return <Badge className="bg-red-500 text-white">Error</Badge>
    }

    if (status.data.status === "valid") {
      return <Badge className="bg-green-500 text-white">Valid</Badge>
    }

    if (status.data.status === "invalid") {
      return <Badge className="bg-red-500 text-white">Invalid</Badge>
    }

    if (status.data.status === "missing") {
      return <Badge className="bg-yellow-500 text-white">Missing</Badge>
    }

    return <Badge className="bg-gray-500 text-white">{status.data.status}</Badge>
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(balance)
  }

  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            Deepgram API Status
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Information */}
        {status ? (
          <>
            {status.success && status.data.status === "valid" ? (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ New Deepgram API key is active and ready for enhanced 200MB file processing!
                  </AlertDescription>
                </Alert>

                {/* Balance Information */}
                {status.data.balance !== undefined && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Account Balance</p>
                          <p className="text-xl font-bold text-green-600">{formatBalance(status.data.balance)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Available Minutes</p>
                          <p className="text-xl font-bold text-blue-600">
                            {status.data.balanceSeconds ? formatSeconds(status.data.balanceSeconds) : "N/A"}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Usage</p>
                          <p className="text-xl font-bold text-purple-600">
                            {status.data.usageSeconds ? formatSeconds(status.data.usageSeconds) : "N/A"}
                          </p>
                        </div>
                        <Mic className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ {status.data.message || "There was an issue with your Deepgram API key."}
                </AlertDescription>
              </Alert>
            )}

            {/* Last Checked */}
            {lastChecked && (
              <p className="text-xs text-gray-500 mt-2">Last checked: {new Date(lastChecked).toLocaleString()}</p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-gray-600">Checking Deepgram API key status...</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={checkStatus} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isLoading ? "Checking..." : "Check Status"}
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
          <h4 className="font-medium mb-2">New API Key Features:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>✅ Enhanced file size support up to 50MB</li>
            <li>✅ Advanced sentiment analysis and topic detection</li>
            <li>✅ Real-time processing for medium-sized files</li>
            <li>✅ Professional-grade transcription accuracy</li>
          </ul>
          <h4 className="font-medium mb-2 mt-3">Troubleshooting:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ensure your new Deepgram API key has sufficient credits</li>
            <li>Verify the API key has the correct permissions (Speech, Usage)</li>
            <li>Check that your Deepgram account supports 50MB file processing</li>
            <li>Contact Deepgram support if you need higher limits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
