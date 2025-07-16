"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, ChevronDown } from "lucide-react"
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import type { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  isLoading?: boolean
}

export function DateRangePicker({ dateRange, onDateRangeChange, onApply, isLoading = false }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const presetRanges = [
    {
      label: "Today",
      value: "today",
      icon: "📅",
      getRange: () => ({
        from: new Date(),
        to: new Date(),
      }),
    },
    {
      label: "Yesterday",
      value: "yesterday",
      icon: "📆",
      getRange: () => {
        const yesterday = subDays(new Date(), 1)
        return {
          from: yesterday,
          to: yesterday,
        }
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
      label: "Previous Week",
      value: "prevweek",
      icon: "📋",
      getRange: () => {
        const lastWeek = subWeeks(new Date(), 1)
        return {
          from: startOfWeek(lastWeek, { weekStartsOn: 1 }), // Monday
          to: endOfWeek(lastWeek, { weekStartsOn: 1 }), // Sunday
        }
      },
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
      label: "Previous Month",
      value: "prevmonth",
      icon: "🗓️",
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1)
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        }
      },
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
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(),
      }),
    },
  ]

  const handlePresetClick = (preset: any) => {
    const range = preset.getRange()
    onDateRangeChange(range)
    setSelectedPreset(preset.value)
  }

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    onDateRangeChange(range)
    setSelectedPreset(null) // Clear preset selection when custom range is selected
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
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Date Range Selection</h3>
                <p className="text-sm text-gray-600">Choose a date range to filter call logs</p>
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
          </div>

          {/* Preset Buttons */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Select:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className={`justify-start text-left h-auto py-2 px-3 ${
                    selectedPreset === preset.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "hover:bg-blue-50 hover:border-blue-200"
                  }`}
                >
                  <span className="mr-2">{preset.icon}</span>
                  <div>
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
            <div className="flex items-center gap-4">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-80 justify-start text-left font-normal ${
                      !dateRange?.from ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                    <ChevronDown className="ml-auto h-4 w-4" />
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
                  <div className="p-3 border-t">
                    <Button onClick={() => setIsOpen(false)} className="w-full" size="sm">
                      Apply Selection
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={onApply}
                disabled={!dateRange?.from || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Fetch Call Logs
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Selected Range Display */}
          {dateRange?.from && (
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">Selected Range</h5>
                  <p className="text-sm text-gray-600">{formatDateRange()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium text-blue-600">
                    {getDaysCount()} day{getDaysCount() !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
