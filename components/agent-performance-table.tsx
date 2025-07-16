"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Search, Download, Filter, ArrowUpDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface AgentPerformanceTableProps {
  dateRange: { from: Date; to: Date }
  comparisonMode: boolean
  comparisonDateRange: { from: Date; to: Date }
  selectedTeam: string
}

interface AgentData {
  id: string
  name: string
  team: string
  calls: number
  conversionRate: number
  avgCallDuration: string
  qualityScore: number
  sentimentScore: number
  performance: "excellent" | "good" | "average" | "poor"
  trend: number
}

export function AgentPerformanceTable({
  dateRange,
  comparisonMode,
  comparisonDateRange,
  selectedTeam,
}: AgentPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<keyof AgentData>("qualityScore")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Mock data - in a real implementation, this would come from an API call
  const agentsData: AgentData[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      team: "sales",
      calls: 342,
      conversionRate: 28.4,
      avgCallDuration: "7m 12s",
      qualityScore: 92,
      sentimentScore: 88,
      performance: "excellent",
      trend: 5.2,
    },
    {
      id: "2",
      name: "Michael Chen",
      team: "sales",
      calls: 287,
      conversionRate: 24.7,
      avgCallDuration: "8m 45s",
      qualityScore: 87,
      sentimentScore: 82,
      performance: "good",
      trend: 2.8,
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      team: "support",
      calls: 412,
      conversionRate: 18.2,
      avgCallDuration: "10m 32s",
      qualityScore: 85,
      sentimentScore: 79,
      performance: "good",
      trend: -1.3,
    },
    {
      id: "4",
      name: "David Kim",
      team: "sales",
      calls: 256,
      conversionRate: 26.8,
      avgCallDuration: "6m 58s",
      qualityScore: 90,
      sentimentScore: 85,
      performance: "excellent",
      trend: 4.7,
    },
    {
      id: "5",
      name: "Lisa Thompson",
      team: "retention",
      calls: 198,
      conversionRate: 32.5,
      avgCallDuration: "12m 24s",
      qualityScore: 88,
      sentimentScore: 84,
      performance: "good",
      trend: 3.1,
    },
    {
      id: "6",
      name: "James Wilson",
      team: "support",
      calls: 325,
      conversionRate: 15.8,
      avgCallDuration: "9m 17s",
      qualityScore: 78,
      sentimentScore: 72,
      performance: "average",
      trend: -2.4,
    },
    {
      id: "7",
      name: "Maria Garcia",
      team: "sales",
      calls: 278,
      conversionRate: 22.9,
      avgCallDuration: "7m 45s",
      qualityScore: 84,
      sentimentScore: 80,
      performance: "good",
      trend: 1.8,
    },
    {
      id: "8",
      name: "Robert Brown",
      team: "retention",
      calls: 187,
      conversionRate: 29.7,
      avgCallDuration: "11m 08s",
      qualityScore: 86,
      sentimentScore: 83,
      performance: "good",
      trend: 2.5,
    },
    {
      id: "9",
      name: "Jennifer Lee",
      team: "support",
      calls: 302,
      conversionRate: 14.2,
      avgCallDuration: "8m 52s",
      qualityScore: 75,
      sentimentScore: 68,
      performance: "average",
      trend: -3.2,
    },
    {
      id: "10",
      name: "William Davis",
      team: "sales",
      calls: 245,
      conversionRate: 19.8,
      avgCallDuration: "6m 34s",
      qualityScore: 72,
      sentimentScore: 65,
      performance: "poor",
      trend: -5.7,
    },
  ]

  // Filter agents based on selected team and search term
  const filteredAgents = agentsData
    .filter((agent) => selectedTeam === "all" || agent.team === selectedTeam)
    .filter((agent) => agent.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Sort agents based on selected column and direction
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  const handleSort = (column: keyof AgentData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Good</Badge>
      case "average":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Average</Badge>
      case "poor":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Poor</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agent Performance</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <button className="flex items-center gap-1" onClick={() => handleSort("name")}>
                    Agent Name
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("calls")}>
                    Calls
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("conversionRate")}>
                    Conversion
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Avg. Duration</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("qualityScore")}>
                    Quality Score
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => handleSort("sentimentScore")}>
                    Sentiment
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.calls}</TableCell>
                  <TableCell>{agent.conversionRate}%</TableCell>
                  <TableCell>{agent.avgCallDuration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={agent.qualityScore} className="h-2 w-[60px]" />
                      <span>{agent.qualityScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={agent.sentimentScore} className="h-2 w-[60px]" />
                      <span>{agent.sentimentScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPerformanceBadge(agent.performance)}</TableCell>
                  <TableCell>
                    <div
                      className={`flex items-center ${
                        agent.trend > 0 ? "text-green-600" : agent.trend < 0 ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      {agent.trend > 0 ? (
                        <ArrowUp className="h-4 w-4 mr-1" />
                      ) : agent.trend < 0 ? (
                        <ArrowDown className="h-4 w-4 mr-1" />
                      ) : null}
                      <span>{Math.abs(agent.trend)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
