"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Settings, Trash2, CheckCircle, RefreshCw, Phone, Clock, Activity, Zap } from "lucide-react"
import { IntegrationManager } from "@/lib/integrations/integration-manager"
import type { Integration, SyncResult } from "@/lib/integrations/types"
import { RingBASetupWizard } from "./ringba-setup-wizard"

export function IntegrationManagement() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isAddingIntegration, setIsAddingIntegration] = useState(false)
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  // Add state for showing wizard
  const [showWizard, setShowWizard] = useState(false)

  const integrationManager = IntegrationManager.getInstance()

  useEffect(() => {
    integrationManager.loadIntegrations()
    setIntegrations(integrationManager.getIntegrations())
  }, [])

  const handleAddIntegration = async (integrationData: Partial<Integration>) => {
    try {
      setIsLoading(true)
      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: integrationData.name!,
        type: integrationData.type!,
        status: "configuring",
        config: {
          ...integrationData.config!,
          syncInterval: integrationData.config?.syncInterval || 15,
          autoTranscribe: integrationData.config?.autoTranscribe ?? true,
          autoAnalyze: integrationData.config?.autoAnalyze ?? true,
          filters: integrationData.config?.filters || {},
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

      await integrationManager.addIntegration(integration)
      setIntegrations(integrationManager.getIntegrations())
      setIsAddingIntegration(false)
    } catch (error) {
      console.error("Failed to add integration:", error)
      alert(error instanceof Error ? error.message : "Failed to add integration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      setIsLoading(true)
      const result = await integrationManager.syncIntegration(integrationId)
      setSyncResults((prev) => ({ ...prev, [integrationId]: result }))
      setIntegrations(integrationManager.getIntegrations())
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveIntegration = async (integrationId: string) => {
    if (confirm("Are you sure you want to remove this integration?")) {
      await integrationManager.removeIntegration(integrationId)
      setIntegrations(integrationManager.getIntegrations())
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-gray-500"
      case "error":
        return "bg-red-500"
      case "configuring":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "ringba":
        return "🔔"
      case "twilio":
        return "📞"
      case "aircall":
        return "☁️"
      case "dialpad":
        return "📱"
      case "five9":
        return "5️⃣"
      case "genesys":
        return "🔧"
      default:
        return "🔌"
    }
  }

  return (
    <div className="space-y-6">
      {/* RingBA Setup Wizard */}
      {integrations.length === 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Phone className="h-6 w-6" />🔔 RingBA Integration Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">📋 What You Need:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ RingBA API Key (from Settings → API Keys)</li>
                <li>✅ RingBA Account ID (from your dashboard)</li>
                <li>
                  ✅ Deepgram API Key (already configured: {process.env.DEEPGRAM_API_KEY ? "✅ Ready" : "❌ Missing"})
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">🔑 Getting Your RingBA Credentials:</h4>
              <ol className="space-y-1 text-sm text-yellow-700">
                <li>1. Log into your RingBA dashboard</li>
                <li>2. Go to Settings → API Keys</li>
                <li>3. Create new API key with "Calls" and "Recordings" permissions</li>
                <li>4. Copy your Account ID from the main dashboard</li>
              </ol>
            </div>

            <Button
              onClick={() => setIsAddingIntegration(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              🚀 Start RingBA Integration
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Call Integrations</h2>
          <p className="text-gray-600">Automatically fetch and process calls from your platforms</p>
        </div>
        <Dialog open={isAddingIntegration} onOpenChange={setIsAddingIntegration}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
            </DialogHeader>
            <AddIntegrationForm onSubmit={handleAddIntegration} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Integrations</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter((i) => i.status === "active").length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls Processed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {integrations.reduce((sum, i) => sum + i.totalCalls, 0)}
                </p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {integrations.length > 0
                    ? Math.round(integrations.reduce((sum, i) => sum + i.successRate, 0) / integrations.length)
                    : 0}
                  %
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Processing</p>
                <p className="text-2xl font-bold text-orange-600">
                  {integrations.filter((i) => i.config.autoTranscribe).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <p className="text-sm text-gray-600 capitalize">{integration.type} Integration</p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(integration.status)} text-white`}>{integration.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{integration.totalCalls}</p>
                  <p className="text-xs text-gray-600">Total Calls</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{Math.round(integration.successRate)}%</p>
                  <p className="text-xs text-gray-600">Success Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{integration.errorCount}</p>
                  <p className="text-xs text-gray-600">Errors</p>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
              </div>

              {/* Sync Result */}
              {syncResults[integration.id] && (
                <Alert
                  className={
                    syncResults[integration.id].success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  <AlertDescription className={syncResults[integration.id].success ? "text-green-800" : "text-red-800"}>
                    {syncResults[integration.id].success
                      ? `✅ Processed ${syncResults[integration.id].callsProcessed} calls`
                      : `❌ Sync failed: ${syncResults[integration.id].errors[0]}`}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSyncIntegration(integration.id)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Sync Now
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveIntegration(integration.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && !showWizard && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Automate Your Call Analysis?</h3>
            <p className="text-gray-600 mb-4">
              Connect RingBA to automatically fetch, transcribe, and analyze all your calls
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setShowWizard(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Phone className="h-4 w-4 mr-2" />🚀 Start RingBA Integration
              </Button>
              <div className="text-xs text-gray-500">Takes 2-3 minutes • Requires RingBA API access</div>
            </div>
          </CardContent>
        </Card>
      )}

      {showWizard && (
        <RingBASetupWizard
          onComplete={() => {
            setShowWizard(false)
            setIntegrations(integrationManager.getIntegrations())
          }}
        />
      )}
    </div>
  )
}

function AddIntegrationForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: Partial<Integration>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "ringba" as const,
    apiKey: "",
    apiSecret: "",
    accountId: "",
    endpoint: "",
    syncInterval: 15,
    autoTranscribe: true,
    autoAnalyze: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: formData.name,
      type: formData.type,
      config: {
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret,
        accountId: formData.accountId,
        endpoint: formData.endpoint,
        syncInterval: formData.syncInterval,
        autoTranscribe: formData.autoTranscribe,
        autoAnalyze: formData.autoAnalyze,
        filters: {},
        retryAttempts: 3,
        timeout: 30000,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Integration Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="My RingBA Integration"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Platform Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData((prev) => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ringba">RingBA</SelectItem>
              <SelectItem value="twilio">Twilio</SelectItem>
              <SelectItem value="aircall">Aircall</SelectItem>
              <SelectItem value="dialpad">Dialpad</SelectItem>
              <SelectItem value="five9">Five9</SelectItem>
              <SelectItem value="genesys">Genesys</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Your API key"
          required
        />
      </div>

      {formData.type === "twilio" && (
        <div>
          <Label htmlFor="apiSecret">Auth Token</Label>
          <Input
            id="apiSecret"
            type="password"
            value={formData.apiSecret}
            onChange={(e) => setFormData((prev) => ({ ...prev, apiSecret: e.target.value }))}
            placeholder="Your auth token"
            required
          />
        </div>
      )}

      <div>
        <Label htmlFor="accountId">Account ID</Label>
        <Input
          id="accountId"
          value={formData.accountId}
          onChange={(e) => setFormData((prev) => ({ ...prev, accountId: e.target.value }))}
          placeholder="Your account ID"
          required
        />
      </div>

      <div>
        <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
        <Input
          id="syncInterval"
          type="number"
          min="5"
          max="1440"
          value={formData.syncInterval}
          onChange={(e) => setFormData((prev) => ({ ...prev, syncInterval: Number.parseInt(e.target.value) }))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="autoTranscribe"
          checked={formData.autoTranscribe}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autoTranscribe: checked }))}
        />
        <Label htmlFor="autoTranscribe">Auto-transcribe calls</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="autoAnalyze"
          checked={formData.autoAnalyze}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autoAnalyze: checked }))}
        />
        <Label htmlFor="autoAnalyze">Auto-analyze calls</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            "Add Integration"
          )}
        </Button>
      </div>
    </form>
  )
}
