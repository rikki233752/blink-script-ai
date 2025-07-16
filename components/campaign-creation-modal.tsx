"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { X, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CampaignCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (campaign: any) => void
}

const VERTICALS = [
  { value: "aca", label: "ACA (Affordable Care Act)" },
  { value: "medicare", label: "Medicare" },
  { value: "auto-insurance", label: "Auto Insurance" },
  { value: "debt-relief", label: "Debt Relief" },
  { value: "solar-leads", label: "Solar Leads" },
  { value: "home-services", label: "Home Services" },
]

export function CampaignCreationModal({ isOpen, onClose, onSuccess }: CampaignCreationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    vertical: "",
    isEnabled: false,
    isArchived: false,
    questionScoreThreshold: 0,
    validationScoreThreshold: 0,
  })

  const [pixelUrl, setPixelUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Campaign name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.vertical) {
      toast({
        title: "Validation Error",
        description: "Please select a vertical",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("🚀 Creating OnScript AI campaign with integrations...")

      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          vertical: formData.vertical,
          questionScoreThreshold: formData.questionScoreThreshold,
          validationScoreThreshold: formData.validationScoreThreshold,
          isEnabled: formData.isEnabled,
          isArchived: formData.isArchived,
          createPixel: true,
          // Integration settings
          integrations: {
            ringba: {
              enabled: true,
              syncCallLogs: true,
            },
            deepgram: {
              enabled: true,
              transcriptionModel: "nova-2",
              features: ["punctuation", "diarization", "sentiment"],
            },
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Generate pixel URL for this campaign
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const generatedPixelUrl = `${baseUrl}/api/ringba/pixel?campaign_id=${result.data.id}&user_id=current_user`
        setPixelUrl(generatedPixelUrl)

        toast({
          title: "Campaign Created Successfully",
          description: `Campaign "${formData.name}" has been created with RingBA pixel integration.`,
        })

        onSuccess(result.data)
        // Don't close modal immediately so user can copy pixel URL
      } else {
        throw new Error(result.error || "Failed to create campaign")
      }
    } catch (error) {
      console.error("❌ Campaign creation failed:", error)
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyPixelUrl = async () => {
    try {
      await navigator.clipboard.writeText(pixelUrl)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Pixel URL copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      vertical: "",
      isEnabled: false,
      isArchived: false,
      questionScoreThreshold: 0,
      validationScoreThreshold: 0,
    })
    setPixelUrl("")
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 bg-white border-0 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">CREATE CAMPAIGN</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Name<span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder=""
              className="w-full h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Vertical Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Select Vertical<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vertical}
              onChange={(e) => setFormData((prev) => ({ ...prev, vertical: e.target.value }))}
              className="w-full h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-md px-3"
              required
            >
              <option value="">Choose a vertical</option>
              {VERTICALS.map((vertical) => (
                <option key={vertical.value} value={vertical.value}>
                  {vertical.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4">
            {/* Campaign Enable/Disable */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Campaign Enable/Disable</span>
              <Switch
                checked={formData.isEnabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isEnabled: checked }))}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* Campaign Archive/Un-Archive */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Campaign Archive/Un-Archive</span>
              <Switch
                checked={formData.isArchived}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isArchived: checked }))}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          {/* Question Score Failure Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Question Score Failure Threshold<span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.questionScoreThreshold}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  questionScoreThreshold: Number.parseInt(e.target.value) || 0,
                }))
              }
              className="w-full h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Validation Score Failure Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Validation Score Failure Threshold<span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.validationScoreThreshold}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  validationScoreThreshold: Number.parseInt(e.target.value) || 0,
                }))
              }
              className="w-full h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Pixel URL Display (after creation) */}
          {pixelUrl && (
            <div className="space-y-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="text-sm font-medium text-green-800">
                RingBA Pixel URL (Add this to your RingBA campaigns)
              </label>
              <div className="flex gap-2">
                <Input value={pixelUrl} readOnly className="font-mono text-xs bg-white border-green-300" />
                <Button
                  type="button"
                  onClick={copyPixelUrl}
                  variant="outline"
                  size="icon"
                  className="border-green-300 hover:bg-green-100 bg-transparent"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-green-700">
                Add this pixel URL to your RingBA campaigns to enable BlinkScriptAI oversight and analytics.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 bg-transparent"
            >
              {pixelUrl ? "Done" : "Cancel"}
            </Button>
            {!pixelUrl && (
              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim() || !formData.vertical}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Creating..." : "Create"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
