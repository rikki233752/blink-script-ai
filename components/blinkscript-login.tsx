"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface BlinkscriptLoginProps {
  prefillEmail?: string
}

export function BlinkscriptLogin({ prefillEmail = "" }: BlinkscriptLoginProps) {
  const router = useRouter()
  const { login, error: authError, clearError, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<"login" | "agents">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [loginForm, setLoginForm] = useState({
    email: prefillEmail,
    password: "",
  })

  const [agentForm, setAgentForm] = useState({
    agentId: "",
    password: "",
  })

  // Update email when prefillEmail changes
  useEffect(() => {
    if (prefillEmail) {
      setLoginForm((prev) => ({ ...prev, email: prefillEmail }))
    }
  }, [prefillEmail])

  // Clear errors when switching tabs - memoized to prevent infinite loops
  const clearAllErrors = useCallback(() => {
    setError("")
    clearError()
  }, [clearError])

  useEffect(() => {
    clearAllErrors()
  }, [activeTab, clearAllErrors])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    clearError()

    try {
      await login({
        email: loginForm.email,
        password: loginForm.password,
      })
      // Auth context will handle redirect
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    clearError()

    try {
      await login({
        email: agentForm.agentId,
        password: agentForm.password,
      })
      // Auth context will handle redirect
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid agent ID or password"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const setDemoAccount = useCallback(
    (type: "admin" | "manager" | "agent") => {
      const credentials = {
        admin: { email: "admin@company.com", password: "password123" },
        manager: { email: "manager@company.com", password: "password123" },
        agent: { email: "agent@company.com", password: "password123" },
      }

      if (activeTab === "login") {
        setLoginForm({
          email: credentials[type].email,
          password: credentials[type].password,
        })
      } else {
        setAgentForm({
          agentId: credentials[type].email,
          password: credentials[type].password,
        })
      }
    },
    [activeTab],
  )

  // Show loading spinner if auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 text-red-500">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="rgba(239, 68, 68, 0.2)"
                  />
                </svg>
              </div>
              <div className="mt-2 text-xl font-semibold">BlinkScript AI™</div>
            </div>
          </div>

          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 text-center ${
                activeTab === "login" ? "bg-white border-b-2 border-gray-900 font-medium" : "bg-gray-100 text-gray-500"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setActiveTab("agents")}
              className={`flex-1 py-3 text-center ${
                activeTab === "agents" ? "bg-white border-b-2 border-gray-900 font-medium" : "bg-gray-100 text-gray-500"
              }`}
            >
              Agents
            </button>
          </div>

          {(error || authError) && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error || authError}</div>
          )}

          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAgentSubmit} className="space-y-4">
              <div>
                <label htmlFor="agentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Agent ID
                </label>
                <input
                  id="agentId"
                  type="text"
                  value={agentForm.agentId}
                  onChange={(e) => setAgentForm({ ...agentForm, agentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="agentPassword" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="agentPassword"
                    type={showPassword ? "text" : "password"}
                    value={agentForm.password}
                    onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>
            </form>
          )}

          <div className="mt-8">
            <p className="text-center text-sm text-gray-600">Demo Accounts:</p>
            <div className="flex justify-center gap-2 mt-2">
              <button
                onClick={() => setDemoAccount("admin")}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Admin
              </button>
              <button
                onClick={() => setDemoAccount("manager")}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Manager
              </button>
              <button
                onClick={() => setDemoAccount("agent")}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Agent
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/signup" className="text-blue-600 hover:underline text-sm">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>

      <footer className="p-4 text-center">
        <div className="text-lg font-semibold">BlinkScript AI™</div>
        <p className="text-sm text-gray-600 mt-1">AI-Powered Quality Control</p>
        <div className="flex justify-center space-x-4 mt-2">
          <Link href="/terms" className="text-sm text-gray-500 hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm text-gray-500 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}
