"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface CompactDateFilterProps {
  onDateRangeChange: (range: DateRange | undefined) => void
  onApplyFilter: () => void
  isLoading?: boolean
}

export function CompactDateFilter({ onDateRangeChange, onApplyFilter, isLoading = false }: CompactDateFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isOpen, setIsOpen] = useState(false)

  const presetRanges = [
    {
      label: "Today",
      getRange: () => {
        const today = new Date()
        return { from: today, to: today }
      },
    },
    {
      label: "Yesterday",
      getRange: () => {
        const yesterday = subDays(new Date(), 1)
        return { from: yesterday, to: yesterday }
      },
    },
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
      label: "This Month",
      getRange: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: "Last Month",
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1)
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        }
      },
    },
  ]

  const handlePresetClick = (preset: any) => {
    const range = preset.getRange()
    setDateRange(range)
    onDateRangeChange(range)
    onApplyFilter()
    setIsOpen(false)
  }

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    onDateRangeChange(range)
    if (range?.from && range?.to) {
      onApplyFilter()
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setDateRange(undefined)
    onDateRangeChange(undefined)
    setIsOpen(false)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range"

    if (!dateRange.to) {
      return format(dateRange.from, "yyyy-MM-dd")
    }

    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, "yyyy-MM-dd")
    }

    return `${format(dateRange.from, "yyyy-MM-dd")} ~ ${format(dateRange.to, "yyyy-MM-dd")}`
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-64 justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="start">
          {/* Quick Select Sidebar */}
          <div className="w-40 border-r bg-gray-50 p-3">
            <div className="space-y-1">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="w-full justify-start text-left h-8 px-2 text-sm hover:bg-blue-50 hover:text-blue-600"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCustomRangeChange}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
            />
          </div>
        </PopoverContent>
      </Popover>

      {dateRange?.from && (
        <Button variant="outline" size="sm" onClick={handleClear} className="h-10 w-10 p-0">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
