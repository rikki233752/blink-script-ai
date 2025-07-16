"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { RingBABackendService } from "@/lib/ringba-backend-service"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface RingBASyncButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function RingBASyncButton({ variant = "default", size = "default", className = "" }: RingBASyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncCount, setSyncCount] = useState<number | undefined>(undefined)
  const [syncError, setSyncError] = useState<string | undefined>(undefined)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [syncDays, setSyncDays] = useState(7)
  const [showOptions, setShowOptions] = useState(false)

  const ringbaService = RingBABackendService.getInstance()

  useEffect(() => {
    // Add listener for sync status updates
    const unsubscribe = ringbaService.addSyncListener((status) => {
      setSyncing(status.syncing)
      setSyncCount(status.count)
      setSyncError(status.error)

      if (!status.syncing && !status.error && status.count && status.count > 0) {
        setSyncSuccess(true)
        setTimeout(() => setSyncSuccess(false), 3000)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleSync = async () => {
    try {
      setSyncing(true)
      setSyncError(undefined)
      setSyncSuccess(false)

      const result = await ringbaService.manualSync(syncDays)

      if (!result.success) {
        setSyncError(result.error)
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Sync failed")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button variant={variant} size={size} onClick={() => setShowOptions(!showOptions)} className={className}>
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : syncSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Synced!
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync RingBA Calls
            </>
          )}
        </Button>

        {!syncing && !syncSuccess && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowOptions(!showOptions)}
            className="h-9 w-9 rounded-md p-0"
          >
            <span className="sr-only">Show options</span>
            {showOptions ? "−" : "+"}
          </Button>
        )}
      </div>

      {showOptions && (
        <div className="flex items-end gap-4 mt-2 p-3 border rounded-md bg-gray-50">
          <div className="space-y-2 flex-1">
            <Label htmlFor="sync-days">Fetch calls from last:</Label>
            <Select value={syncDays.toString()} onValueChange={(value) => setSyncDays(Number.parseInt(value))}>
              <SelectTrigger id="sync-days" className="w-full">
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSync} disabled={syncing}>
            Start Sync
          </Button>
        </div>
      )}

      {syncing && (
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span>Syncing calls...</span>
            {syncCount !== undefined && <span>{syncCount} processed</span>}
          </div>
          <Progress value={syncCount} max={100} className="h-2" />
        </div>
      )}

      {syncError && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>{syncError}</span>
        </div>
      )}
    </div>
  )
}
