"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import LoginPage from "@/components/login-page"
import { Loader2 } from "lucide-react"
import type { UserRole } from "@/lib/auth-types"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, requiredRoles = [], fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Check role-based access
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role)
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4 max-w-md">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <span className="text-red-600 text-2xl">🚫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access this resource. Required roles: {requiredRoles.join(", ")}
            </p>
            <p className="text-sm text-gray-500">Your current role: {user.role}</p>
            {fallback}
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
