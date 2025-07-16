"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { ReportsDashboard } from "@/components/reports-dashboard"

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OnScript AI Reports</h1>
          <p className="text-gray-600 mt-2">Advanced call center analytics and insights platform</p>
        </div>
        <ReportsDashboard />
      </div>
    </ProtectedRoute>
  )
}
