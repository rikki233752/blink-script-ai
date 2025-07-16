export interface ReportData {
  id: string
  name: string
  type: "performance" | "sentiment" | "volume" | "quality" | "agent" | "campaign"
  dateRange: {
    start: string
    end: string
  }
  data: any[]
  metrics: {
    totalCalls: number
    averageScore: number
    conversionRate: number
    satisfactionRate: number
  }
}

export interface TrendData {
  date: string
  value: number
  label: string
  category?: string
}

export interface ChartConfig {
  type: "line" | "bar" | "pie" | "area"
  title: string
  xAxis: string
  yAxis: string
  color: string
}

// Real data generators for reports (to be connected to actual data source)
export async function generatePerformanceReport(dateRange: { start: string; end: string }): Promise<ReportData> {
  // This would connect to your actual data source
  // For now, return empty structure
  return {
    id: "perf-" + Date.now(),
    name: "Performance Report",
    type: "performance",
    dateRange,
    data: [],
    metrics: {
      totalCalls: 0,
      averageScore: 0,
      conversionRate: 0,
      satisfactionRate: 0,
    },
  }
}

export async function generateSentimentReport(dateRange: { start: string; end: string }): Promise<ReportData> {
  // This would connect to your actual data source
  return {
    id: "sent-" + Date.now(),
    name: "Sentiment Analysis Report",
    type: "sentiment",
    dateRange,
    data: [],
    metrics: {
      totalCalls: 0,
      averageScore: 0,
      conversionRate: 0,
      satisfactionRate: 0,
    },
  }
}

export async function generateVolumeReport(dateRange: { start: string; end: string }): Promise<ReportData> {
  // This would connect to your actual data source
  return {
    id: "vol-" + Date.now(),
    name: "Call Volume Report",
    type: "volume",
    dateRange,
    data: [],
    metrics: {
      totalCalls: 0,
      averageScore: 0,
      conversionRate: 0,
      satisfactionRate: 0,
    },
  }
}

export async function generateAgentReport(dateRange: { start: string; end: string }): Promise<ReportData> {
  // This would connect to your actual data source
  return {
    id: "agent-" + Date.now(),
    name: "Agent Performance Report",
    type: "agent",
    dateRange,
    data: [],
    metrics: {
      totalCalls: 0,
      averageScore: 0,
      conversionRate: 0,
      satisfactionRate: 0,
    },
  }
}

export async function generateTrendData(type: string, days = 30): Promise<TrendData[]> {
  // This would connect to your actual data source
  // Return empty array for now
  return []
}

export function exportReportData(report: ReportData, format: "csv" | "pdf" | "excel"): void {
  console.log(`Exporting ${report.name} as ${format.toUpperCase()}`)

  if (format === "csv") {
    const csvContent = convertToCSV(report.data)
    downloadFile(csvContent, `${report.name}.csv`, "text/csv")
  } else if (format === "pdf") {
    console.log("PDF export would be implemented with a library like jsPDF")
  } else if (format === "excel") {
    console.log("Excel export would be implemented with a library like xlsx")
  }
}

function convertToCSV(data: any[]): string {
  if (!data.length) return "No data available"

  const headers = Object.keys(data[0])
  const csvRows = [headers.join(","), ...data.map((row) => headers.map((header) => row[header]).join(","))]

  return csvRows.join("\n")
}

function downloadFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}
