"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, setYear, setMonth, getYear, getMonth, subDays, startOfYear } from "date-fns"
import type { DateRange } from "react-day-picker"

interface WorkingDatePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  isLoading?: boolean
}

export function WorkingDatePicker({
  dateRange,
  onDateRangeChange,
  onApply,
  isLoading = false,
}: WorkingDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(dateRange?.from || new Date())

  const formatDateRange = () => {
    if (!dateRange?.from) return "YYYY-MM-DD ~ YYYY-MM-DD"

    const fromDate = format(dateRange.from, "yyyy-MM-dd")

    if (!dateRange.to) {
      return `${fromDate} ~ YYYY-MM-DD`
    }

    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return `${fromDate} ~ ${fromDate}`
    }

    const toDate = format(dateRange.to, "yyyy-MM-dd")
    return `${fromDate} ~ ${toDate}`
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range)

    // Auto-close and apply when both dates are selected
    if (range?.from && range?.to) {
      setTimeout(() => {
        onApply()
        setIsOpen(false)
      }, 200)
    }
  }

  const handleYearChange = (year: number) => {
    const newDate = setYear(currentMonth, year)
    setCurrentMonth(newDate)
  }

  const handleMonthChange = (month: number) => {
    const newDate = setMonth(currentMonth, month)
    setCurrentMonth(newDate)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentMonth)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentMonth(newDate)
  }

  // Generate year options (2020-2030)
  const yearOptions = Array.from({ length: 21 }, (_, i) => 2015 + i)

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const quickPresets = [
    {
      label: "Last 7 Days",
      getRange: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: "Last 30 Days",
      getRange: () => ({
        from: subDays(new Date(), 29),
        to: new Date(),
      }),
    },
    {
      label: "This Year",
      getRange: () => ({
        from: startOfYear(new Date()),
        to: new Date(),
      }),
    },
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-64 justify-between text-left font-normal bg-white border-gray-300 hover:bg-gray-50 ${
            !dateRange?.from ? "text-gray-400" : "text-gray-900"
          }`}
          disabled={isLoading}
          onClick={() => setIsOpen(true)}
        >
          <span className="text-sm">{formatDateRange()}</span>
          <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={4}>
        <div className="bg-white border rounded-lg shadow-lg">
          {/* Header with Month/Year Selection */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <select
                  value={getMonth(currentMonth)}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="px-3 py-1 border rounded text-sm bg-white"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>

                {/* Year Selector */}
                <select
                  value={getYear(currentMonth)}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="px-3 py-1 border rounded text-sm bg-white"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2">
              {quickPresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const range = preset.getRange()
                    onDateRangeChange(range)
                  }}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              numberOfMonths={1}
              showOutsideDays={true}
              className="rounded-md"
            />
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDateRangeChange(undefined)
                setIsOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onApply()
                setIsOpen(false)
              }}
              disabled={!dateRange?.from}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
