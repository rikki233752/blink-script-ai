"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Phone, CheckCircle, XCircle, RefreshCw, Activity } from "lucide-react"
import { RingBABackendService, type RingBAConfig } from "@/lib/ringba-backend-service"

export function RingBASettings() {
  const [config, setConfig] = useState<RingBAConfig>({
    apiKey: "••••••••••••••••", // Masked for security
    accountId: "••••••••••••••••", // Masked for security
    baseUrl: "https://api.ringba.com/v2",
    syncInterval: 15,
    enabled: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const [stats, setStats] = useState({ totalCalls: 0, lastSync: "Never", isActive: false })

  const ringbaService = RingBABackendService.getInstance()

  useEffect(() => {
    // Test connection on load since credentials are from environment
    handleTestConnection()
    setStats(ringbaService.getStats())
  }, [])

  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      ringbaService.updateConfig({ syncInterval: config.syncInterval })
      localStorage.setItem("ringba_sync_interval", config.syncInterval.toString())
      setStats(ringbaService.getStats())
    } catch (error) {
      console.error("Failed to update config:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    try {
      const result = await ringbaService.testConnection()
      setConnectionStatus(result.success ? "connected" : "error")
    } catch (error) {
      setConnectionStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleService = async () => {
    const newConfig = { ...config, enabled: !config.enabled }
    setConfig(newConfig)

    if (newConfig.enabled) {
      await handleSaveConfig()
    } else {
      ringbaService.stopAutoSync()
      localStorage.setItem("ringba_config", JSON.stringify(newConfig))
      setStats(ringbaService.getStats())
    }
  }

  const getStatusBadge = () => {
    if (config.enabled && connectionStatus === "connected") {
      return <Badge className="bg-green-500 text-white">🟢 Active</Badge>
    } else if (connectionStatus === "error") {
      return <Badge className="bg-red-500 text-white">🔴 Error</Badge>
    } else {
      return <Badge className="bg-gray-500 text-white">⚪ Inactive</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="h-6 w-6" />🔔 RingBA Integration
          </h2>
          <p className="text-gray-600">Automatically fetch and analyze calls from RingBA</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Calls Processed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCalls}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-sm font-medium text-gray-900">
                  {stats.lastSync === "Never" ? "Never" : new Date(stats.lastSync).toLocaleString()}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Sync</p>
                <p className="text-sm font-medium text-gray-900">
                  {stats.isActive ? `Every ${config.syncInterval}min` : "Disabled"}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">RingBA API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value="••••••••••••••••"
                disabled
                placeholder="Configured via environment variables"
              />
              <p className="text-xs text-green-600 mt-1">✅ Configured via RINGBA_API_KEY</p>
            </div>
            <div>
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                value="••••••••••••••••"
                disabled
                placeholder="Configured via environment variables"
              />
              <p className="text-xs text-green-600 mt-1">✅ Configured via RINGBA_ACCOUNT_ID</p>
            </div>
          </div>

          <div>
            <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
            <Input
              id="syncInterval"
              type="number"
              min="5"
              max="1440"
              value={config.syncInterval}
              onChange={(e) => setConfig((prev) => ({ ...prev, syncInterval: Number.parseInt(e.target.value) }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="enabled" checked={config.enabled} onCheckedChange={handleToggleService} />
            <Label htmlFor="enabled">Enable automatic call processing</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTestConnection} variant="outline" disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={handleSaveConfig} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
              Save & Start
            </Button>
          </div>

          {connectionStatus === "connected" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ RingBA connection successful! Calls will be automatically processed every {config.syncInterval}{" "}
                minutes.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ❌ Connection failed. Please check your API key and account ID.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 Getting Your RingBA Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li>1. Log into your RingBA dashboard</li>
            <li>
              2. Go to <strong>Settings → API Keys</strong>
            </li>
            <li>
              3. Create a new API key with <strong>"Calls"</strong> and <strong>"Recordings"</strong> permissions
            </li>
            <li>
              4. Copy your <strong>Account ID</strong> from the main dashboard
            </li>
            <li>5. Paste both values above and click "Save & Start"</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
