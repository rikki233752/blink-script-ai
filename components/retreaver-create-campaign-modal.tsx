"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"

interface RetreaverCreateCampaignModalProps {
  onCampaignCreated?: () => void
  trigger?: React.ReactNode
}

export default function RetreaverCreateCampaignModal({
  onCampaignCreated,
  trigger,
}: RetreaverCreateCampaignModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    enabled: true,
    archived: false,
    question_score_failure_threshold: 0,
    validation_score_failure_threshold: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "❌ Validation Error",
        description: "Campaign name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      console.log("Creating Retreaver campaign:", formData)

      const response = await fetch("/api/retreaver/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("Create campaign response:", data)

      if (data.success) {
        toast({
          title: "✅ Campaign Created",
          description: `Successfully created campaign: ${formData.name}`,
        })

        // Reset form
        setFormData({
          name: "",
          description: "",
          enabled: true,
          archived: false,
          question_score_failure_threshold: 0,
          validation_score_failure_threshold: 0,
        })

        setOpen(false)
        onCampaignCreated?.()
      } else {
        throw new Error(data.message || "Failed to create campaign")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast({
        title: "❌ Error Creating Campaign",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">CREATE CAMPAIGN</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-6 w-6 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium text-gray-900">
              Name<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter campaign name"
              className="h-12 text-base"
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium text-gray-900">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter campaign description (optional)"
              className="min-h-[80px] text-base"
              rows={3}
            />
          </div>

          {/* Campaign Enable/Disable */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="enabled" className="text-base font-medium text-gray-900">
              Campaign Enable/Disable
            </Label>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => handleInputChange("enabled", checked)}
            />
          </div>

          {/* Campaign Archive/Un-Archive */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="archived" className="text-base font-medium text-gray-900">
              Campaign Archive/Un-Archive
            </Label>
            <Switch
              id="archived"
              checked={formData.archived}
              onCheckedChange={(checked) => handleInputChange("archived", checked)}
            />
          </div>

          {/* Question Score Failure Threshold */}
          <div className="space-y-2">
            <Label htmlFor="question_score" className="text-base font-medium text-gray-900">
              Question Score Failure Threshold<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="question_score"
              type="number"
              value={formData.question_score_failure_threshold}
              onChange={(e) => handleInputChange("question_score_failure_threshold", Number(e.target.value))}
              className="h-12 text-base"
              min="0"
              max="100"
            />
          </div>

          {/* Validation Score Failure Threshold */}
          <div className="space-y-2">
            <Label htmlFor="validation_score" className="text-base font-medium text-gray-900">
              Validation Score Failure Threshold<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="validation_score"
              type="number"
              value={formData.validation_score_failure_threshold}
              onChange={(e) => handleInputChange("validation_score_failure_threshold", Number(e.target.value))}
              className="h-12 text-base"
              min="0"
              max="100"
            />
          </div>

          <DialogFooter className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
