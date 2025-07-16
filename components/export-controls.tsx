"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Table, Printer } from "lucide-react"
import { generateCSV, generatePDFContent, downloadFile, printPDF } from "@/lib/export-utils"

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

interface ExportControlsProps {
  data: CallAnalysisData
}

export function ExportControls({ data }: ExportControlsProps) {
  const generateFileName = (extension: string) => {
    const timestamp = new Date().toISOString().split("T")[0]
    const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
    return `call_analysis_${cleanFileName}_${timestamp}.${extension}`
  }

  const handleExportCSV = () => {
    try {
      const csvContent = generateCSV(data)
      const fileName = generateFileName("csv")
      downloadFile(csvContent, fileName, "text/csv")
    } catch (error) {
      console.error("Error generating CSV:", error)
      alert("Failed to generate CSV export. Please try again.")
    }
  }

  const handleExportPDF = () => {
    try {
      const htmlContent = generatePDFContent(data)
      const fileName = generateFileName("html")
      downloadFile(htmlContent, fileName, "text/html")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF export. Please try again.")
    }
  }

  const handlePrintPDF = () => {
    try {
      const htmlContent = generatePDFContent(data)
      printPDF(htmlContent)
    } catch (error) {
      console.error("Error printing PDF:", error)
      alert("Failed to open print dialog. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analysis Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Export as CSV
          </Button>

          <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export as HTML/PDF
          </Button>

          <Button onClick={handlePrintPDF} variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>CSV:</strong> Structured data for spreadsheet analysis
          </p>
          <p>
            <strong>HTML/PDF:</strong> Formatted report for sharing and archiving
          </p>
          <p>
            <strong>Print:</strong> Direct printing with optimized layout
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
