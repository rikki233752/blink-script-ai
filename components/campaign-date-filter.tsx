"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, Filter, RefreshCw } from "lucide-react"
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import type { DateRange } from "react-day-picker"

interface CampaignDateFilterProps {
  onDateRangeChange: (range: DateRange | undefined) => void
  onApplyFilter: () => void
  isLoading?: boolean
  totalCampaigns?: number
  filteredCampaigns?: number
}

export function CampaignDateFilter({
  onDateRangeChange,
  onApplyFilter,
  isLoading = false,
  totalCampaigns = 0,
  filteredCampaigns = 0,
}: CampaignDateFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const presetRanges = [
    {
      label: "Today",
      value: "today",
      icon: "📅",
      getRange: () => {
        const today = new Date()
        return { from: today, to: today }
      },
    },
    {
      label: "Yesterday",
      value: "yesterday",
      icon: "📆",
      getRange: () => {
        const yesterday = subDays(new Date(), 1)
        return { from: yesterday, to: yesterday }
      },
    },
    {
      label: "Last 7 Days",
      value: "7days",
      icon: "📊",
      getRange: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: "This Week",
      value: "thisweek",
      icon: "📋",
      getRange: () => ({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      }),
    },
    {
      label: "Last 30 Days",
      value: "30days",
      icon: "📈",
      getRange: () => ({
        from: subDays(new Date(), 29),
        to: new Date(),
      }),
    },
    {
      label: "This Month",
      value: "thismonth",
      icon: "🗓️",
      getRange: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: "Last 3 Months",
      value: "3months",
      icon: "📅",
      getRange: () => ({
        from: subMonths(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: "Year to Date",
      value: "ytd",
      icon: "🎯",
      getRange: () => ({
        from: startOfYear(new Date()),
        to: new Date(),
      }),
    },
  ]

  const handlePresetClick = (preset: any) => {
    const range = preset.getRange()
    setDateRange(range)
    setSelectedPreset(preset.value)
    onDateRangeChange(range)
  }

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setSelectedPreset(null)
    onDateRangeChange(range)
  }

  const handleApplyFilter = () => {
    onApplyFilter()
    setIsCalendarOpen(false)
  }

  const handleClearFilter = () => {
    setDateRange(undefined)
    setSelectedPreset(null)
    onDateRangeChange(undefined)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range"

    if (!dateRange.to) {
      return format(dateRange.from, "MMM dd, yyyy")
    }

    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, "MMM dd, yyyy")
    }

    return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
  }

  const getDaysCount = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Campaign & Call Filter</h3>
              <p className="text-sm text-gray-600">Filter campaigns and call logs by date range</p>
            </div>
          </div>
          {dateRange?.from && (
            <div className="text-right">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                {getDaysCount()} day{getDaysCount() !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Preset Buttons */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Select:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {presetRanges.map((preset) => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className={`justify-start text-left h-auto py-3 px-3 ${
                  selectedPreset === preset.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "hover:bg-blue-50 hover:border-blue-200"
                }`}
              >
                <span className="mr-2 text-base">{preset.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-xs">{preset.label}</div>
                  <div className="text-xs opacity-75">
                    {(() => {
                      const range = preset.getRange()
                      if (range.from.getTime() === range.to.getTime()) {
                        return format(range.from, "MMM dd")
                      }
                      return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd")}`
                    })()}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Range:</h4>
          <div className="flex items-center gap-3">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-80 justify-start text-left font-normal ${
                    !dateRange?.from ? "text-muted-foreground" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleCustomRangeChange}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
                <div className="p-3 border-t flex gap-2">
                  <Button onClick={() => setIsCalendarOpen(false)} variant="outline" size="sm" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleApplyFilter} size="sm" className="flex-1">
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleApplyFilter}
              disabled={!dateRange?.from || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Filtering...
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filter
                </>
              )}
            </Button>

            {dateRange?.from && (
              <Button onClick={handleClearFilter} variant="outline" size="default">
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Selected Range Display */}
        {dateRange?.from && (
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Selected Date Range</h5>
                <p className="text-sm text-gray-600">{formatDateRange()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium text-blue-600">
                  {getDaysCount()} day{getDaysCount() !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Campaign Stats */}
            {totalCampaigns > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Campaigns in range:</span>
                  <span className="font-semibold text-green-600">
                    {filteredCampaigns} of {totalCampaigns}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
