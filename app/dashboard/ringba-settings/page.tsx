"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RingbaSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [formData, setFormData] = useState({
    ringba_account_id: "",
    ringba_api_key: "",
  })

  useEffect(() => {
    if (!user) return

    const fetchRingbaSettings = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("ringba_admins").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setFormData({
            ringba_account_id: data.ringba_account_id,
            ringba_api_key: data.ringba_api_key,
          })
        }
      } catch (error) {
        console.error("Error fetching Ringba settings:", error)
        setError("Failed to load Ringba settings")
      } finally {
        setLoading(false)
      }
    }

    fetchRingbaSettings()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaveLoading(true)
      setError(null)
      setSuccess(null)

      const { data: existingData, error: fetchError } = await supabase
        .from("ringba_admins")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("ringba_admins")
          .update({
            ringba_account_id: formData.ringba_account_id,
            ringba_api_key: formData.ringba_api_key,
          })
          .eq("id", existingData.id)

        if (updateError) throw updateError
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("ringba_admins").insert({
          user_id: user.id,
          ringba_account_id: formData.ringba_account_id,
          ringba_api_key: formData.ringba_api_key,
        })

        if (insertError) throw insertError
      }

      setSuccess("Ringba settings saved successfully")
    } catch (error) {
      console.error("Error saving Ringba settings:", error)
      setError("Failed to save Ringba settings")
    } finally {
      setSaveLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setTestingConnection(true)
      setTestResult(null)

      // Call your API to test the Ringba connection
      const response = await fetch("/api/ringba/test-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: formData.ringba_account_id,
          apiKey: formData.ringba_api_key,
        }),
      })

      const result = await response.json()

      setTestResult({
        success: response.ok,
        message: result.message || (response.ok ? "Connection successful!" : "Connection failed"),
      })
    } catch (error) {
      console.error("Error testing Ringba connection:", error)
      setTestResult({
        success: false,
        message: "Connection test failed. Please check your credentials.",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ringba API Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ringba Credentials</CardTitle>
          <CardDescription>Enter your Ringba account ID and API key to connect to the Ringba API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {testResult && (
              <Alert
                variant={testResult.success ? "default" : "destructive"}
                className={testResult.success ? "bg-green-50 text-green-800 border-green-200" : undefined}
              >
                {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="ringba_account_id">Ringba Account ID</Label>
              <Input
                id="ringba_account_id"
                name="ringba_account_id"
                value={formData.ringba_account_id}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ringba_api_key">Ringba API Key</Label>
              <Input
                id="ringba_api_key"
                name="ringba_api_key"
                value={formData.ringba_api_key}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={testConnection} className="mr-2">
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
              <Button type="submit" disabled={saveLoading}>
                {saveLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
