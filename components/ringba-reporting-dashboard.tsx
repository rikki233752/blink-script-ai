"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RefreshCw, CalendarIcon, Play, Settings, ChevronDown, Filter } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface CallMetrics {
  totalCalls: number
  answeredCalls: number
  missedCalls: number
  totalDuration: number
  averageDuration: number
  conversionRate: number
  revenue: number
  payout: number
}

interface CampaignSummary {
  id: string
  name: string
  publisher: string
  target: string
  buyer: string
  dialedNumber: number
  numberPool: number
  date: string
  duplicate: number
  tags: string[]
  revenue: number
  payout: number
  live: number
  completed: number
  ended: number
  connected: number
  paid: number
  converted: number
  noConnection: number
  duplicateCount: number
  blocked: number
  ivrHandled: number
  rpc: number
}

interface CallDetail {
  id: string
  callDate: string
  inboundNumber: string
  geoSubDivision: string
  hangup: string
  duplicate: boolean
  connected: boolean
  recording: string
  userQuality: string
  publisher: string
  callerId: string
  timeToAnswer: string
  timeToConnect: string
  revenue: number
  transcription?: string
}

interface TimelineData {
  month: string
  calls: number
  revenue: number
}

export function RingbaReportingDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<CallMetrics | null>(null)
  const [campaignSummary, setCampaignSummary] = useState<CampaignSummary[]>([])
  const [callDetails, setCallDetails] = useState<CallDetail[]>([])
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [selectedTimezone, setSelectedTimezone] = useState("UTC-05:00")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 7), // Jan 7, 2025
    to: new Date(2025, 6, 7), // Jul 7, 2025
  })

  // Filter states
  const [campaignFilter, setCampaignFilter] = useState("")
  const [targetFilter, setTargetFilter] = useState("")
  const [buyerFilter, setBuyerFilter] = useState("")
  const [numberPoolFilter, setNumberPoolFilter] = useState("")
  const [publisherFilter, setPublisherFilter] = useState("")
  const [numberFilter, setNumberFilter] = useState("")
  const [inboundCallIdFilter, setInboundCallIdFilter] = useState("")
  const [isDuplicateFilter, setIsDuplicateFilter] = useState("")
  const [callerIdFilter, setCallerIdFilter] = useState("")

  useEffect(() => {
    fetchReportingData()
    if (autoRefresh) {
      const interval = setInterval(fetchReportingData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [dateRange, autoRefresh])

  const fetchReportingData = async () => {
    setLoading(true)
    try {
      // Mock timeline data matching the screenshot
      const mockTimelineData = [
        { month: "Jan, 2025", calls: 15000, revenue: 15000 },
        { month: "Feb, 2025", calls: 25000, revenue: 25000 },
        { month: "Mar, 2025", calls: 30000, revenue: 30000 },
        { month: "Apr, 2025", calls: 45000, revenue: 45000 },
        { month: "May, 2025", calls: 75000, revenue: 75000 },
        { month: "Jun, 2025", calls: 150000, revenue: 150000 },
        { month: "Jul, 2025", calls: 20000, revenue: 20000 },
      ]
      setTimelineData(mockTimelineData)

      // Mock campaign summary data matching the screenshot
      const mockCampaignSummary = [
        {
          id: "aca-tier1",
          name: "ACA (2) - Tier 1",
          publisher: "ACA (2) - Tier 1",
          target: "",
          buyer: "",
          dialedNumber: 83853,
          numberPool: 83852,
          date: "2025",
          duplicate: 12923,
          tags: [],
          revenue: 1216741.04,
          payout: 930635.92,
          live: 0,
          completed: 82615,
          ended: 70930,
          connected: 49859,
          paid: 52441,
          converted: 12923,
          noConnection: 6586,
          duplicateCount: 1237,
          blocked: 0,
          ivrHandled: 1,
          rpc: 14.51,
        },
        {
          id: "medi-tier2",
          name: "Medi (2) - Tier 2",
          publisher: "Medi (2) - Tier 2",
          target: "",
          buyer: "",
          dialedNumber: 83106,
          numberPool: 83099,
          date: "2025",
          duplicate: 38189,
          tags: [],
          revenue: 311164.76,
          payout: 224815.55,
          live: 3,
          completed: 78782,
          ended: 44917,
          connected: 20067,
          paid: 21186,
          converted: 38189,
          noConnection: 5060,
          duplicateCount: 4317,
          blocked: 0,
          ivrHandled: 4,
          rpc: 3.74,
        },
        {
          id: "aca-tier2",
          name: "ACA (2) - Tier 2",
          publisher: "ACA (2) - Tier 2",
          target: "",
          buyer: "",
          dialedNumber: 45941,
          numberPool: 45940,
          date: "2025",
          duplicate: 8109,
          tags: [],
          revenue: 445694.1,
          payout: 347947.53,
          live: 0,
          completed: 44249,
          ended: 37832,
          connected: 20922,
          paid: 22143,
          converted: 8109,
          noConnection: 2831,
          duplicateCount: 1691,
          blocked: 0,
          ivrHandled: 1,
          rpc: 9.7,
        },
        {
          id: "aca-tier1h",
          name: "ACA (2) - Tier 1H",
          publisher: "ACA (2) - Tier 1H",
          target: "",
          buyer: "",
          dialedNumber: 38839,
          numberPool: 38838,
          date: "2025",
          duplicate: 4404,
          tags: [],
          revenue: 586642.94,
          payout: 436589.24,
          live: 1,
          completed: 38545,
          ended: 34435,
          connected: 23614,
          paid: 24957,
          converted: 4404,
          noConnection: 1468,
          duplicateCount: 293,
          blocked: 0,
          ivrHandled: 0,
          rpc: 15.1,
        },
        {
          id: "medi-tier1",
          name: "Medi (2) - Tier 1",
          publisher: "Medi (2) - Tier 1",
          target: "",
          buyer: "",
          dialedNumber: 35479,
          numberPool: 35476,
          date: "2025",
          duplicate: 24786,
          tags: [],
          revenue: 106974.57,
          payout: 81763.08,
          live: 0,
          completed: 32356,
          ended: 10693,
          connected: 7449,
          paid: 7815,
          converted: 24786,
          noConnection: 352,
          duplicateCount: 3120,
          blocked: 0,
          ivrHandled: 3,
          rpc: 3.02,
        },
        {
          id: "medi-internal",
          name: "Medi - Internal",
          publisher: "Medi - Internal",
          target: "",
          buyer: "",
          dialedNumber: 32326,
          numberPool: 28852,
          date: "2025",
          duplicate: 6791,
          tags: [],
          revenue: 188264.45,
          payout: 164264.03,
          live: 0,
          completed: 28843,
          ended: 25535,
          connected: 14041,
          paid: 16240,
          converted: 6791,
          noConnection: 7237,
          duplicateCount: 9,
          blocked: 0,
          ivrHandled: 3474,
          rpc: 6.53,
        },
      ]
      setCampaignSummary(mockCampaignSummary)

      // Mock call details data matching the screenshot
      const mockCallDetails = [
        {
          id: "call1",
          callDate: "Jun 17 02:54:07 PM",
          inboundNumber: "TN",
          geoSubDivision: "",
          hangup: "phone",
          duplicate: false,
          connected: true,
          recording: "00:00:...",
          userQuality: "",
          publisher: "Cobras",
          callerId: "+18654057873",
          timeToAnswer: "00:00:01",
          timeToConnect: "00:00:03",
          revenue: 100.0,
        },
        {
          id: "call2",
          callDate: "Jun 17 02:45:03 PM",
          inboundNumber: "NY",
          geoSubDivision: "",
          hangup: "phone",
          duplicate: false,
          connected: true,
          recording: "00:06:...",
          userQuality: "",
          publisher: "Scalability",
          callerId: "+17169697812",
          timeToAnswer: "00:00:02",
          timeToConnect: "00:00:03",
          revenue: 100.0,
        },
        {
          id: "call3",
          callDate: "Jun 17 02:03:15 PM",
          inboundNumber: "TX",
          geoSubDivision: "",
          hangup: "phone",
          duplicate: false,
          connected: true,
          recording: "00:06:...",
          userQuality: "",
          publisher: "Sunday Digital",
          callerId: "+19795290177",
          timeToAnswer: "00:00:03",
          timeToConnect: "00:00:03",
          revenue: 100.0,
        },
        {
          id: "call4",
          callDate: "Jun 17 03:39:04 PM",
          inboundNumber: "GA",
          geoSubDivision: "",
          hangup: "phone",
          duplicate: true,
          connected: true,
          recording: "00:00:...",
          userQuality: "",
          publisher: "Sunday Digital",
          callerId: "+17062703023",
          timeToAnswer: "00:00:00",
          timeToConnect: "00:00:03",
          revenue: 100.0,
        },
        {
          id: "call5",
          callDate: "May 15 03:37:56 PM",
          inboundNumber: "AR",
          geoSubDivision: "",
          hangup: "phone",
          duplicate: false,
          connected: true,
          recording: "00:00:...",
          userQuality: "",
          publisher: "PM",
          callerId: "+18702003379",
          timeToAnswer: "00:00:12",
          timeToConnect: "00:00:04",
          revenue: 90.0,
        },
        {
          id: "call6",
          callDate: "Jan 23 02:12:44 PM",
          inboundNumber: "KS",
          geoSubDivision: "",
          hangup: "circle",
          duplicate: false,
          connected: false,
          recording: "00:00:...",
          userQuality: "",
          publisher: "PP",
          callerId: "+13162376711",
          timeToAnswer: "00:00:03",
          timeToConnect: "00:00:02",
          revenue: 60.0,
        },
        {
          id: "call7",
          callDate: "Jan 23 02:45:06 PM",
          inboundNumber: "AZ",
          geoSubDivision: "",
          hangup: "circle",
          duplicate: false,
          connected: false,
          recording: "00:00:...",
          userQuality: "",
          publisher: "HQ",
          callerId: "+14805066143",
          timeToAnswer: "00:00:06",
          timeToConnect: "00:00:05",
          revenue: 60.0,
        },
        {
          id: "call8",
          callDate: "Jun 13 10:13:20 AM",
          inboundNumber: "FL",
          geoSubDivision: "",
          hangup: "phone",
          duplicate: false,
          connected: true,
          recording: "00:28:...",
          userQuality: "",
          publisher: "Policy Chat",
          callerId: "+13866781012",
          timeToAnswer: "00:00:00",
          timeToConnect: "00:00:03",
          revenue: 57.12,
        },
        {
          id: "call9",
          callDate: "Feb 04 11:29:22 AM",
          inboundNumber: "SC",
          geoSubDivision: "South Carolina",
          hangup: "phone",
          duplicate: false,
          connected: true,
          recording: "00:03:...",
          userQuality: "",
          publisher: "Blink - Alex",
          callerId: "+18032006375",
          timeToAnswer: "00:01:18",
          timeToConnect: "00:00:05",
          revenue: 56.0,
        },
        {
          id: "call10",
          callDate: "Jun 16 09:26:55 AM",
          inboundNumber: "CA",
          geoSubDivision: "",
          hangup: "circle",
          duplicate: false,
          connected: false,
          recording: "00:36:...",
          userQuality: "",
          publisher: "Acquire IQ",
          callerId: "+17143916679",
          timeToAnswer: "00:00:09",
          timeToConnect: "00:00:05",
          revenue: 56.0,
        },
      ]
      setCallDetails(mockCallDetails)

      // Calculate metrics
      const totalCalls = mockCallDetails.length
      const answeredCalls = mockCallDetails.filter((call) => call.connected).length
      const totalRevenue = mockCampaignSummary.reduce((sum, campaign) => sum + campaign.revenue, 0)
      const totalPayout = mockCampaignSummary.reduce((sum, campaign) => sum + campaign.payout, 0)

      setMetrics({
        totalCalls,
        answeredCalls,
        missedCalls: totalCalls - answeredCalls,
        totalDuration: 0,
        averageDuration: 0,
        conversionRate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
        revenue: totalRevenue,
        payout: totalPayout,
      })
    } catch (error) {
      console.error("Error fetching reporting data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (format: "csv" | "excel") => {
    try {
      const response = await fetch(
        `/api/ringba/reporting/export?format=${format}&from=${dateRange?.from?.toISOString()}&to=${dateRange?.to?.toISOString()}`,
      )
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ringba-report-${format === "csv" ? "csv" : "xlsx"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please log in to view Ringba reporting.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">Updated a few seconds ago</div>

          <Select value="Admin" onValueChange={() => {}}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger className="w-80 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC-05:00">(UTC-05:00) Eastern Time (US & Canada)</SelectItem>
              <SelectItem value="UTC-08:00">(UTC-08:00) Pacific Time (US & Canada)</SelectItem>
              <SelectItem value="UTC+00:00">(UTC+00:00) UTC</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-80 bg-slate-800 border-slate-700 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d, yyyy HH:mm")} - {format(dateRange.to, "MMM d, yyyy HH:mm")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy HH:mm")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="bg-slate-800"
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className="text-sm">AUTO REFRESH</span>
            <RefreshCw className="h-4 w-4" />
          </div>
        </div>

        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-2 mb-6">
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
            <SelectValue placeholder="CAMPAIGN" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            <SelectItem value="aca-tier1">ACA (2) - Tier 1</SelectItem>
            <SelectItem value="medi-tier2">Medi (2) - Tier 2</SelectItem>
          </SelectContent>
        </Select>

        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
            <SelectValue placeholder="TARGET" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Targets</SelectItem>
          </SelectContent>
        </Select>

        <Select value={buyerFilter} onValueChange={setBuyerFilter}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
            <SelectValue placeholder="BUYER" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buyers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={numberPoolFilter} onValueChange={setNumberPoolFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
            <SelectValue placeholder="NUMBER POOL" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Number Pools</SelectItem>
          </SelectContent>
        </Select>

        <Select value={publisherFilter} onValueChange={setPublisherFilter}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700">
            <SelectValue placeholder="PUBLISHER" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Publishers</SelectItem>
            <SelectItem value="cobras">Cobras</SelectItem>
            <SelectItem value="scalability">Scalability</SelectItem>
            <SelectItem value="sunday-digital">Sunday Digital</SelectItem>
          </SelectContent>
        </Select>

        <Select value={numberFilter} onValueChange={setNumberFilter}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
            <SelectValue placeholder="NUMBER" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Numbers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={inboundCallIdFilter} onValueChange={setInboundCallIdFilter}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
            <SelectValue placeholder="INBOUND CALL ID" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Call IDs</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isDuplicateFilter} onValueChange={setIsDuplicateFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
            <SelectValue placeholder="IS DUPLICATE" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>

        <Select value={callerIdFilter} onValueChange={setCallerIdFilter}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700">
            <SelectValue placeholder="CALLER ID" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Caller IDs</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Filter className="h-4 w-4 mr-2" />
          FILTER
        </Button>
      </div>

      {/* Timeline Chart */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <Select value="Auto (By month)" onValueChange={() => {}}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Auto (By month)">Auto (By month)</SelectItem>
              <SelectItem value="By day">By day</SelectItem>
              <SelectItem value="By week">By week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 h-80">
          <div className="relative h-full">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-slate-400">
              <span>200000</span>
              <span>100000</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="ml-16 h-full flex items-end justify-between px-4">
              {timelineData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-yellow-500 w-16 rounded-t"
                    style={{
                      height: `${(data.calls / 200000) * 100}%`,
                      minHeight: "8px",
                    }}
                  ></div>
                  <div className="text-xs text-slate-400 mt-2 text-center">{data.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Summary</h2>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 bg-transparent"
            onClick={() => exportData("csv")}
          >
            EXPORT CSV
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 font-medium">Campaign</th>
                  <th className="text-left p-4 font-medium bg-blue-600/20">Publisher</th>
                  <th className="text-left p-4 font-medium">Target</th>
                  <th className="text-left p-4 font-medium">Buyer</th>
                  <th className="text-left p-4 font-medium">Dialed #</th>
                  <th className="text-left p-4 font-medium">Number Pool</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Duplicate</th>
                  <th className="text-left p-4 font-medium">Tags</th>
                </tr>
                <tr className="border-b border-slate-700 text-sm">
                  <th className="text-left p-2 font-normal text-slate-400">Campaign</th>
                  <th className="text-left p-2 font-normal text-slate-400">
                    <div className="flex items-center space-x-4">
                      <span>↓ Inco...</span>
                      <span>Live</span>
                      <span>Complet...</span>
                      <span>Ended</span>
                      <span>Connect...</span>
                      <span>Paid</span>
                      <span>Convert...</span>
                      <span>No Conn...</span>
                      <span>Duplicate</span>
                      <span>Blocked</span>
                      <span>IVR Han...</span>
                      <span>RPC</span>
                      <span>Revenue</span>
                      <span>Payout</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaignSummary.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-700">
                    <td className="p-4">{campaign.name}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{formatNumber(campaign.dialedNumber)}</span>
                        <span>{campaign.live}</span>
                        <span>{formatNumber(campaign.completed)}</span>
                        <span>{formatNumber(campaign.ended)}</span>
                        <span>{formatNumber(campaign.connected)}</span>
                        <span>{formatNumber(campaign.paid)}</span>
                        <span>{formatNumber(campaign.converted)}</span>
                        <span>{formatNumber(campaign.noConnection)}</span>
                        <span>{formatNumber(campaign.duplicateCount)}</span>
                        <span>{campaign.blocked}</span>
                        <span>{campaign.ivrHandled}</span>
                        <span>${campaign.rpc}</span>
                        <span>{formatCurrency(campaign.revenue)}</span>
                        <span>{formatCurrency(campaign.payout)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-700/50">
                  <td className="p-4 font-semibold">Totals 13</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-4 text-sm font-semibold">
                      <span>110,629</span>
                      <span>30,588</span>
                      <span>13,729</span>
                      <span>4,331</span>
                      <span>$9.79</span>
                      <span>$4,027,332.05</span>
                      <span>$3,135,626.99</span>
                      <span>$891,705.06</span>
                      <span>22.14%</span>
                      <span>47.27%</span>
                      <span>28599:19:37</span>
                      <span>00:04:16</span>
                      <span>$84,702,475</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Call Details Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Call Details</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="border-slate-600 bg-transparent">
              CLEAR SELECTION
            </Button>
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
              EDIT CALLS
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-slate-600 bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              CUSTOMIZE COLUMNS
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 bg-transparent"
              onClick={() => exportData("csv")}
            >
              EXPORT CSV
            </Button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 font-medium">Call Date</th>
                  <th className="text-left p-4 font-medium">Inbound...</th>
                  <th className="text-left p-4 font-medium">Geo:Sub Division</th>
                  <th className="text-left p-4 font-medium">Han...</th>
                  <th className="text-left p-4 font-medium">Dupl...</th>
                  <th className="text-left p-4 font-medium">Con...</th>
                  <th className="text-left p-4 font-medium">Recor...</th>
                  <th className="text-left p-4 font-medium">User:Qua...</th>
                  <th className="text-left p-4 font-medium">Publisher</th>
                  <th className="text-left p-4 font-medium">Caller ID</th>
                  <th className="text-left p-4 font-medium">Time T...</th>
                  <th className="text-left p-4 font-medium">Time T...</th>
                  <th className="text-left p-4 font-medium">↓ Re...</th>
                  <th className="text-left p-4 font-medium">Trans...</th>
                </tr>
              </thead>
              <tbody>
                {callDetails.map((call) => (
                  <tr key={call.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="flex items-center">
                        <ChevronDown className="h-4 w-4 mr-2" />
                        {call.callDate}
                      </div>
                    </td>
                    <td className="p-4">{call.inboundNumber}</td>
                    <td className="p-4">{call.geoSubDivision}</td>
                    <td className="p-4">
                      {call.hangup === "phone" ? (
                        <div className="w-4 h-4 rounded bg-slate-600 flex items-center justify-center">📞</div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                      )}
                    </td>
                    <td className="p-4">{call.duplicate ? "Yes" : "No"}</td>
                    <td className="p-4">{call.recording}</td>
                    <td className="p-4">
                      {call.recording && call.recording !== "00:00:..." && (
                        <Button variant="ghost" size="sm" className="p-1">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                    <td className="p-4">{call.userQuality}</td>
                    <td className="p-4">{call.publisher}</td>
                    <td className="p-4">{call.callerId}</td>
                    <td className="p-4">{call.timeToAnswer}</td>
                    <td className="p-4">{call.timeToConnect}</td>
                    <td className="p-4">{formatCurrency(call.revenue)}</td>
                    <td className="p-4">{call.transcription || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
