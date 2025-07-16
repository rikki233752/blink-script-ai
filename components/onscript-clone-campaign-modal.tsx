"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { ChevronDown, ChevronRight, X } from "lucide-react"

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
  color: string
}

interface OnScriptCloneCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: Campaign
  onCampaignClone?: (campaign: Campaign) => void
}

interface CloneSection {
  id: string
  title: string
  items: {
    key: string
    label: string
    enabled: boolean
  }[]
  expanded: boolean
}

export function OnScriptCloneCampaignModal({
  isOpen,
  onClose,
  campaign,
  onCampaignClone,
}: OnScriptCloneCampaignModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [campaignName, setCampaignName] = useState(`${campaign.campaign_name} - Cloned`)

  const [cloneSections, setCloneSections] = useState<CloneSection[]>([
    {
      id: "general",
      title: "GENERAL",
      expanded: true,
      items: [
        { key: "campaignDetails", label: "Clone Campaign Details", enabled: true },
        { key: "queueFilters", label: "Clone Queue Filters", enabled: true },
        { key: "downloadConfig", label: "Clone Download Config", enabled: true },
      ],
    },
    {
      id: "aiServices",
      title: "AI SERVICES",
      expanded: false,
      items: [
        { key: "facts", label: "Clone Facts", enabled: true },
        { key: "disposition", label: "Clone Disposition", enabled: true },
        { key: "intent", label: "Clone Intent", enabled: true },
        { key: "sentiment", label: "Clone Sentiment", enabled: true },
      ],
    },
    {
      id: "other",
      title: "OTHER",
      expanded: false,
      items: [{ key: "webhook", label: "Clone Webhook", enabled: true }],
    },
  ])

  const toggleSection = (sectionId: string) => {
    setCloneSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, expanded: !section.expanded } : section)),
    )
  }

  const toggleItem = (sectionId: string, itemKey: string) => {
    setCloneSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) => (item.key === itemKey ? { ...item, enabled: !item.enabled } : item)),
            }
          : section,
      ),
    )
  }

  const handleCloneCampaign = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Get enabled clone options
      const enabledOptions: Record<string, boolean> = {}
      cloneSections.forEach((section) => {
        section.items.forEach((item) => {
          enabledOptions[item.key] = item.enabled
        })
      })

      const clonedCampaign: Campaign = {
        ...campaign,
        id: `${campaign.id}_clone_${Date.now()}`,
        campaign_name: campaignName,
        status: "paused", // New campaigns start as paused
        created_at: new Date().toISOString(),
        // Reset metrics for new campaign
        total_calls: 0,
        qc_approved: 0,
        qc_rejected: 0,
        completed_calls: 0,
        skipped_calls: 0,
        audio_duration: 0,
        average_score: 0,
      }

      onCampaignClone?.(clonedCampaign)
      onClose()

      toast({
        title: "Campaign Cloned Successfully",
        description: `"${campaignName}" has been created with the selected settings.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clone campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-white">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <DialogTitle className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
              CLONE CAMPAIGN - {campaign.campaign_name.toUpperCase()}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Description */}
              <div className="text-sm text-gray-600 leading-relaxed">
                You can clone the campaign with the settings listed below. After cloning, you can go to the campaign
                settings to import scorecards and dispositions from other campaigns.
              </div>

              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="campaign-name" className="text-sm font-medium text-gray-900">
                  Campaign Name*
                </Label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full"
                  placeholder="Enter campaign name"
                />
              </div>

              {/* Instructions */}
              <div className="text-sm text-gray-600">
                Toggle the sections below to include or exclude data for cloning in the campaign.
              </div>

              {/* Clone Sections */}
              <div className="space-y-4">
                {cloneSections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {section.title}
                      </span>
                      {section.expanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>

                    {/* Section Content */}
                    {section.expanded && (
                      <div className="border-t border-gray-200 p-4 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {section.items.map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              <Switch
                                checked={item.enabled}
                                onCheckedChange={() => toggleItem(section.id, item.key)}
                                className="data-[state=checked]:bg-blue-600"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="px-8">
              Cancel
            </Button>
            <Button
              onClick={handleCloneCampaign}
              disabled={isLoading || !campaignName.trim()}
              className="px-8 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Duplicating..." : "Duplicate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
