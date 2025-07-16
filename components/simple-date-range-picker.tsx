"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, setYear, setMonth, getYear, getMonth } from "date-fns"
import type { DateRange } from "react-day-picker"

interface SimpleDateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  isLoading?: boolean
}

export function SimpleDateRangePicker({
  dateRange,
  onDateRangeChange,
  onApply,
  isLoading = false,
}: SimpleDateRangePickerProps) {
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
  const yearOptions = Array.from({ length: 21 }, (_, i) => 2015 + i) // 2015-2035

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
        {/* Header with Month/Year Selection */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {/* Month Selector */}
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

              {/* Year Selector */}
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

          {/* Quick Presets */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                onDateRangeChange({ from: lastWeek, to: today })
              }}
              className="text-xs"
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
              className="text-xs"
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const startOfYear = new Date(today.getFullYear(), 0, 1)
                onDateRangeChange({ from: startOfYear, to: today })
              }}
              className="text-xs"
            >
              This Year
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          numberOfMonths={1}
          showOutsideDays={true}
          fixedWeeks={true}
          className="p-3"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />

        {/* Footer */}
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
      </PopoverContent>
    </Popover>
  )
}
