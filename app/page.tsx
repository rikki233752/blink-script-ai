"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CallAnalysisDashboard } from "@/components/call-analysis-dashboard"
import { DashboardStats } from "@/components/dashboard-stats"
import { QuickAccessMenu } from "@/components/quick-access-menu"
import { useEffect, useState } from "react"

export default function Page() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only render the full content on the client side
  if (!isClient) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <QuickAccessMenu />
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats />
          <CallAnalysisDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
