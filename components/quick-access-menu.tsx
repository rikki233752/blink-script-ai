"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mic, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function QuickAccessMenu() {
  const { logout, user } = useAuth()

  const quickActions = [
    {
      title: "Ringba Campaigns",
      description: "AI-powered call analysis and coaching",
      href: "/onscript/campaigns",
      icon: Mic,
      color: "bg-purple-500 hover:bg-purple-600",
      badge: "AI",
    },
    {
      title: "Ringba Reporting",
      description: "Advanced analytics and reporting dashboard",
      href: "/ringba-reporting",
      icon: BarChart3,
      color: "bg-orange-500 hover:bg-orange-600",
      badge: "Analytics",
    },
    {
      title: "Retreaver Campaigns",
      description: "Manage and analyze your Retreaver campaigns",
      href: "/retreaver-campaigns",
      icon: Phone,
      color: "bg-green-500 hover:bg-green-600",
      badge: "New",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Add user info and logout button at the top */}
      {user && (
        <div className="flex justify-end items-center mb-2">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{user?.name || user?.email}</span> ({user?.role})
            </span>
            <Button onClick={logout} variant="outline" size="sm" className="text-sm bg-transparent">
              Logout
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quick Access</h2>
        <p className="text-muted-foreground">Jump to your most used features and tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon
          return (
            <Card key={action.href} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={action.href}>
                  <Button className="w-full bg-transparent" variant="outline">
                    Open {action.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
