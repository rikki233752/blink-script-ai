"use client"

import { Shield, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function CampaignPermissions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Campaign Permissions</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Campaign Access Control</span>
          </CardTitle>
          <CardDescription>Manage user permissions for specific campaigns and features.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Campaign Permissions</h3>
            <p className="mt-1 text-sm text-gray-500">Configure campaign-specific access controls and permissions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
