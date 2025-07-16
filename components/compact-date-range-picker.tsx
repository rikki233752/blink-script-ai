"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, subDays, startOfYear } from "date-fns"
import type { DateRange } from "react-day-picker"

interface CompactDateRangePickerProps {
  dateRange?: DateRange
  onDateRangeChange: (range: DateRange | undefined) => void
  onApply: () => void
  isLoading?: boolean
}

export function CompactDateRangePicker({
  dateRange,
  onDateRangeChange,
  onApply,
  isLoading = false,
}: CompactDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return "Select date range"
    if (!range.to) return format(range.from, "yyyy-MM-dd")
    return `${format(range.from, "yyyy-MM-dd")} ~ ${format(range.to, "yyyy-MM-dd")}`
  }

  const handleQuickSelect = (days: number | "year") => {
    const today = new Date()
    let from: Date
    const to: Date = today

    if (days === "year") {
      from = startOfYear(today)
    } else {
      from = subDays(today, days - 1)
    }

    const newRange = { from, to }
    setTempDateRange(newRange)
  }

  const handleApply = () => {
    onDateRangeChange(tempDateRange)
    setIsOpen(false)
    onApply()
  }

  const handleClear = () => {
    setTempDateRange(undefined)
    onDateRangeChange(undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-between text-left font-normal" disabled={isLoading}>
          <span className="truncate">{formatDateRange(dateRange)}</span>
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Header with date range display */}
          <div className="flex items-center justify-center">
            <Input value={formatDateRange(tempDateRange)} readOnly className="text-center border-gray-300" />
          </div>

          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              <Select
                value={format(currentMonth, "MMMM")}
                onValueChange={(month) => {
                  const monthIndex = new Date(`${month} 1, 2000`).getMonth()
                  setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex))
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthName = format(new Date(2000, i), "MMMM")
                    return (
                      <SelectItem key={monthName} value={monthName}>
                        {monthName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <Select
                value={currentMonth.getFullYear().toString()}
                onValueChange={(year) => {
                  setCurrentMonth(new Date(Number.parseInt(year), currentMonth.getMonth()))
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(7)} className="flex-1">
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(30)} className="flex-1">
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect("year")} className="flex-1">
              This Year
            </Button>
          </div>

          {/* Calendar */}
          <Calendar
            mode="range"
            selected={tempDateRange}
            onSelect={setTempDateRange}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            numberOfMonths={1}
            className="rounded-md border"
          />

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <span className="text-sm text-gray-500">
              {tempDateRange?.from && !tempDateRange?.to ? "Select end date" : "Select date range"}
            </span>
            <Button onClick={handleApply} disabled={!tempDateRange?.from}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
