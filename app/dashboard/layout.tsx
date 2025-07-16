"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Users, Settings, Phone, BarChart3, FileText, LogOut, Home, Database, Layers } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, signOut, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Call Analysis</h1>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <Home className="mr-2 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            {userRole === "admin" && (
              <li>
                <Link href="/dashboard/users" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                  <Users className="mr-2 h-5 w-5" />
                  Users
                </Link>
              </li>
            )}
            <li>
              <Link href="/dashboard/ringba-settings" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <Settings className="mr-2 h-5 w-5" />
                Ringba Settings
              </Link>
            </li>
            <li>
              <Link href="/dashboard/campaigns" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <Database className="mr-2 h-5 w-5" />
                Campaigns
              </Link>
            </li>
            <li>
              <Link href="/dashboard/call-logs" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <Phone className="mr-2 h-5 w-5" />
                Call Logs
              </Link>
            </li>
            <li>
              <Link href="/dashboard/transcriptions" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <FileText className="mr-2 h-5 w-5" />
                Transcriptions
              </Link>
            </li>
            <li>
              <Link href="/dashboard/analysis" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <BarChart3 className="mr-2 h-5 w-5" />
                AI Analysis
              </Link>
            </li>
            <li>
              <Link href="/dashboard/facts" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <Layers className="mr-2 h-5 w-5" />
                Call Facts
              </Link>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <Button variant="outline" className="w-full flex items-center justify-center" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Call Analysis Dashboard</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{userRole}</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
