"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, setYear, setMonth, getYear, getMonth } from "date-fns"
import type { DateRange } from "react-day-picker"

interface EnhancedDateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  isLoading?: boolean
}

export function EnhancedDateRangePicker({
  dateRange,
  onDateRangeChange,
  onApply,
  isLoading = false,
}: EnhancedDateRangePickerProps) {
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

    // Auto-apply when both dates are selected
    if (range?.from && range?.to) {
      setTimeout(() => {
        onApply()
        setIsOpen(false)
      }, 100)
    }
  }

  const handleYearChange = (year: string) => {
    const newDate = setYear(currentMonth, Number.parseInt(year))
    setCurrentMonth(newDate)
  }

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(currentMonth, Number.parseInt(month))
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
  const yearOptions = Array.from({ length: 11 }, (_, i) => 2020 + i)

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-64 justify-between text-left font-normal bg-white border-gray-300 hover:bg-gray-50 ${
            !dateRange?.from ? "text-gray-400" : "text-gray-900"
          }`}
          disabled={isLoading}
        >
          <span className="text-sm">{formatDateRange()}</span>
          <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Select value={getMonth(currentMonth).toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={getYear(currentMonth).toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          numberOfMonths={1}
          disabled={(date) => date > new Date()}
          showOutsideDays={true}
          fixedWeeks={true}
          className="p-3"
        />

        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between gap-2">
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                  onDateRangeChange({ from: lastWeek, to: today })
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                  onDateRangeChange({ from: lastMonth, to: today })
                }}
              >
                Last 30 Days
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onApply()
                  setIsOpen(false)
                }}
                disabled={!dateRange?.from}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
