"use client"

import { useEffect, useState } from "react"
import { useUser } from "@supabase/auth-helpers-react"
import { Filter } from "lucide-react"

const SecureDashboard = () => {
  const user = useUser()
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  useEffect(() => {
    const fetchActiveFiltersCount = async () => {
      if (user?.role === "admin") {
        try {
          const token = localStorage.getItem("supabase_token")
          if (!token) return

          const response = await fetch("/api/admin-filters", {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (response.ok) {
            const data = await response.json()
            const activeCount = data.filters?.filter((f: any) => f.is_active).length || 0
            setActiveFiltersCount(activeCount)
          }
        } catch (error) {
          console.error("Error fetching filters count:", error)
        }
      }
    }

    fetchActiveFiltersCount()
  }, [user])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Secure Dashboard</h1>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          {user?.role === "admin" && activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Filter className="h-4 w-4" />
              <span>{activeFiltersCount} background filters active</span>
            </div>
          )}
          <p>Your role: {user.role || "N/A"}</p>
        </div>
      ) : (
        <p>Please sign in to access the dashboard.</p>
      )}
    </div>
  )
}

export default SecureDashboard
