"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, PieChart, Radar, TrendingUp } from "lucide-react"

interface CallAnalysisData {
  analysis: {
    overallRating: "GOOD" | "BAD" | "UGLY"
    toneQuality: {
      agent: string
      customer: string
      score: number
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
      conversionConfidence: number
    }
    agentPerformance: {
      communicationSkills: number
      problemSolving: number
      productKnowledge: number
      customerService: number
    }
  }
}

interface ChartPreviewProps {
  data: CallAnalysisData
}

export function ChartPreview({ data }: ChartPreviewProps) {
  const performanceData = [
    { label: "Communication", value: data.analysis.agentPerformance.communicationSkills, color: "#3b82f6" },
    { label: "Problem Solving", value: data.analysis.agentPerformance.problemSolving, color: "#10b981" },
    { label: "Product Knowledge", value: data.analysis.agentPerformance.productKnowledge, color: "#f59e0b" },
    { label: "Customer Service", value: data.analysis.agentPerformance.customerService, color: "#ef4444" },
  ]

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "GOOD":
        return "#10b981"
      case "BAD":
        return "#f59e0b"
      case "UGLY":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Chart Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Bar Chart Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">Performance Bar Chart</h4>
            </div>
            <div className="space-y-2">
              {performanceData.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}/10</span>
                  </div>
                  <Progress value={item.value * 10} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Pie Chart Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold">Conversion Analysis</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Conversion Achieved:</span>
                <Badge variant={data.analysis.businessConversion.conversionAchieved ? "default" : "secondary"}>
                  {data.analysis.businessConversion.conversionAchieved ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Type:</span>
                <span className="font-medium">{data.analysis.businessConversion.conversionType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Confidence:</span>
                <span className="font-semibold">{data.analysis.businessConversion.conversionConfidence}%</span>
              </div>
              <Progress value={data.analysis.businessConversion.conversionConfidence} className="h-2" />
            </div>
          </div>

          {/* Radar Chart Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold">Performance Radar</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {performanceData.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">
                    {item.label}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Rating Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <h4 className="font-semibold">Overall Rating</h4>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: getRatingColor(data.analysis.overallRating) }}
              />
              <Badge
                style={{
                  backgroundColor: getRatingColor(data.analysis.overallRating),
                  color: "white",
                }}
              >
                {data.analysis.overallRating}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <p>Tone Score: {data.analysis.toneQuality.score}/10</p>
              <p>Agent: {data.analysis.toneQuality.agent}</p>
              <p>Customer: {data.analysis.toneQuality.customer}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-800 mb-2">Charts Included in Export:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • <strong>Performance Bar Chart:</strong> Visual comparison of all skill metrics
            </li>
            <li>
              • <strong>Performance Radar Chart:</strong> 360-degree view of agent capabilities
            </li>
            <li>
              • <strong>Conversion Pie Chart:</strong> Success rate visualization
            </li>
            <li>
              • <strong>Progress Bars:</strong> Detailed scoring with visual indicators
            </li>
            <li>
              • <strong>Tone Analysis:</strong> Color-coded sentiment representation
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
