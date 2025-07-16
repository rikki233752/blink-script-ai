export interface FormattedMetrics {
  totalCalls: string
  averageCallDuration: string
  cpa: string
  revenue: string
  skippedCalls: string
  completedCalls: string
  qcApproved: string
  qcRejected: string
  conversionRate: string
  totalDuration: string
}

export function formatMetrics(metrics: any): FormattedMetrics {
  return {
    totalCalls: metrics.totalCalls?.toLocaleString() || "0",
    averageCallDuration: formatDuration(metrics.averageCallDuration || 0),
    cpa: `$${(metrics.cpa || 0).toFixed(2)}`,
    revenue: `$${(metrics.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    skippedCalls: metrics.skippedCalls?.toLocaleString() || "0",
    completedCalls: metrics.completedCalls?.toLocaleString() || "0",
    qcApproved: metrics.qcApproved?.toLocaleString() || "0",
    qcRejected: metrics.qcRejected?.toLocaleString() || "0",
    conversionRate: `${(metrics.conversionRate || 0).toFixed(1)}%`,
    totalDuration: formatTotalDuration(metrics.totalDuration || 0),
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours === 0) {
    return `${minutes}min`
  }
  return `${hours}h ${minutes}m`
}

export function calculateMetricsComparison(current: any, previous: any) {
  const comparison = {
    totalCalls: calculatePercentageChange(current.totalCalls, previous.totalCalls),
    revenue: calculatePercentageChange(current.revenue, previous.revenue),
    cpa: calculatePercentageChange(current.cpa, previous.cpa, true), // Lower CPA is better
    conversionRate: calculatePercentageChange(current.conversionRate, previous.conversionRate),
    qcApproved: calculatePercentageChange(current.qcApproved, previous.qcApproved),
  }

  return comparison
}

function calculatePercentageChange(
  current: number,
  previous: number,
  lowerIsBetter = false,
): {
  value: number
  percentage: string
  trend: "up" | "down" | "neutral"
  isPositive: boolean
} {
  if (previous === 0) {
    return {
      value: current,
      percentage: current > 0 ? "+100%" : "0%",
      trend: current > 0 ? "up" : "neutral",
      isPositive: current > 0,
    }
  }

  const change = ((current - previous) / previous) * 100
  const isPositive = lowerIsBetter ? change < 0 : change > 0

  return {
    value: current,
    percentage: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
    trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    isPositive,
  }
}
