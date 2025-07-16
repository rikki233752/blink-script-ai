"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, User } from "lucide-react"

export function SignupTester() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const testSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/test-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Signup test failed")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Signup test error:", err)
    } finally {
      setLoading(false)
    }
  }

  const generateTestUser = () => {
    const timestamp = Date.now()
    setFormData({
      fullName: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: "password123",
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Signup to Supabase Test</span>
          </CardTitle>
          <CardDescription>Test if new users are properly saved to the Supabase users table</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={testSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Testing..." : "Test Signup"}
              </Button>
              <Button type="button" variant="outline" onClick={generateTestUser}>
                Generate Test User
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">{result.message}</p>
                  <div className="text-sm">
                    <p>
                      <strong>User ID:</strong> {result.user.id}
                    </p>
                    <p>
                      <strong>Email:</strong> {result.user.email}
                    </p>
                    <p>
                      <strong>Name:</strong> {result.user.name}
                    </p>
                    <p>
                      <strong>Role:</strong> {result.user.role}
                    </p>
                  </div>
                  {result.verification && (
                    <div className="text-sm mt-2 p-2 bg-green-100 rounded">
                      <p className="font-medium">✅ Verified in Database:</p>
                      <p>Created: {new Date(result.verification.created_at).toLocaleString()}</p>
                      <p>Active: {result.verification.is_active ? "Yes" : "No"}</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result?.debug && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">Debug Information</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">{JSON.stringify(result.debug, null, 2)}</pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
