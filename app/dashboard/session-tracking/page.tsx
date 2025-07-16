"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SessionTrackingDashboard from "@/components/session-tracking-dashboard"
import { supabase } from "@/lib/supabase-client"

export default function SessionTrackingPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get user profile to get the database user ID
        const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

        if (profile) {
          setUserId(profile.id)
        }
      } catch (error) {
        console.error("Error getting user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Unable to load user session data</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Session Tracking</h1>
        <p className="text-muted-foreground">Monitor your login activity, active sessions, and security events</p>
      </div>

      <SessionTrackingDashboard userId={userId} />
    </div>
  )
}
