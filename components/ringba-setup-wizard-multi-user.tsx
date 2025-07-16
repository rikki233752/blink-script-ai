"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, Loader2, Phone, Target, Database, Zap, ArrowRight, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface RingbaAccount {
  id: string
  account_id: string
  api_key: string
  account_name?: string
  is_active: boolean
  sync_status: string
  last_sync?: string
  error_message?: string
}

interface Campaign {
  id: string
  campaign_id: string
  campaign_name: string
  campaign_status: string
  total_calls: number
}

export default function RingbaSetupWizardMultiUser() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form data
  const [apiKey, setApiKey] = useState("")
  const [accountId, setAccountId] = useState("")
  const [accountName, setAccountName] = useState("")

  // Data states
  const [ringbaAccounts, setRingbaAccounts] = useState<RingbaAccount[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [setupProgress, setSetupProgress] = useState(0)

  useEffect(() => {
    getCurrentUser()
    fetchRingbaAccounts()
  }, [])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("users").select("*").eq("auth_id", user.id).single()
        setCurrentUser(profile)
      }
    } catch (error) {
      console.error("Error getting current user:", error)
    }
  }

  const fetchRingbaAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("ringba_accounts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setRingbaAccounts(data || [])

      // If user has accounts, move to step 2
      if (data && data.length > 0) {
        setCurrentStep(2)
        setSetupProgress(50)
      }
    } catch (error) {
      console.error("Error fetching Ringba accounts:", error)
    }
  }

  const testRingbaConnection = async () => {
    if (!apiKey || !accountId) {
      setError("Please provide both API Key and Account ID")
      return false
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ringba/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, accountId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Connection test failed")
      }

      setSuccess("Connection successful!")
      setAccountName(result.accountName || "Ringba Account")
      return true
    } catch (error: any) {
      setError(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const saveRingbaAccount = async () => {
    if (!currentUser) {
      setError("User not found")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase
        .from("ringba_accounts")
        .insert({
          user_id: currentUser.id,
          account_id: accountId,
          api_key: apiKey,
          account_name: accountName,
          is_active: true,
          sync_status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      setSuccess("Ringba account saved successfully!")
      setCurrentStep(2)
      setSetupProgress(50)
      fetchRingbaAccounts()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const syncCampaigns = async (ringbaAccountId: string) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ringba/sync-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ringbaAccountId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Campaign sync failed")
      }

      setSuccess(`Successfully synced ${result.campaignCount} campaigns!`)
      setCampaigns(result.campaigns)
      setCurrentStep(3)
      setSetupProgress(75)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const syncCallLogs = async (campaignId: string) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ringba/sync-call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Call logs sync failed")
      }

      setSuccess(`Successfully synced ${result.callCount} call logs!`)
      setSetupProgress(100)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStepComplete = async () => {
    if (currentStep === 1) {
      const connectionSuccess = await testRingbaConnection()
      if (connectionSuccess) {
        await saveRingbaAccount()
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <span>Ringba Integration Setup</span>
          </CardTitle>
          <CardDescription>Connect your Ringba account to start importing campaigns and call data</CardDescription>
          <Progress value={setupProgress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={currentStep.toString()} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="1" disabled={currentStep < 1}>
            <Phone className="h-4 w-4 mr-2" />
            Connect
          </TabsTrigger>
          <TabsTrigger value="2" disabled={currentStep < 2}>
            <Target className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="3" disabled={currentStep < 3}>
            <Database className="h-4 w-4 mr-2" />
            Call Logs
          </TabsTrigger>
          <TabsTrigger value="4" disabled={currentStep < 4}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Connect Ringba Account */}
        <TabsContent value="1">
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Ringba Account</CardTitle>
              <CardDescription>Enter your Ringba API credentials to establish connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Ringba API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Ringba API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    placeholder="Enter your Ringba Account ID"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={testRingbaConnection} disabled={loading || !apiKey || !accountId} variant="outline">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Test Connection
                </Button>

                <Button onClick={handleStepComplete} disabled={loading || !success}>
                  Save & Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Existing Accounts */}
              {ringbaAccounts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Your Ringba Accounts</h3>
                  <div className="space-y-2">
                    {ringbaAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{account.account_name || account.account_id}</p>
                          <p className="text-sm text-gray-500">Account ID: {account.account_id}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={account.is_active ? "default" : "secondary"}>{account.sync_status}</Badge>
                          <Button size="sm" variant="outline" onClick={() => syncCampaigns(account.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Sync Campaigns */}
        <TabsContent value="2">
          <Card>
            <CardHeader>
              <CardTitle>Sync Campaigns</CardTitle>
              <CardDescription>Import your Ringba campaigns to start analyzing call data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ringbaAccounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{account.account_name}</h3>
                        <p className="text-sm text-gray-500">Account ID: {account.account_id}</p>
                      </div>
                      <Button onClick={() => syncCampaigns(account.id)} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Sync Campaigns
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Sync Call Logs */}
        <TabsContent value="3">
          <Card>
            <CardHeader>
              <CardTitle>Sync Call Logs</CardTitle>
              <CardDescription>Import call logs for each campaign to enable transcription and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{campaign.campaign_name}</h3>
                        <p className="text-sm text-gray-500">
                          Campaign ID: {campaign.campaign_id} • Status: {campaign.campaign_status}
                        </p>
                        <p className="text-sm text-gray-500">Total Calls: {campaign.total_calls}</p>
                      </div>
                      <Button onClick={() => syncCallLogs(campaign.id)} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Sync Call Logs
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Complete */}
        <TabsContent value="4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Setup Complete!</span>
              </CardTitle>
              <CardDescription>Your Ringba integration is now active and ready to use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-medium">Accounts Connected</h3>
                    <p className="text-2xl font-bold text-blue-600">{ringbaAccounts.length}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-medium">Campaigns Synced</h3>
                    <p className="text-2xl font-bold text-green-600">{campaigns.length}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-medium">Ready for Analysis</h3>
                    <p className="text-2xl font-bold text-purple-600">✓</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
                  <Button variant="outline" onClick={() => (window.location.href = "/campaigns")}>
                    View Campaigns
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
