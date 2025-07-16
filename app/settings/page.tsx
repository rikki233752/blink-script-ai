"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AccessManagement } from "@/components/access-management"
import { CampaignPermissions } from "@/components/campaign-permissions"
import { DigestReports } from "@/components/digest-reports"
import { Button } from "@/components/ui/button"
import { X, Users, Shield, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("access-management")
  const router = useRouter()

  const tabs = [
    {
      id: "access-management",
      label: "Access Management",
      icon: Users,
      component: AccessManagement,
    },
    {
      id: "campaign-permissions",
      label: "Campaign Permissions",
      icon: Shield,
      component: CampaignPermissions,
    },
    {
      id: "digest-reports",
      label: "Digest Reports",
      icon: FileText,
      component: DigestReports,
    },
  ]

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || AccessManagement

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Account Settings</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <ActiveComponent />
        </div>
      </div>
    </ProtectedRoute>
  )
}
