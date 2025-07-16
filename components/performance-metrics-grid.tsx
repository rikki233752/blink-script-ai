"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Phone, Target, Clock, CheckCircle, Users, Percent } from "lucide-react"

interface PerformanceMetricsGridProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
}

export function PerformanceMetricsGrid({
  dateRange,
  comparisonMode,
  comparisonDateRange,
}: PerformanceMetricsGridProps) {
  // In a real implementation, this data would come from an API call
  const metrics = [
    {
      title: "Total Calls",
      value: "4,892",
      change: 12.5,
      icon: Phone,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Conversion Rate",
      value: "24.8%",
      change: 3.2,
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Avg. Call Duration",
      value: "8m 42s",
      change: -1.5,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-100",
    },
    {
      title: "Quality Score",
      value: "86.3",
      change: 5.7,
      icon: CheckCircle,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      title: "Active Agents",
      value: "127",
      change: 8.0,
      icon: Users,
      color: "text-indigo-500",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Sentiment Score",
      value: "78.2%",
      change: 4.3,
      icon: Percent,
      color: "text-pink-500",
      bgColor: "bg-pink-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              {metric.change !== 0 && (
                <div
                  className={`flex items-center ${
                    metric.change > 0 ? "text-green-600" : metric.change < 0 ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  {metric.change > 0 ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : metric.change < 0 ? (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  ) : null}
                  <span className="text-xs font-medium">{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-medium text-muted-foreground">{metric.title}</h3>
              <p className="text-2xl font-bold">{metric.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
