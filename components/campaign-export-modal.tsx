"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, X, ChevronRight, Download, FileText, Table, BarChart3, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Campaign {
  id: string
  campaign_name: string
  average_score: number
  total_calls: number
  qc_approved: number
  qc_rejected: number
  completed_calls: number
  skipped_calls: number
  audio_duration: number
  created_at: string
  status: "active" | "paused" | "completed"
}

interface ExportField {
  id: string
  label: string
  category: string
  selected: boolean
}

interface CampaignExportModalProps {
  isOpen: boolean
  onClose: () => void
  campaigns: Campaign[]
}

const EXPORT_FIELDS: ExportField[] = [
  // Campaign Metrics
  { id: "campaign_id", label: "Campaign ID", category: "Campaign Metrics", selected: true },
  { id: "campaign_name", label: "Campaign Name", category: "Campaign Metrics", selected: true },
  { id: "status", label: "Status", category: "Campaign Metrics", selected: true },
  { id: "created_date", label: "Created Date", category: "Campaign Metrics", selected: true },
  { id: "average_score", label: "Average Score", category: "Campaign Metrics", selected: true },
  { id: "total_calls", label: "Total Calls", category: "Campaign Metrics", selected: true },
  { id: "audio_duration", label: "Audio Duration (Hours)", category: "Campaign Metrics", selected: true },

  // Quality Control
  { id: "qc_approved", label: "QC Approved", category: "Quality Control", selected: true },
  { id: "qc_rejected", label: "QC Rejected", category: "Quality Control", selected: true },
  { id: "qc_approval_rate", label: "QC Approval Rate", category: "Quality Control", selected: false },
  { id: "quality_score", label: "Quality Score", category: "Quality Control", selected: false },

  // Call Analytics
  { id: "completed_calls", label: "Completed Calls", category: "Call Analytics", selected: true },
  { id: "skipped_calls", label: "Skipped Calls", category: "Call Analytics", selected: true },
  { id: "completion_rate", label: "Completion Rate", category: "Call Analytics", selected: false },
  { id: "avg_call_duration", label: "Average Call Duration", category: "Call Analytics", selected: false },
  { id: "total_talk_time", label: "Total Talk Time", category: "Call Analytics", selected: false },

  // Performance Metrics
  { id: "conversion_rate", label: "Conversion Rate", category: "Performance Metrics", selected: false },
  { id: "revenue", label: "Revenue", category: "Performance Metrics", selected: false },
  { id: "cost_per_call", label: "Cost Per Call", category: "Performance Metrics", selected: false },
  { id: "roi", label: "Return on Investment", category: "Performance Metrics", selected: false },

  // Agent Performance
  { id: "agent_count", label: "Agent Count", category: "Agent Performance", selected: false },
  { id: "top_performing_agent", label: "Top Performing Agent", category: "Agent Performance", selected: false },
  { id: "avg_agent_score", label: "Average Agent Score", category: "Agent Performance", selected: false },

  // Sentiment Analysis
  { id: "positive_sentiment", label: "Positive Sentiment %", category: "Sentiment Analysis", selected: false },
  { id: "negative_sentiment", label: "Negative Sentiment %", category: "Sentiment Analysis", selected: false },
  { id: "neutral_sentiment", label: "Neutral Sentiment %", category: "Sentiment Analysis", selected: false },
  { id: "overall_sentiment", label: "Overall Sentiment", category: "Sentiment Analysis", selected: false },

  // Business Intelligence
  { id: "peak_call_hours", label: "Peak Call Hours", category: "Business Intelligence", selected: false },
  { id: "call_volume_trend", label: "Call Volume Trend", category: "Business Intelligence", selected: false },
  { id: "success_factors", label: "Success Factors", category: "Business Intelligence", selected: false },
  { id: "improvement_areas", label: "Improvement Areas", category: "Business Intelligence", selected: false },
]

