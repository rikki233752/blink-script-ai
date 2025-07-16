"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
} from "date-fns"
import type { DateRange } from "react-day-picker"

interface SimpleWorkingCalendarProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  isLoading?: boolean
}

export function SimpleWorkingCalendar({
  dateRange,
  onDateRangeChange,
  onApply,
  isLoading = false,
}: SimpleWorkingCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)

  const formatDateRange = () => {
    if (!dateRange?.from) return "YYYY-MM-DD ~ YYYY-MM-DD"

    const fromDate = format(dateRange.from, "yyyy-MM-dd")

    if (!dateRange.to) {
      return `${fromDate} ~ YYYY-MM-DD`
    }

    const toDate = format(dateRange.to, "yyyy-MM-dd")
    return `${fromDate} ~ ${toDate}`
  }

  const handleDateClick = (date: Date) => {
    if (selectingStart || !dateRange?.from) {
      // Selecting start date
      onDateRangeChange({ from: date, to: undefined })
      setSelectingStart(false)
    } else {
      // Selecting end date
      if (date < dateRange.from) {
        // If end date is before start date, swap them
        onDateRangeChange({ from: date, to: dateRange.from })
      } else {
        onDateRangeChange({ from: dateRange.from, to: date })
      }
      setSelectingStart(true)

      // Auto-apply and close immediately without setTimeout
      onApply()
      setIsOpen(false)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth(subMonths(currentMonth, 1))
    } else {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(year)
    setCurrentMonth(newDate)
  }

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(month)
    setCurrentMonth(newDate)
  }

  const quickPresets = [
    {
      label: "Last 7 Days",
      getRange: () => ({
        from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: "Last 30 Days",
      getRange: () => ({
        from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: "This Year",
      getRange: () => ({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(),
      }),
    },
  ]

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add padding days for proper calendar layout
  const startPadding = monthStart.getDay()
  const paddingDays = Array.from({ length: startPadding }, (_, i) => {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - (startPadding - i))
    return date
  })

  const allDays = [...paddingDays, ...calendarDays]

  const yearOptions = Array.from({ length: 21 }, (_, i) => 2015 + i)
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

  const getDayClassName = (date: Date) => {
    let className = "w-8 h-8 flex items-center justify-center text-sm cursor-pointer hover:bg-blue-100 rounded"

    if (!isSameMonth(date, currentMonth)) {
      className += " text-gray-300"
    }

    if (dateRange?.from && isSameDay(date, dateRange.from)) {
      className += " bg-blue-600 text-white hover:bg-blue-700"
    } else if (dateRange?.to && isSameDay(date, dateRange.to)) {
      className += " bg-blue-600 text-white hover:bg-blue-700"
    } else if (dateRange?.from && dateRange?.to && date > dateRange.from && date < dateRange.to) {
      className += " bg-blue-100"
    }

    return className
  }

  const handleApplyClick = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return
    }

    console.log("📅 Calendar Component - Manual Apply clicked:", {
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      fromFormatted: format(dateRange.from, "yyyy-MM-dd"),
      toFormatted: format(dateRange.to, "yyyy-MM-dd"),
    })

    onApply()
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        className={`w-64 justify-between text-left font-normal bg-white border-gray-300 hover:bg-gray-50 ${
          !dateRange?.from ? "text-gray-400" : "text-gray-900"
        }`}
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm">{formatDateRange()}</span>
        <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
      </Button>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 w-80">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <select
                  value={currentMonth.getMonth()}
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
                  value={currentMonth.getFullYear()}
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
                    setSelectingStart(true)
                  }}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((date, index) => (
                <div key={index} className={getDayClassName(date)} onClick={() => handleDateClick(date)}>
                  {date.getDate()}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDateRangeChange(undefined)
                setSelectingStart(true)
              }}
            >
              Clear
            </Button>
            <div className="text-xs text-gray-500">{selectingStart ? "Select start date" : "Select end date"}</div>
            <Button
              size="sm"
              onClick={handleApplyClick}
              disabled={!dateRange?.from}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop to close calendar */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
