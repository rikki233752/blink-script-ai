"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { TrendAnalysis } from "@/components/trend-analysis"

export default function TrendsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trend Analysis</h1>
          <p className="text-gray-600 mt-2">Advanced trend analysis and performance forecasting</p>
        </div>
        <TrendAnalysis />
      </div>
    </ProtectedRoute>
  )
}