export function CampaignExportModal({ isOpen, onClose, campaigns }: CampaignExportModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [exportFields, setExportFields] = useState<ExportField[]>(EXPORT_FIELDS)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("csv")

  const handleCampaignToggle = (campaignId: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId) ? prev.filter((id) => id !== campaignId) : [...prev, campaignId],
    )
  }

  const handleFieldToggle = (fieldId: string) => {
    setExportFields((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, selected: !field.selected } : field)),
    )
  }

  const handleCategoryToggle = (category: string) => {
    const categoryFields = exportFields.filter((field) => field.category === category)
    const allSelected = categoryFields.every((field) => field.selected)

    setExportFields((prev) =>
      prev.map((field) => (field.category === category ? { ...field, selected: !allSelected } : field)),
    )
  }

  const handleExport = async () => {
    if (selectedCampaigns.length === 0) {
      toast({
        title: "No campaigns selected",
        description: "Please select at least one campaign to export.",
        variant: "destructive",
      })
      return
    }

    const selectedFields = exportFields.filter((field) => field.selected)
    if (selectedFields.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field to export.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch("/api/campaigns/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignIds: selectedCampaigns,
          fields: selectedFields.map((f) => f.id),
          format: exportFormat,
          includeAnalytics: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Handle different export formats
      if (exportFormat === "csv") {
        const csvContent = await response.text()
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `campaigns_export_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `campaigns_export_${new Date().toISOString().split("T")[0]}.${exportFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Export successful",
        description: `${selectedCampaigns.length} campaigns exported successfully.`,
      })

      onClose()
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your campaigns. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setSelectedCampaigns([])
    setExportFields(EXPORT_FIELDS)
    setExportFormat("csv")
    setIsExporting(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const getStepStatus = (step: number) => {
    if (step < currentStep) return "completed"
    if (step === currentStep) return "active"
    return "inactive"
  }

  const categories = [...new Set(exportFields.map((field) => field.category))]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-gray-600" />
            <DialogTitle className="text-xl font-semibold text-gray-900">EXPORT CAMPAIGNS</DialogTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${getStepStatus(1) === "active" ? "text-blue-600" : getStepStatus(1) === "completed" ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepStatus(1) === "active"
                    ? "bg-blue-600 text-white"
                    : getStepStatus(1) === "completed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-300 text-gray-600"
                }`}
              >
                {getStepStatus(1) === "completed" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </div>
              <span className="font-medium">Select Campaigns</span>
            </div>

            <ChevronRight className="h-4 w-4 text-gray-400" />

            <div
              className={`flex items-center gap-2 ${getStepStatus(2) === "active" ? "text-blue-600" : getStepStatus(2) === "completed" ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepStatus(2) === "active"
                    ? "bg-blue-600 text-white"
                    : getStepStatus(2) === "completed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-300 text-gray-600"
                }`}
              >
                {getStepStatus(2) === "completed" ? <CheckCircle2 className="h-4 w-4" /> : "2"}
              </div>
              <span className="font-medium">Select Fields</span>
            </div>

            <ChevronRight className="h-4 w-4 text-gray-400" />

            <div
              className={`flex items-center gap-2 ${getStepStatus(3) === "active" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepStatus(3) === "active" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                3
              </div>
              <span className="font-medium">Export</span>
            </div>
          </div>
        </div>

        {/* Step Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 1 && (
            <div className="p-6 h-full flex flex-col">
              <div className="mb-6 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Campaigns to Export</h3>
                <p className="text-gray-600">
                  You can select multiple campaigns. Each will be exported individually in the final step.
                </p>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                  {campaigns.map((campaign) => (
                    <Card
                      key={campaign.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedCampaigns.includes(campaign.id)
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => handleCampaignToggle(campaign.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedCampaigns.includes(campaign.id)}
                            onChange={() => handleCampaignToggle(campaign.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate mb-1">{campaign.campaign_name}</h4>
                            <p className="text-sm text-gray-600 mb-3">Campaign ID: {campaign.id}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                {campaign.total_calls} calls
                              </span>
                              <span>{campaign.average_score}% avg score</span>
                              <Badge
                                variant={campaign.status === "active" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-6 h-full flex flex-col">
              <div className="mb-6 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Fields to Export</h3>
                <p className="text-gray-600">Choose which data fields you want to include in your export.</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-6">
                  {categories.map((category) => {
                    const categoryFields = exportFields.filter((field) => field.category === category)
                    const allSelected = categoryFields.every((field) => field.selected)
                    const someSelected = categoryFields.some((field) => field.selected)

                    return (
                      <div key={category} className="border border-gray-200 rounded-lg">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{category}</h4>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={allSelected}
                                indeterminate={someSelected && !allSelected}
                                onChange={() => handleCategoryToggle(category)}
                              />
                              <span className="text-sm text-gray-600">Select All</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {categoryFields.map((field) => (
                              <div key={field.id} className="flex items-center gap-2">
                                <Checkbox checked={field.selected} onChange={() => handleFieldToggle(field.id)} />
                                <label className="text-sm text-gray-700 cursor-pointer">{field.label}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentStep === 3 && (
            <div className="p-6 h-full flex flex-col">
              <div className="mb-6 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Configuration</h3>
                <p className="text-gray-600">Choose your export format and review your selections.</p>
              </div>

              <div className="flex-1 space-y-6">
                {/* Export Format Selection */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Export Format</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Card
                      className={`cursor-pointer transition-all ${exportFormat === "csv" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                      onClick={() => setExportFormat("csv")}
                    >
                      <CardContent className="p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="font-medium">CSV</div>
                        <div className="text-xs text-gray-500">Comma-separated values</div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all ${exportFormat === "xlsx" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                      onClick={() => setExportFormat("xlsx")}
                    >
                      <CardContent className="p-4 text-center">
                        <Table className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="font-medium">Excel</div>
                        <div className="text-xs text-gray-500">Excel spreadsheet</div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all ${exportFormat === "pdf" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                      onClick={() => setExportFormat("pdf")}
                    >
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <div className="font-medium">PDF</div>
                        <div className="text-xs text-gray-500">Report with charts</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Export Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Export Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Selected Campaigns:</span>
                      <span className="ml-2 font-medium">{selectedCampaigns.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Selected Fields:</span>
                      <span className="ml-2 font-medium">{exportFields.filter((f) => f.selected).length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Export Format:</span>
                      <span className="ml-2 font-medium uppercase">{exportFormat}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Estimated Size:</span>
                      <span className="ml-2 font-medium">~{Math.ceil(selectedCampaigns.length * 0.5)}MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Always Visible */}
        <div className="flex items-center justify-between p-6 border-t bg-white shrink-0">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={isExporting}
                className="px-4 py-2"
              >
                ← Back
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isExporting}
              className="px-4 py-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              Cancel Export
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {selectedCampaigns.length > 0 && currentStep === 1 && (
              <span className="text-sm text-gray-600">
                {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? "s" : ""} selected
              </span>
            )}
            {exportFields.filter((f) => f.selected).length > 0 && currentStep === 2 && (
              <span className="text-sm text-gray-600">
                {exportFields.filter((f) => f.selected).length} field
                {exportFields.filter((f) => f.selected).length !== 1 ? "s" : ""} selected
              </span>
            )}

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={currentStep === 1 && selectedCampaigns.length === 0}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 text-white font-medium"
              >
                Next Step →
              </Button>
            ) : (
              <Button
                onClick={handleExport}
                disabled={isExporting || selectedCampaigns.length === 0}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 text-white font-medium"
              >
                {isExporting ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Campaigns
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
