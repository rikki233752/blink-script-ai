"use client"

import { useState, useEffect, useCallback } from "react"
import type { ChartDataPoint, MetricsSummary } from "@/app/api/metrics/route"

interface UseMetricsOptions {
  metric?: string
  fromDate?: string
  toDate?: string
}

interface UseMetricsReturn {
  chartData: ChartDataPoint[]
  summary: MetricsSummary | null
  campaigns: Array<{ name: string; color: string }>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMetrics(options: UseMetricsOptions = {}): UseMetricsReturn {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [campaigns, setCampaigns] = useState<Array<{ name: string; color: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.metric) params.append("metric", options.metric)
      if (options.fromDate) params.append("from", options.fromDate)
      if (options.toDate) params.append("to", options.toDate)

      const response = await fetch(`/api/metrics?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch metrics")
      }

      setChartData(result.data.chartData)
      setSummary(result.data.summary)
      setCampaigns(result.data.campaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [options.metric, options.fromDate, options.toDate])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    chartData,
    summary,
    campaigns,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
