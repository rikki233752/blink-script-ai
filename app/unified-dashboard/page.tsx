"use client"

import { UnifiedCallDashboard } from "@/components/unified-call-dashboard"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Phone, Upload, Mic } from "lucide-react"

export default function UnifiedDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Unified Call Dashboard</h1>
                  <p className="text-gray-600">Complete view of all calls - manual uploads and integrations</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Upload className="h-4 w-4 mr-1" />
                Manual Uploads
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Phone className="h-4 w-4 mr-1" />
                RingBA Integration
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Mic className="h-4 w-4 mr-1" />
                Deepgram AI
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UnifiedCallDashboard />
      </div>
    </div>
  )
}
