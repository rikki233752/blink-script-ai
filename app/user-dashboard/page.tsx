"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, TrendingUp, Users, Clock, Settings, Plus, BarChart3, Shield, Bell, LogOut } from "lucide-react"

export default function UserDashboard() {
  const [user, setUser] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@company.com",
    company: "Acme Corp",
    plan: "Pro",
    ringbaConnected: false,
  })

  const [stats, setStats] = useState({
    totalCalls: 0,
    analyzedCalls: 0,
    avgQualityScore: 0,
    conversionRate: 0,
  })

  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    // Simulate loading user data
    const loadUserData = async () => {
      // In real implementation, fetch user-specific data from API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        totalCalls: 1247,
        analyzedCalls: 1180,
        avgQualityScore: 8.7,
        conversionRate: 23.4,
      })
    }

    loadUserData()
  }, [])

  const handleRingbaConnect = () => {
    // Navigate to Ringba integration setup
    window.location.href = "/user-dashboard/integrations/ringba"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm opacity-90"></div>
                </div>
                <span className="text-xl font-bold text-gray-900">Blinkscript.ai</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {user.plan} Plan
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your call center analytics</p>
        </div>

        {/* Ringba Integration Status */}
        {!user.ringbaConnected && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Connect Your Ringba Account</h3>
                  <p className="text-blue-700 mt-1">Start analyzing your calls by connecting your Ringba account</p>
                </div>
                <Button onClick={handleRingbaConnect} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Ringba
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Total Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalCalls.toLocaleString()}</div>
              <p className="text-sm text-green-600 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyzed Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.analyzedCalls.toLocaleString()}</div>
              <p className="text-sm text-gray-600 mt-1">
                {((stats.analyzedCalls / stats.totalCalls) * 100).toFixed(1)}% coverage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Avg Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.avgQualityScore}/10</div>
              <p className="text-sm text-green-600 mt-1">+0.3 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</div>
              <p className="text-sm text-green-600 mt-1">+2.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calls">Call Analysis</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Call Activity</CardTitle>
                  <CardDescription>Your latest analyzed calls</CardDescription>
                </CardHeader>
                <CardContent>
                  {user.ringbaConnected ? (
                    <div className="space-y-4">
                      {/* Call activity would be rendered here */}
                      <p className="text-gray-500 text-center py-8">
                        Call activity will appear here once you connect Ringba
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Connect Ringba to see your call activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>AI-powered recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Improve Call Quality</h4>
                      <p className="text-sm text-blue-700 mt-1">Focus on greeting consistency to boost scores by 15%</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Peak Performance</h4>
                      <p className="text-sm text-green-700 mt-1">Tuesday 2-4 PM shows highest conversion rates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>Call Analysis</CardTitle>
                <CardDescription>Detailed analysis of your call recordings</CardDescription>
              </CardHeader>
              <CardContent>
                {user.ringbaConnected ? (
                  <p className="text-gray-500 text-center py-8">Call analysis dashboard will be available here</p>
                ) : (
                  <div className="text-center py-12">
                    <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Calls to Analyze</h3>
                    <p className="text-gray-500 mb-6">Connect your Ringba account to start analyzing calls</p>
                    <Button onClick={handleRingbaConnect}>Connect Ringba Account</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Reports</CardTitle>
                <CardDescription>Comprehensive performance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h3>
                  <p className="text-gray-500">Detailed analytics reports will be available once you have call data</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className={user.ringbaConnected ? "border-green-200 bg-green-50" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Ringba
                  </CardTitle>
                  <CardDescription>Connect your call tracking platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {user.ringbaConnected ? (
                    <div>
                      <Badge className="bg-green-100 text-green-800 mb-4">Connected</Badge>
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Connection
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleRingbaConnect} className="w-full">
                      Connect
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="opacity-50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Twilio
                  </CardTitle>
                  <CardDescription>Coming soon - Voice platform integration</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card className="opacity-50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Salesforce
                  </CardTitle>
                  <CardDescription>Coming soon - CRM integration</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
