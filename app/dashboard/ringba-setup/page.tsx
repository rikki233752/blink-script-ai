"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase-client"
import RingbaSetupWizardMultiUser from "@/components/ringba-setup-wizard-multi-user"
import { CheckCircle, Zap, ArrowRight } from "lucide-react"

export default function RingbaSetupPage() {
  const [hasRingbaAccount, setHasRingbaAccount] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ringbaAccounts, setRingbaAccounts] = useState<any[]>([])

  useEffect(() => {
    checkRingbaSetup()
  }, [])

  const checkRingbaSetup = async () => {
    try {
      const { data: accounts, error } = await supabase
        .from("ringba_accounts")
        .select(`
          *,
          campaigns(count)
        `)
        .eq("is_active", true)

      if (error) throw error

      setRingbaAccounts(accounts || [])
      setHasRingbaAccount(accounts && accounts.length > 0)
    } catch (error) {
      console.error("Error checking Ringba setup:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (hasRingbaAccount) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span>Ringba Integration Active</span>
            </CardTitle>
            <CardDescription>Your Ringba accounts are connected and syncing data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ringbaAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{account.account_name || account.account_id}</h3>
                    <p className="text-sm text-gray-500">Account ID: {account.account_id}</p>
                    <p className="text-sm text-gray-500">
                      Last sync: {account.last_sync ? new Date(account.last_sync).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={account.sync_status === "completed" ? "default" : "secondary"}>
                      {account.sync_status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2 mt-6">
              <Button onClick={() => (window.location.href = "/dashboard")}>
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/campaigns")}>
                View Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Welcome to BlinkScript AI!</strong> To get started, you need to connect your Ringba account. This will
          allow us to import your campaigns and call data for AI-powered analysis.
        </AlertDescription>
      </Alert>

      <RingbaSetupWizardMultiUser />
    </div>
  )
}
