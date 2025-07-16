"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Table, Printer, Loader2, BarChart3 } from "lucide-react"
import { exportAnalysisCSV, exportAnalysisPDF } from "@/app/actions/export-analysis"
import { ChartPreview } from "@/components/chart-preview"

interface CallAnalysisData {
  transcript: string
  analysis: {
    overallRating: "GOOD" | "BAD" | "UGLY"
    toneQuality: {
      agent: string
      customer: string
      score: number
    }
    businessConversion: {
      conversionAchieved: boolean
      conversionType: string
      conversionConfidence: number
    }
    agentPerformance: {
      communicationSkills: number
      problemSolving: number
      productKnowledge: number
      customerService: number
    }
    keyInsights: string[]
    improvementSuggestions: string[]
    callDuration: string
    summary: string
  }
  fileName: string
  fileSize: number
  duration: number
  provider?: string
}

interface EnhancedExportControlsProps {
  data: CallAnalysisData
}

export function EnhancedExportControls({ data }: EnhancedExportControlsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = async () => {
    setIsExporting("csv")
    try {
      const result = await exportAnalysisCSV(data)
      if (result.success) {
        downloadFile(result.content, result.fileName, result.mimeType)
      } else {
        alert(result.error || "Failed to generate CSV export")
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Failed to generate CSV export. Please try again.")
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting("pdf")
    try {
      const result = await exportAnalysisPDF(data)
      if (result.success) {
        downloadFile(result.content, result.fileName, result.mimeType)
      } else {
        alert(result.error || "Failed to generate PDF export")
      }
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Failed to generate PDF export. Please try again.")
    } finally {
      setIsExporting(null)
    }
  }

  const handlePrintReport = async () => {
    setIsExporting("print")
    try {
      const result = await exportAnalysisPDF(data)
      if (result.success) {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(result.content)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 250)
        }
      } else {
        alert(result.error || "Failed to generate print version")
      }
    } catch (error) {
      console.error("Error printing report:", error)
      alert("Failed to open print dialog. Please try again.")
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analysis Report
          <div className="ml-auto">
            <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full">
              ✨ Now with Charts & Graphs
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Options</TabsTrigger>
            <TabsTrigger value="preview">Chart Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isExporting !== null}
              >
                {isExporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table className="h-4 w-4" />}
                Export as CSV
              </Button>

              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isExporting !== null}
              >
                {isExporting === "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Export with Charts
              </Button>

              <Button
                onClick={handlePrintReport}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isExporting !== null}
              >
                {isExporting === "print" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Print Report
              </Button>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Table className="h-4 w-4 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">CSV Export</p>
                  <p>Raw data in spreadsheet format for analysis and tracking</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">HTML/PDF with Charts</p>
                  <p>Professional report with interactive charts, graphs, and visual analytics</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Printer className="h-4 w-4 mt-0.5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Print Report</p>
                  <p>Print-optimized layout with charts for physical documentation</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h5 className="font-semibold text-blue-800">Enhanced Visual Reports</h5>
              </div>
              <p className="text-sm text-blue-700">Your exported reports now include professional charts and graphs:</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Performance bar charts and radar visualizations</li>
                <li>• Conversion success pie charts</li>
                <li>• Progress indicators with color coding</li>
                <li>• Tone analysis visual representations</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <ChartPreview data={data} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
