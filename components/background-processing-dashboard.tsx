"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react"

interface ProcessingJob {
  id: string
  job_type: string
  status: string
  priority: number
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
  attempts: number
  max_attempts: number
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  retrying: number
}

interface WorkerStatus {
  isRunning: boolean
  intervalMs?: number
}

export default function BackgroundProcessingDashboard() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({ isRunning: false })
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  useEffect(() => {
    fetchData()
    fetchWorkerStatus()

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchData()
      fetchWorkerStatus()
    }, 10000)

    return () => clearInterval(interval)
  }, [selectedStatus])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("supabase_token")
      if (!token) return

      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus)
      }
      params.append("limit", "100")

      const response = await fetch(`/api/background-processing/queue?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
        setQueueStats(data.queueStats)
      }
    } catch (error) {
      console.error("Error fetching queue data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkerStatus = async () => {
    try {
      const response = await fetch("/api/background-processing/worker")
      if (response.ok) {
        const data = await response.json()
        setWorkerStatus(data.status)
      }
    } catch (error) {
      console.error("Error fetching worker status:", error)
    }
  }

  const controlWorker = async (action: "start" | "stop") => {
    try {
      const token = localStorage.getItem("supabase_token")
      if (!token) return

      const response = await fetch("/api/background-processing/worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await fetchWorkerStatus()
      }
    } catch (error) {
      console.error("Error controlling worker:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "retrying":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
      retrying: "secondary",
    }

    return (
      <Badge variant={variants[status] || "secondary"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    )
  }

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return "Not started"

    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)

    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Background Processing</h1>
          <p className="text-muted-foreground">Monitor and manage call processing pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Worker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${workerStatus.isRunning ? "bg-green-500" : "bg-red-500"}`} />
                <span className="font-medium">{workerStatus.isRunning ? "Running" : "Stopped"}</span>
              </div>
              {workerStatus.intervalMs && (
                <span className="text-sm text-muted-foreground">Interval: {workerStatus.intervalMs / 1000}s</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={workerStatus.isRunning ? "destructive" : "default"}
                onClick={() => controlWorker(workerStatus.isRunning ? "stop" : "start")}
              >
                {workerStatus.isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Worker
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Worker
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      {queueStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{queueStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{queueStats.processing}</p>
                  <p className="text-sm text-muted-foreground">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{queueStats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{queueStats.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{queueStats.retrying}</p>
                  <p className="text-sm text-muted-foreground">Retrying</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Jobs</CardTitle>
          <CardDescription>Recent processing jobs and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="mt-4">
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No jobs found</div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>{getStatusBadge(job.status)}</div>
                        <div>
                          <p className="font-medium">{job.job_type.replace("_", " ").toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(job.created_at).toLocaleString()}
                          </p>
                          {job.error_message && <p className="text-sm text-red-600 mt-1">Error: {job.error_message}</p>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Priority: {job.priority}</Badge>
                          <Badge variant="outline">
                            {job.attempts}/{job.max_attempts} attempts
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Duration: {formatDuration(job.started_at, job.completed_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
