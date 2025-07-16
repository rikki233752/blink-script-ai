"use server"

import { generateCSV, generatePDFContent } from "@/lib/export-utils"

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

export async function exportAnalysisCSV(data: CallAnalysisData) {
  try {
    const csvContent = generateCSV(data)
    const timestamp = new Date().toISOString().split("T")[0]
    const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
    const fileName = `call_analysis_${cleanFileName}_${timestamp}.csv`

    return {
      success: true,
      content: csvContent,
      fileName: fileName,
      mimeType: "text/csv",
    }
  } catch (error) {
    console.error("Error generating CSV:", error)
    return {
      success: false,
      error: "Failed to generate CSV export",
    }
  }
}

export async function exportAnalysisPDF(data: CallAnalysisData) {
  try {
    const htmlContent = generatePDFContent(data)
    const timestamp = new Date().toISOString().split("T")[0]
    const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
    const fileName = `call_analysis_${cleanFileName}_${timestamp}.html`

    return {
      success: true,
      content: htmlContent,
      fileName: fileName,
      mimeType: "text/html",
    }
  } catch (error) {
    console.error("Error generating PDF:", error)
    return {
      success: false,
      error: "Failed to generate PDF export",
    }
  }
}
