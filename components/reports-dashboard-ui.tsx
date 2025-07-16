"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCampaigns } from "@/hooks/use-campaigns"

interface DateRange {
  from?: Date
  to?: Date
}

export function ReportsDashboardUI() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [selectedAgent, setSelectedAgent] = useState<string>("")

  // Get real campaigns from the analytics section
  const { campaigns: realCampaigns, loading: campaignsLoading } = useCampaigns({})

  const campaigns = realCampaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    totalCalls: campaign.totalCalls,
    averageScore: campaign.averageScore,
  }))

  // Generate agents based on selected campaign
  const agents =
    selectedCampaign && campaigns.find((c) => c.id === selectedCampaign)
      ? [
          {
            id: "1",
            name: "John Smith",
            email: "john.smith@company.com",
            campaignId: selectedCampaign,
            totalCalls: campaigns.find((c) => c.id === selectedCampaign)?.totalCalls || 0,
            averageScore: campaigns.find((c) => c.id === selectedCampaign)?.averageScore || 0,
          },
          {
            id: "2",
            name: "Sarah Johnson",
            email: "sarah.johnson@company.com",
            campaignId: selectedCampaign,
            totalCalls: Math.floor((campaigns.find((c) => c.id === selectedCampaign)?.totalCalls || 0) * 0.8),
            averageScore: (campaigns.find((c) => c.id === selectedCampaign)?.averageScore || 0) * 0.9,
          },
          {
            id: "3",
            name: "Mike Davis",
            email: "mike.davis@company.com",
            campaignId: selectedCampaign,
            totalCalls: Math.floor((campaigns.find((c) => c.id === selectedCampaign)?.totalCalls || 0) * 0.6),
            averageScore: (campaigns.find((c) => c.id === selectedCampaign)?.averageScore || 0) * 1.1,
          },
        ]
      : []

  const selectedAgentData = agents.find((agent) => agent.id === selectedAgent)
  const selectedCampaignData = campaigns.find((c) => c.id === selectedCampaign)

  const overallScore = selectedAgentData ? Math.round(selectedAgentData.averageScore * 20) : 0

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Select a date range for the report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign</CardTitle>
            <CardDescription>Select a campaign for the report</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCampaign}
              onValueChange={(value) => {
                setSelectedCampaign(value)
                setSelectedAgent("") // Reset agent when campaign changes
              }}
              disabled={!dateRange?.from || !dateRange?.to || campaignsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={campaignsLoading ? "Loading campaigns..." : "Select a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.length === 0 ? (
                  <SelectItem value="no-campaigns" disabled>
                    {campaignsLoading ? "Loading..." : "No campaigns available"}
                  </SelectItem>
                ) : (
                  campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{campaign.name}</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            campaign.status === "active"
                              ? "bg-green-100 text-green-800"
                              : campaign.status === "paused"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent</CardTitle>
            <CardDescription>Select an agent for the report</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={!selectedCampaign}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <SelectItem value="no-agents" disabled>
                    No agents available
                  </SelectItem>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
            <CardDescription>Average score of the selected agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {selectedAgentData ? `${Math.round(selectedAgentData.averageScore * 20)}%` : "0%"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Calls</CardTitle>
            <CardDescription>Total calls made by the selected agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {selectedAgentData ? selectedAgentData.totalCalls.toLocaleString() : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Minutes</CardTitle>
            <CardDescription>Total minutes spent on calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {selectedAgentData ? Math.round(selectedAgentData.totalCalls * 8.5).toLocaleString() : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Completed</CardTitle>
            <CardDescription>Total calls completed by the selected agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {selectedAgentData ? Math.round(selectedAgentData.totalCalls * 0.9).toLocaleString() : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Score</CardTitle>
          <CardDescription>Overall score of the selected agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${overallScore * 2.51} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{overallScore}%</span>
                <span className="text-sm text-gray-500">Score</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
