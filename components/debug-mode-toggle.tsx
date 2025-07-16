"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bug, RefreshCw } from "lucide-react"

export function DebugModeToggle() {
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // Load debug mode state from localStorage on component mount
  useEffect(() => {
    const savedDebugMode = localStorage.getItem("debugMode") === "true"
    setIsDebugMode(savedDebugMode)

    // If debug mode is on, load any saved logs
    if (savedDebugMode) {
      const savedLogs = JSON.parse(localStorage.getItem("debugLogs") || "[]")
      setLogs(savedLogs)
    }
  }, [])

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newMode = !isDebugMode
    setIsDebugMode(newMode)
    localStorage.setItem("debugMode", String(newMode))

    // Clear logs when turning off debug mode
    if (!newMode) {
      setLogs([])
      localStorage.removeItem("debugLogs")
    }

    // Add event listener for console logs when turning on debug mode
    if (newMode) {
      // This is a simplified approach - in a real app you'd use a more robust method
      const originalConsoleLog = console.log
      console.log = (...args) => {
        originalConsoleLog.apply(console, args)
        const logMessage = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")

        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, `${new Date().toISOString()} - ${logMessage}`]
          localStorage.setItem("debugLogs", JSON.stringify(newLogs.slice(-100))) // Keep last 100 logs
          return newLogs
        })
      }
    }
  }

  const clearLogs = () => {
    setLogs([])
    localStorage.removeItem("debugLogs")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Switch id="debug-mode" checked={isDebugMode} onCheckedChange={toggleDebugMode} />
          <Label htmlFor="debug-mode">{isDebugMode ? "Debug Mode Active" : "Debug Mode Inactive"}</Label>

          {isDebugMode && (
            <Button variant="outline" size="sm" onClick={clearLogs} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-1" />
              Clear Logs
            </Button>
          )}
        </div>

        {isDebugMode && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Debug Logs</h4>
            <div className="bg-black text-green-400 p-3 rounded-md h-[300px] overflow-y-auto text-xs font-mono">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No logs yet. Actions will be logged here.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
