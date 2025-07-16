"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { WebhookManagement } from "@/components/webhook-management"

export default function WebhooksPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-gray-600 mt-2">Configure and manage webhook integrations for real-time data delivery</p>
        </div>
        <WebhookManagement />
      </div>
    </ProtectedRoute>
  )
}
