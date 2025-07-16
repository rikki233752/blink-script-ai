"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, ArrowLeft, Zap } from "lucide-react"

interface BlinkscriptLoginProps {
  onLogin?: (type: "user" | "agent", credentials: any) => void
  onForgotPassword?: (email: string) => void
  className?: string
}

export function BlinkscriptLogin({ onLogin, onForgotPassword, className = "" }: BlinkscriptLoginProps) {
  const [loginType, setLoginType] = useState<"user" | "agent">("user")
  const [viewMode, setViewMode] = useState<"login" | "forgot-password">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    agentId: "",
    password: "",
    resetEmail: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const credentials = {
        type: loginType,
        identifier: loginType === "user" ? formData.email : formData.agentId,
        password: formData.password,
      }

      if (onLogin) {
        await onLogin(loginType, credentials)
      } else {
        // Default behavior
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Login successful:", credentials)
      }
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.resetEmail) {
        throw new Error("Email is required")
      }

      if (onForgotPassword) {
        await onForgotPassword(formData.resetEmail)
      } else {
        // Default behavior
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      setSuccess("Password reset instructions have been sent to your email.")
      setFormData((prev) => ({ ...prev, resetEmail: "" }))
    } catch (err: any) {
      setError(err.message || "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`w-96 bg-white/95 backdrop-blur-sm shadow-2xl flex flex-col rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-pink-400 to-red-500 rounded-full"></div>
            </div>
            <span className="text-xl font-bold text-gray-800">Blinkscript.ai</span>
            <span className="text-xs text-gray-500 font-normal">™</span>
          </div>
        </div>

        {viewMode === "login" && (
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLoginType("user")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === "user" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setLoginType("agent")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === "agent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Agents
            </button>
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="flex-1 p-6">
        {viewMode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loginType === "user" ? (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address*
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="agentId" className="text-sm font-medium text-gray-700">
                  Agent ID*
                </Label>
                <Input
                  id="agentId"
                  type="text"
                  placeholder="alex@martell.group"
                  value={formData.agentId}
                  onChange={(e) => handleInputChange("agentId", e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password*
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Log in"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setViewMode("forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <button onClick={() => setViewMode("login")} className="p-1 hover:bg-gray-100 rounded">
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-sm font-medium text-gray-700">
                  Email Address*
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.resetEmail}
                  onChange={(e) => handleInputChange("resetEmail", e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500">We'll send you instructions to reset your password.</p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Instructions"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm text-gray-600">Blinkscript AI</span>
        </div>
        <p className="text-xs text-gray-500">AI-Powered Quality Control</p>
      </div>
    </div>
  )
}
