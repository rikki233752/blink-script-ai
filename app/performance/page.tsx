"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { WeeklyPerformanceSummary } from "@/components/weekly-performance-summary"

export default function PerformancePage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Performance Summary</h1>
          <p className="text-gray-600 mt-2">Comprehensive weekly performance analytics and insights</p>
        </div>
        <WeeklyPerformanceSummary />
      </div>
    </ProtectedRoute>
  )
}
