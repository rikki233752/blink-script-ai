import { generateBarChart, generatePieChart, generateRadarChart, generateProgressChart } from "./chart-utils"

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

export function generateCSV(data: CallAnalysisData): string {
  const timestamp = new Date().toISOString()

  // Create CSV headers and data
  const csvData = [
    ["Call Analysis Report"],
    ["Generated:", timestamp],
    ["File Name:", data.fileName],
    ["File Size (MB):", (data.fileSize / 1024 / 1024).toFixed(2)],
    ["Duration (seconds):", data.duration.toString()],
    ["Provider:", data.provider || "Unknown"],
    [""],
    ["OVERALL METRICS"],
    ["Overall Rating:", data.analysis.overallRating],
    ["Call Duration:", data.analysis.callDuration],
    [""],
    ["TONE ANALYSIS"],
    ["Agent Tone:", data.analysis.toneQuality.agent],
    ["Customer Tone:", data.analysis.toneQuality.customer],
    ["Tone Score (1-10):", data.analysis.toneQuality.score.toString()],
    [""],
    ["BUSINESS CONVERSION"],
    ["Conversion Achieved:", data.analysis.businessConversion.conversionAchieved ? "Yes" : "No"],
    ["Conversion Type:", data.analysis.businessConversion.conversionType],
    ["Conversion Confidence (%):", data.analysis.businessConversion.conversionConfidence.toString()],
    [""],
    ["AGENT PERFORMANCE"],
    ["Communication Skills (1-10):", data.analysis.agentPerformance.communicationSkills.toString()],
    ["Problem Solving (1-10):", data.analysis.agentPerformance.problemSolving.toString()],
    ["Product Knowledge (1-10):", data.analysis.agentPerformance.productKnowledge.toString()],
    ["Customer Service (1-10):", data.analysis.agentPerformance.customerService.toString()],
    [""],
    ["SUMMARY"],
    ["Call Summary:", data.analysis.summary],
    [""],
    ["KEY INSIGHTS"],
    ...data.analysis.keyInsights.map((insight, index) => [`Insight ${index + 1}:`, insight]),
    [""],
    ["IMPROVEMENT SUGGESTIONS"],
    ...data.analysis.improvementSuggestions.map((suggestion, index) => [`Suggestion ${index + 1}:`, suggestion]),
    [""],
    ["FULL TRANSCRIPT"],
    ["Transcript:", data.transcript.replace(/\n/g, " ").replace(/,/g, ";")],
  ]

  return csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

export function generatePDFContent(data: CallAnalysisData): string {
  const timestamp = new Date().toLocaleString()

  // Generate charts
  const performanceData = [
    {
      label: "Communication",
      value: data.analysis.agentPerformance.communicationSkills,
      color: "#3b82f6",
    },
    {
      label: "Problem Solving",
      value: data.analysis.agentPerformance.problemSolving,
      color: "#10b981",
    },
    {
      label: "Product Knowledge",
      value: data.analysis.agentPerformance.productKnowledge,
      color: "#f59e0b",
    },
    {
      label: "Customer Service",
      value: data.analysis.agentPerformance.customerService,
      color: "#ef4444",
    },
  ]

  const ratingData = [
    {
      label: data.analysis.overallRating,
      value: data.analysis.overallRating === "GOOD" ? 3 : data.analysis.overallRating === "BAD" ? 2 : 1,
      color:
        data.analysis.overallRating === "GOOD"
          ? "#10b981"
          : data.analysis.overallRating === "BAD"
            ? "#f59e0b"
            : "#ef4444",
    },
  ]

  const conversionData = [
    {
      label: "Achieved",
      value: data.analysis.businessConversion.conversionAchieved
        ? data.analysis.businessConversion.conversionConfidence
        : 0,
      color: "#10b981",
    },
    {
      label: "Not Achieved",
      value: data.analysis.businessConversion.conversionAchieved
        ? 0
        : 100 - data.analysis.businessConversion.conversionConfidence,
      color: "#ef4444",
    },
  ]

  const performanceBarChart = generateBarChart(performanceData, "Agent Performance Metrics", 10)
  const performanceRadarChart = generateRadarChart(performanceData, "Performance Overview", 10)
  const conversionPieChart = generatePieChart(
    conversionData.filter((d) => d.value > 0),
    "Conversion Analysis",
  )
  const performanceProgressChart = generateProgressChart(performanceData, "Detailed Performance Scores")

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Call Analysis Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
        }
        .meta-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .metric-item {
            background-color: #f9fafb;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
        }
        .metric-label {
            font-weight: bold;
            color: #374151;
        }
        .metric-value {
            font-size: 1.1em;
            color: #1f2937;
        }
        .rating-good { border-left-color: #10b981; }
        .rating-bad { border-left-color: #f59e0b; }
        .rating-ugly { border-left-color: #ef4444; }
        .performance-bar {
            background-color: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            margin-top: 5px;
            overflow: hidden;
        }
        .performance-fill {
            height: 100%;
            background-color: #3b82f6;
            transition: width 0.3s ease;
        }
        .insights-list {
            list-style: none;
            padding: 0;
        }
        .insights-list li {
            background-color: #eff6ff;
            margin-bottom: 8px;
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #3b82f6;
        }
        .suggestions-list {
            list-style: none;
            padding: 0;
        }
        .suggestions-list li {
            background-color: #f0fdf4;
            margin-bottom: 8px;
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #10b981;
        }
        .transcript {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            line-height: 1.5;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
        }
        
        /* Chart Styles */
        .chart-container {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .chart-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .chart-full-width {
            grid-column: 1 / -1;
        }
        .progress-chart {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .progress-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .progress-label {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
        }
        .progress-value {
            font-weight: bold;
            color: #1f2937;
        }
        .progress-bar-container {
            height: 12px;
            background-color: #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
        }
        .progress-bar-fill {
            height: 100%;
            border-radius: 6px;
            transition: width 0.3s ease;
        }
        .chart-legend {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            .transcript { max-height: none; }
            .charts-grid { 
                grid-template-columns: 1fr; 
                page-break-inside: avoid;
            }
            .chart-container {
                page-break-inside: avoid;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Call Center Analysis Report</h1>
        <p>Generated on ${timestamp}</p>
    </div>

    <div class="meta-info">
        <div class="metric-grid">
            <div><strong>File Name:</strong> ${data.fileName}</div>
            <div><strong>File Size:</strong> ${(data.fileSize / 1024 / 1024).toFixed(2)} MB</div>
            <div><strong>Duration:</strong> ${data.duration} seconds</div>
            <div><strong>Provider:</strong> ${data.provider || "Unknown"}</div>
        </div>
    </div>

    <div class="section">
        <h2>Overall Assessment</h2>
        <div class="metric-item rating-${data.analysis.overallRating.toLowerCase()}">
            <div class="metric-label">Overall Rating</div>
            <div class="metric-value">${data.analysis.overallRating}</div>
        </div>
        <div style="margin-top: 15px;">
            <strong>Summary:</strong> ${data.analysis.summary}
        </div>
    </div>

    <div class="section">
        <h2>Performance Analytics</h2>
        <div class="charts-grid">
            ${performanceBarChart}
            ${performanceRadarChart}
        </div>
        <div class="chart-full-width">
            ${performanceProgressChart}
        </div>
    </div>

    <div class="section">
        <h2>Tone Analysis</h2>
        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-label">Agent Tone</div>
                <div class="metric-value">${data.analysis.toneQuality.agent}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Customer Tone</div>
                <div class="metric-value">${data.analysis.toneQuality.customer}</div>
            </div>
        </div>
        <div class="metric-item">
            <div class="metric-label">Overall Tone Score</div>
            <div class="metric-value">${data.analysis.toneQuality.score}/10</div>
            <div class="performance-bar">
                <div class="performance-fill" style="width: ${data.analysis.toneQuality.score * 10}%; background-color: #8b5cf6;"></div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Business Conversion</h2>
        <div class="charts-grid">
            <div>
                <div class="metric-grid">
                    <div class="metric-item">
                        <div class="metric-label">Conversion Achieved</div>
                        <div class="metric-value">${data.analysis.businessConversion.conversionAchieved ? "Yes" : "No"}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Conversion Type</div>
                        <div class="metric-value">${data.analysis.businessConversion.conversionType}</div>
                    </div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Conversion Confidence</div>
                    <div class="metric-value">${data.analysis.businessConversion.conversionConfidence}%</div>
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: ${data.analysis.businessConversion.conversionConfidence}%; background-color: #10b981;"></div>
                    </div>
                </div>
            </div>
            ${data.analysis.businessConversion.conversionAchieved ? conversionPieChart : ""}
        </div>
    </div>

    <div class="section">
        <h2>Key Insights</h2>
        <ul class="insights-list">
            ${data.analysis.keyInsights.map((insight) => `<li>${insight}</li>`).join("")}
        </ul>
    </div>

    <div class="section">
        <h2>Improvement Suggestions</h2>
        <ul class="suggestions-list">
            ${data.analysis.improvementSuggestions.map((suggestion) => `<li>${suggestion}</li>`).join("")}
        </ul>
    </div>

    <div class="section">
        <h2>Full Transcript</h2>
        <div class="transcript">${data.transcript}</div>
    </div>

    <div class="footer">
        <p>This report was generated by the Call Center Analytics System</p>
        <p>Charts and visualizations provide insights into call performance metrics</p>
        <p>For questions or support, please contact your system administrator</p>
    </div>
</body>
</html>
`
}

export function downloadFile(content: string, filename: string, mimeType: string) {
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

export function printPDF(htmlContent: string) {
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}
