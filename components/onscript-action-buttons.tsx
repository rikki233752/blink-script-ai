"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Menu, Plus, Mic } from "lucide-react"
import { useRouter } from "next/navigation"

// Import the existing modal components
import { OnScriptCampaignSettingsModal } from "@/components/onscript-campaign-settings-modal"
import { OnScriptCloneCampaignModal } from "@/components/onscript-clone-campaign-modal"

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

interface OnScriptActionButtonsProps {
  campaign: Campaign
  onViewCalls?: (campaign: Campaign) => void
  onCampaignUpdate?: (campaign: Campaign) => void
  onCampaignClone?: (campaign: Campaign) => void
}

export function OnScriptActionButtons({
  campaign,
  onViewCalls,
  onCampaignUpdate,
  onCampaignClone,
}: OnScriptActionButtonsProps) {
  const [showOnScriptSettingsModal, setShowOnScriptSettingsModal] = useState(false)
  const [showOnScriptCloneModal, setShowOnScriptCloneModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleViewCalls = () => {
    // Navigate to dedicated call logs page
    const campaignName = encodeURIComponent(campaign.campaign_name)
    router.push(`/onscript/campaigns/${campaign.id}/calls?campaignName=${campaignName}`)
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Campaign Settings Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-300 hover:border-gray-400"
              onClick={() => setShowOnScriptSettingsModal(true)}
            >
              <Menu className="h-4 w-4 text-gray-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Campaign Settings</p>
          </TooltipContent>
        </Tooltip>

        {/* Clone Campaign Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white"
              onClick={() => setShowOnScriptCloneModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clone Campaign</p>
          </TooltipContent>
        </Tooltip>

        {/* Calls Button - Updated to navigate to dedicated page */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
              onClick={handleViewCalls}
            >
              <span className="text-xs font-medium">Calls</span>
              <Mic className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Call Logs</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* OnScript Campaign Settings Modal */}
      <OnScriptCampaignSettingsModal
        isOpen={showOnScriptSettingsModal}
        onClose={() => setShowOnScriptSettingsModal(false)}
        campaign={campaign}
        onCampaignUpdate={onCampaignUpdate}
      />

      {/* OnScript Clone Campaign Modal */}
      <OnScriptCloneCampaignModal
        isOpen={showOnScriptCloneModal}
        onClose={() => setShowOnScriptCloneModal(false)}
        campaign={campaign}
        onCampaignClone={onCampaignClone}
      />
    </TooltipProvider>
  )
}
