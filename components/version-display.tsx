"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Sparkles, Rocket, Star, GitBranch, Calendar, Users, TrendingUp } from "lucide-react"

const VERSION_INFO = {
  version: "94",
  codename: "Lightning",
  releaseDate: "2024-12-06",
  buildNumber: "94.1.0",
  features: [
    "🚀 Enhanced RingBA Integration",
    "⚡ Real-time Call Monitoring",
    "🧠 Advanced AI Analysis",
    "📊 Comprehensive Health Checks",
    "🔄 Automated Webhook System",
    "📈 Performance Analytics",
    "🎯 Smart Coaching Insights",
    "🔐 Enterprise Security",
  ],
  improvements: [
    "50% faster call processing",
    "Enhanced error handling",
    "Improved user interface",
    "Better integration stability",
    "Advanced reporting features",
  ],
}

export function VersionDisplay() {
  return (
    <div className="space-y-6">
      {/* Main Version Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Rocket className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">Call Center Analytics</h1>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 text-white border-white/30">Version {VERSION_INFO.version}</Badge>
                    <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {VERSION_INFO.codename}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-blue-100">AI-Powered Call Analysis Platform - Latest Generation</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">v{VERSION_INFO.version}</div>
              <div className="text-sm text-blue-200">Build {VERSION_INFO.buildNumber}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Release Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Release Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">v{VERSION_INFO.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Codename:</span>
                <span className="font-medium">{VERSION_INFO.codename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Release Date:</span>
                <span className="font-medium">{VERSION_INFO.releaseDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build:</span>
                <span className="font-medium">{VERSION_INFO.buildNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Performance</h3>
            </div>
            <div className="space-y-3">
              {VERSION_INFO.improvements.map((improvement, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{improvement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">System Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform Status</span>
                <Badge className="bg-green-500 text-white">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Services</span>
                <Badge className="bg-green-500 text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Integrations</span>
                <Badge className="bg-green-500 text-white">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Analytics</span>
                <Badge className="bg-green-500 text-white">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <GitBranch className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Version {VERSION_INFO.version} Features</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {VERSION_INFO.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <GitBranch className="h-4 w-4 mr-2" />
              View Changelog
            </Button>
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              System Health
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Metrics
            </Button>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              What's New
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
