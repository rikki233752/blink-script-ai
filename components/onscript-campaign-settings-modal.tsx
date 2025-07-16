"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Download,
  BarChart3,
  FileCheck,
  Target,
  MessageSquare,
  Heart,
  Webhook,
  Users,
  Trash2,
  Eye,
  Zap,
  Plus,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WebhookSamplePayloadModal } from "./webhook-sample-payload-modal"
import { WebhookTestModal } from "./webhook-test-modal"

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

interface Disposition {
  id: string
  name: string
  commission: boolean
  criteria: string
  description: string
}

interface Intent {
  id: string
  name: string
  description: string
}

interface Fact {
  id: string
  name: string
  description: string
}

interface OnScriptCampaignSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: Campaign
  onCampaignUpdate?: (campaign: Campaign) => void
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  section: string
}

const sidebarSections = [
  {
    title: "CAMPAIGN MANAGEMENT",
    items: [
      { id: "campaign-details", label: "Campaign Details", icon: FileText, section: "campaign-management" },
      { id: "queue-filters", label: "Queue Filters", icon: Filter, section: "campaign-management" },
      { id: "download-config", label: "Download Config", icon: Download, section: "campaign-management" },
    ],
  },
  {
    title: "AI SERVICES",
    items: [
      { id: "scorecard", label: "Scorecard", icon: BarChart3, section: "ai-services" },
      { id: "facts", label: "Facts", icon: FileCheck, section: "ai-services" },
      { id: "disposition", label: "Disposition", icon: Target, section: "ai-services" },
      { id: "intent", label: "Intent", icon: MessageSquare, section: "ai-services" },
      { id: "sentiment", label: "Sentiment", icon: Heart, section: "ai-services" },
    ],
  },
  {
    title: "OTHER",
    items: [
      { id: "webhook", label: "Webhook", icon: Webhook, section: "other" },
      { id: "agents", label: "Agents", icon: Users, section: "other" },
    ],
  },
  {
    title: "DANGER",
    items: [{ id: "delete-campaign", label: "Delete Campaign", icon: Trash2, section: "danger" }],
  },
]

// Default dispositions based on the screenshots
const defaultDispositions: Disposition[] = [
  {
    id: "1",
    name: "DNC",
    commission: false,
    criteria: "Direct request from the customer to cease all call communications (Do Not Call).",
    description: "The customer has requested not to be called, expressed as 'DNC' or Do Not Call.",
  },
  {
    id: "2",
    name: "Disconnected",
    commission: false,
    criteria:
      "The call drops mid-conversation due to technical issues, poor connectivity, or an abrupt disconnection by either party. The sale or verification (e.g., three-way verification for Marketplace customers) was not fully completed due to the disconnection.",
    description:
      "Use this disposition when a call disconnects mid-conversation. This includes: Unexpected call drops due to technical issues. Customer hanging up before completing verification or confirming enrollment. Calls where a required three-way call was not conducted for Marketplace customers before disconnection.",
  },
  {
    id: "3",
    name: "Employer Coverage",
    commission: false,
    criteria: "The consumer confirms they have employer-sponsored health insurance in addition to Medicare.",
    description:
      "This disposition is used when the consumer identifies VA benefits as part of their healthcare coverage.",
  },
  {
    id: "4",
    name: "Unknown",
    commission: false,
    criteria:
      "The call transcript is missing or incomplete, preventing analysis. Does not have a disposition that perfectly fits a scenario",
    description:
      "Use this disposition when the call transcript is unavailable or too incomplete to categorize properly.",
  },
  {
    id: "5",
    name: "VA Coverage",
    commission: false,
    criteria:
      "The consumer confirms they receive healthcare coverage through Veterans Affairs (VA) benefits in addition to Medicare.",
    description:
      "This disposition is used when the consumer identifies VA benefits as part of their healthcare coverage.",
  },
  {
    id: "6",
    name: "Wrong Number",
    commission: false,
    criteria: "Customer or agent indicates this is the wrong number or business",
    description:
      "The customer says they are trying to reach a different business or the agent tells the customer this is the wrong number",
  },
]

export function OnScriptCampaignSettingsModal({
  isOpen,
  onClose,
  campaign,
  onCampaignUpdate,
}: OnScriptCampaignSettingsModalProps) {
  const [activeSection, setActiveSection] = useState("campaign-details")
  const [expandedSections, setExpandedSections] = useState({
    "campaign-management": true,
    "ai-services": true,
    other: true,
    danger: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSamplePayloadModal, setShowSamplePayloadModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const { toast } = useToast()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Disposition state
  const [dispositionEnabled, setDispositionEnabled] = useState(true)
  const [dispositions, setDispositions] = useState<Disposition[]>(defaultDispositions)

  // Intent state management
  const [intentEnabled, setIntentEnabled] = useState(true)
  const [intents, setIntents] = useState<Intent[]>([
    {
      id: "1",
      name: "Callback_Requested",
      description: "Customer and agent agree to a day and time for a callback",
    },
    {
      id: "2",
      name: "Cash",
      description: "Customer expresses they are interested in receiving cash",
    },
    {
      id: "3",
      name: "Check",
      description: "Customer expresses they are interested in receiving a check",
    },
    {
      id: "4",
      name: "Confused_Caller",
      description: "Customer shows confusion of what the call is about",
    },
    {
      id: "5",
      name: "Customer_Service",
      description: "Customer expresses interest in health insurance or switching their current plan",
    },
    {
      id: "6",
      name: "Health_Insurance",
      description: "Customer expresses interest in health insurance or switching their current plan",
    },
    {
      id: "7",
      name: "Not_Interested",
      description: "Customer expresses they are not interested in a new health insurance plan",
    },
    {
      id: "8",
      name: "Spend_Card",
      description: "Customer expresses interest in getting a spend card, gift card, or benefit card",
    },
    {
      id: "9",
      name: "Subsidy",
      description: "Customer called in about subsidy",
    },
    {
      id: "10",
      name: "Wrong_Number",
      description: "Customer or agent says this is the wrong number",
    },
  ])

  // Facts state management
  const [factsEnabled, setFactsEnabled] = useState(true)
  const [facts, setFacts] = useState<Fact[]>([
    {
      id: "1",
      name: "Account_number",
      description: "What is the customer's account number, leave blank if not mentioned",
    },
    {
      id: "2",
      name: "Age",
      description: "What is the customer's age, leave blank if not mentioned",
    },
    {
      id: "3",
      name: "Cash",
      description: "Is the customer calling for cash, yes or no",
    },
    {
      id: "4",
      name: "Customer_Service",
      description:
        "Did the customer explicitly state that they were seeking customer service assistance only, yes or no",
    },
    {
      id: "5",
      name: "Date_of_Birth",
      description: "What is the customer's date of birth, leave blank if not mentioned",
    },
    {
      id: "6",
      name: "Dental",
      description: "Is the customer calling for dental insurance, yes or no",
    },
    {
      id: "7",
      name: "Email",
      description: "What is the customer's email, leave blank if not mentioned",
    },
    {
      id: "8",
      name: "Existing_Marketplace_Plan",
      description: "Is the consumer in an existing ACA marketplace plan, yes or no",
    },
    {
      id: "9",
      name: "Full_Name",
      description: "What is the customer's full name, leave blank if not mentioned",
    },
    {
      id: "10",
      name: "Gas",
      description: "Is the customer calling for gas, yes or no",
    },
    {
      id: "11",
      name: "Gift_Card",
      description: "Is the customer calling for a gift card, yes or no",
    },
    {
      id: "12",
      name: "Groceries",
      description: "Is the customer calling for groceries, yes or no",
    },
    {
      id: "13",
      name: "Medicaid",
      description: "Is the customer calling for Medicaid, yes or no",
    },
    {
      id: "14",
      name: "Medicare",
      description: "Is the customer calling for Medicare, yes or no",
    },
    {
      id: "15",
      name: "Not_Looking_For_Insurance",
      description: "Is the customer not looking for insurance, yes or no",
    },
  ])

  // Campaign settings state
  const [settings, setSettings] = useState({
    campaignName: campaign.campaign_name,
    questionScoreThreshold: 79,
    validationScoreThreshold: 0,
    campaignStatus: campaign.status === "active",
    archiveCampaign: false,
    autoFailZeroScore: false,
    apiKeyType: "Campaign Level",
    campaignApiKey: "6b8d64c5-52ae-409a-bb1f-5ac8a03752a8",
  })

  const [queueFilters, setQueueFilters] = useState({
    globalPercentage: 100,
    minCallDuration: 15,
    maxCallDuration: 7200,
    intakeRules: [] as any[],
  })

  const [downloadConfig, setDownloadConfig] = useState({
    method: "HTTP",
    delay: 180,
    httpHeaders: { "1": {} },
  })

  const [webhookConfig, setWebhookConfig] = useState({
    active: true,
    webhookUrl: "https://your-endpoint.com/webhook",
    payloadConfig: {
      metadata: false,
      callDetails: false,
      disposition: false,
      scorecard: false,
      callSummary: false,
      callFacts: false,
      intent: false,
      transcript: false,
      markers: false,
      questions: false,
      vocalytics: false,
    },
  })

  const [agents] = useState([
    // Mock agent data
  ])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedCampaign = {
        ...campaign,
        campaign_name: settings.campaignName,
        status: settings.campaignStatus ? "active" : ("paused" as "active" | "paused" | "completed"),
      }

      onCampaignUpdate?.(updatedCampaign)

      toast({
        title: "Settings Saved",
        description: "Campaign settings have been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save campaign settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(settings.campaignApiKey)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  const handleDeleteCampaign = async () => {
    if (deleteConfirmationText !== campaign.campaign_name) {
      toast({
        title: "Confirmation Failed",
        description: "Please type the exact campaign name to confirm deletion.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      console.log("=== STARTING CAMPAIGN DELETION ===")
      console.log("Campaign ID:", campaign.id)
      console.log("Campaign Name:", campaign.campaign_name)

      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Delete response status:", response.status)
      console.log("Delete response headers:", Object.fromEntries(response.headers.entries()))

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Non-JSON response received:", textResponse)
        throw new Error("Server returned non-JSON response. Please check server logs.")
      }

      const data = await response.json()
      console.log("Delete response data:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (!data.success) {
        throw new Error(data.error || "Campaign deletion was not successful")
      }

      // Show success message with details
      toast({
        title: "Campaign Deleted Successfully",
        description: data.message || `Campaign "${campaign.campaign_name}" has been permanently deleted.`,
      })

      console.log("=== CAMPAIGN DELETION COMPLETED ===")
      console.log("Deleted data:", data.deletedData)

      // Close modals and reset state
      setShowDeleteConfirmation(false)
      setDeleteConfirmationText("")
      onClose()

      // Force a hard refresh to ensure the UI updates
      console.log("Refreshing page to update campaign list...")
      setTimeout(() => {
        window.location.href = window.location.pathname
      }, 1500)
    } catch (error) {
      console.error("=== CAMPAIGN DELETION FAILED ===")
      console.error("Error details:", error)

      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const enabledFieldsCount = Object.values(webhookConfig.payloadConfig).filter(Boolean).length

  // Disposition management functions
  const addDisposition = () => {
    const newDisposition: Disposition = {
      id: (dispositions.length + 1).toString(),
      name: "",
      commission: false,
      criteria: "",
      description: "",
    }
    setDispositions([...dispositions, newDisposition])
  }

  const updateDisposition = (id: string, field: keyof Disposition, value: string | boolean) => {
    setDispositions(dispositions.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

  const deleteDisposition = (id: string) => {
    setDispositions(dispositions.filter((d) => d.id !== id))
  }

  // Intent management functions
  const addIntent = () => {
    const newIntent: Intent = {
      id: (intents.length + 1).toString(),
      name: "",
      description: "",
    }
    setIntents([...intents, newIntent])
  }

  const updateIntent = (id: string, field: keyof Intent, value: string) => {
    setIntents(intents.map((intent) => (intent.id === id ? { ...intent, [field]: value } : intent)))
  }

  const deleteIntent = (id: string) => {
    setIntents(intents.filter((intent) => intent.id !== id))
  }

  // Facts management functions
  const addFact = () => {
    const newFact: Fact = {
      id: (facts.length + 1).toString(),
      name: "",
      description: "",
    }
    setFacts([...facts, newFact])
  }

  const updateFact = (id: string, field: keyof Fact, value: string) => {
    setFacts(facts.map((fact) => (fact.id === id ? { ...fact, [field]: value } : fact)))
  }

  const deleteFact = (id: string) => {
    setFacts(facts.filter((fact) => fact.id !== id))
  }

  const renderDisposition = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Disposition Extraction</h2>
              <p className="text-sm text-blue-700">AI-powered call disposition classification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 font-medium">Enabled</span>
            <Switch checked={dispositionEnabled} onCheckedChange={setDispositionEnabled} />
          </div>
        </div>
      </div>

      {/* Dispositions List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Dispositions ({dispositions.length})</h3>
        </div>

        <div className="space-y-6">
          {dispositions.map((disposition, index) => (
            <div key={disposition.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Disposition Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Disposition {index + 1}</span>
                </div>
                {dispositions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDisposition(disposition.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-blue-600 fill-current" />
                  <Label className="text-sm font-medium">Name:</Label>
                </div>
                <Input
                  value={disposition.name}
                  onChange={(e) => updateDisposition(disposition.id, "name", e.target.value)}
                  placeholder="Enter disposition name"
                  className="ml-5"
                />
              </div>

              {/* Commission Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-gray-400 fill-current" />
                  <Label className="text-sm font-medium">Commission:</Label>
                </div>
                <div className="ml-5 flex items-center gap-2">
                  <Switch
                    checked={disposition.commission}
                    onCheckedChange={(checked) => updateDisposition(disposition.id, "commission", checked)}
                  />
                  <span className="text-sm text-gray-600">{disposition.commission ? "Yes" : "No"}</span>
                </div>
              </div>

              {/* Criteria Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-gray-600" />
                  <Label className="text-sm font-medium">Criteria:</Label>
                </div>
                <Textarea
                  value={disposition.criteria}
                  onChange={(e) => updateDisposition(disposition.id, "criteria", e.target.value)}
                  placeholder="Define the criteria for this disposition"
                  className="ml-5 min-h-[80px]"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-gray-600" />
                  <Label className="text-sm font-medium">Description:</Label>
                </div>
                <Textarea
                  value={disposition.description}
                  onChange={(e) => updateDisposition(disposition.id, "description", e.target.value)}
                  placeholder="Provide a description for this disposition"
                  className="ml-5 min-h-[80px]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Disposition Button */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
          <Button
            onClick={addDisposition}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Disposition
          </Button>
        </div>
      </div>
    </div>
  )

  const renderIntent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Intent Extraction</h2>
              <p className="text-sm text-blue-700">AI-powered call intent classification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 font-medium">Enabled</span>
            <Switch checked={intentEnabled} onCheckedChange={setIntentEnabled} />
          </div>
        </div>
      </div>

      {/* Intents List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Intents ({intents.length})</h3>
        </div>

        <div className="space-y-6">
          {intents.map((intent, index) => (
            <div key={intent.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Intent Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Intent {index + 1}</span>
                </div>
                {intents.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteIntent(intent.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-blue-600 fill-current" />
                  <Label className="text-sm font-medium">Name:</Label>
                </div>
                <Input
                  value={intent.name}
                  onChange={(e) => updateIntent(intent.id, "name", e.target.value)}
                  placeholder="Enter intent name"
                  className="ml-5"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-gray-600" />
                  <Label className="text-sm font-medium">Description:</Label>
                </div>
                <Textarea
                  value={intent.description}
                  onChange={(e) => updateIntent(intent.id, "description", e.target.value)}
                  placeholder="Describe when this intent should be detected"
                  className="ml-5 min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Intent Button */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
          <Button
            onClick={addIntent}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Intent
          </Button>
        </div>
      </div>
    </div>
  )

  const renderFacts = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Facts Extraction</h2>
              <p className="text-sm text-blue-700">AI-powered call facts identification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 font-medium">Enabled</span>
            <Switch checked={factsEnabled} onCheckedChange={setFactsEnabled} />
          </div>
        </div>
      </div>

      {/* Facts List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Facts ({facts.length})</h3>
        </div>

        <div className="space-y-6">
          {facts.map((fact, index) => (
            <div key={fact.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Fact Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Fact {index + 1}</span>
                </div>
                {facts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFact(fact.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-blue-600 fill-current" />
                  <Label className="text-sm font-medium">Name:</Label>
                </div>
                <Input
                  value={fact.name}
                  onChange={(e) => updateFact(fact.id, "name", e.target.value)}
                  placeholder="Enter fact name"
                  className="ml-5"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-gray-600" />
                  <Label className="text-sm font-medium">Description:</Label>
                </div>
                <Textarea
                  value={fact.description}
                  onChange={(e) => updateFact(fact.id, "description", e.target.value)}
                  placeholder="Describe what this fact should extract from the call"
                  className="ml-5 min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Fact Button */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
          <Button
            onClick={addFact}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fact
          </Button>
        </div>
      </div>
    </div>
  )

  const renderPlaceholderContent = (title: string) => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">{title}</h2>
              <p className="text-sm text-blue-700">Placeholder content for {title.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCampaignDetails = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Campaign Details</h2>
              <p className="text-sm text-blue-700">Manage your campaign settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Details Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Campaign Information</h3>
        </div>

        <div className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-blue-600 fill-current" />
              <Label className="text-sm font-medium">Campaign Name:</Label>
            </div>
            <Input
              value={settings.campaignName}
              onChange={(e) => setSettings({ ...settings, campaignName: e.target.value })}
              placeholder="Enter campaign name"
              className="ml-5"
            />
          </div>

          {/* Campaign Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-gray-400 fill-current" />
              <Label className="text-sm font-medium">Campaign Status:</Label>
            </div>
            <div className="ml-5 flex items-center gap-2">
              <Switch
                checked={settings.campaignStatus}
                onCheckedChange={(checked) => setSettings({ ...settings, campaignStatus: checked })}
              />
              <span className="text-sm text-gray-600">{settings.campaignStatus ? "Active" : "Paused"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderQueueFilters = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Queue Filters</h2>
              <p className="text-sm text-blue-700">Manage queue filters for your campaign</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Filters Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Queue Filters Configuration</h3>
        </div>

        <div className="space-y-6">
          {/* Global Percentage */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-blue-600 fill-current" />
              <Label className="text-sm font-medium">Global Percentage:</Label>
            </div>
            <Input
              type="number"
              value={queueFilters.globalPercentage.toString()}
              onChange={(e) => setQueueFilters({ ...queueFilters, globalPercentage: Number.parseInt(e.target.value) })}
              placeholder="Enter global percentage"
              className="ml-5"
            />
          </div>

          {/* Min Call Duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-gray-400 fill-current" />
              <Label className="text-sm font-medium">Min Call Duration:</Label>
            </div>
            <Input
              type="number"
              value={queueFilters.minCallDuration.toString()}
              onChange={(e) => setQueueFilters({ ...queueFilters, minCallDuration: Number.parseInt(e.target.value) })}
              placeholder="Enter minimum call duration"
              className="ml-5"
            />
          </div>

          {/* Max Call Duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-blue-600 fill-current" />
              <Label className="text-sm font-medium">Max Call Duration:</Label>
            </div>
            <Input
              type="number"
              value={queueFilters.maxCallDuration.toString()}
              onChange={(e) => setQueueFilters({ ...queueFilters, maxCallDuration: Number.parseInt(e.target.value) })}
              placeholder="Enter maximum call duration"
              className="ml-5"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderDownloadConfig = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Download Config</h2>
              <p className="text-sm text-blue-700">Configure download settings for your campaign</p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Config Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Download Configuration</h3>
        </div>

        <div className="space-y-6">
          {/* Method */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-blue-600 fill-current" />
              <Label className="text-sm font-medium">Method:</Label>
            </div>
            <Select
              value={downloadConfig.method}
              onValueChange={(value) => setDownloadConfig({ ...downloadConfig, method: value })}
              className="ml-5"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HTTP">HTTP</SelectItem>
                <SelectItem value="FTP">FTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delay */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-gray-400 fill-current" />
              <Label className="text-sm font-medium">Delay:</Label>
            </div>
            <Input
              type="number"
              value={downloadConfig.delay.toString()}
              onChange={(e) => setDownloadConfig({ ...downloadConfig, delay: Number.parseInt(e.target.value) })}
              placeholder="Enter delay"
              className="ml-5"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderWebhook = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Webhook className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Webhook Configuration</h2>
              <p className="text-sm text-blue-700">Configure webhook settings for your campaign</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 font-medium">Enabled</span>
            <Switch
              checked={webhookConfig.active}
              onCheckedChange={(checked) => setWebhookConfig({ ...webhookConfig, active: checked })}
            />
          </div>
        </div>
      </div>

      {/* Webhook Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Webhook Settings</h3>
        </div>

        <div className="space-y-6">
          {/* Webhook URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-blue-600 fill-current" />
              <Label className="text-sm font-medium">Webhook URL:</Label>
            </div>
            <Input
              value={webhookConfig.webhookUrl}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, webhookUrl: e.target.value })}
              placeholder="Enter webhook URL"
              className="ml-5"
            />
          </div>

          {/* Payload Configuration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-gray-400 fill-current" />
              <Label className="text-sm font-medium">Payload Configuration:</Label>
            </div>
            <div className="ml-5 space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.metadata}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, metadata: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Metadata</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.callDetails}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, callDetails: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Call Details</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.disposition}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, disposition: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Disposition</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.scorecard}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, scorecard: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Scorecard</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.callSummary}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, callSummary: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Call Summary</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.callFacts}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, callFacts: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Call Facts</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.intent}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, intent: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Intent</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.transcript}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, transcript: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Transcript</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.markers}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, markers: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Markers</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.questions}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, questions: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhookConfig.payloadConfig.vocalytics}
                  onCheckedChange={(checked) =>
                    setWebhookConfig({
                      ...webhookConfig,
                      payloadConfig: { ...webhookConfig.payloadConfig, vocalytics: checked },
                    })
                  }
                />
                <span className="text-sm text-gray-600">Vocalytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Webhook Button */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
          <Button
            onClick={() => setShowTestModal(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Webhook
          </Button>
        </div>

        {/* View Sample Payload Button */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
          <Button
            onClick={() => setShowSamplePayloadModal(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Sample Payload
          </Button>
        </div>
      </div>
    </div>
  )

  const renderAgents = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Agents</h2>
              <p className="text-sm text-blue-700">Manage agents assigned to your campaign</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Agents Assigned</h3>
        </div>

        <div className="space-y-6">
          {agents.map((agent, index) => (
            <div key={agent.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Agent Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Agent {index + 1}</span>
                </div>
              </div>

              {/* Agent Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-blue-600 fill-current" />
                  <Label className="text-sm font-medium">Agent Name:</Label>
                </div>
                <Input
                  value={agent.name}
                  onChange={(e) => console.log("Agent name changed:", e.target.value)}
                  placeholder="Enter agent name"
                  className="ml-5"
                />
              </div>

              {/* Agent ID */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-gray-400 fill-current" />
                  <Label className="text-sm font-medium">Agent ID:</Label>
                </div>
                <Input
                  value={agent.id}
                  onChange={(e) => console.log("Agent ID changed:", e.target.value)}
                  placeholder="Enter agent ID"
                  className="ml-5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "campaign-details":
        return renderCampaignDetails()
      case "queue-filters":
        return renderQueueFilters()
      case "download-config":
        return renderDownloadConfig()
      case "scorecard":
        return renderPlaceholderContent("Scorecard")
      case "facts":
        return renderFacts()
      case "disposition":
        return renderDisposition()
      case "intent":
        return renderIntent()
      case "sentiment":
        return renderPlaceholderContent("Sentiment")
      case "webhook":
        return renderWebhook()
      case "agents":
        return renderAgents()
      case "delete-campaign":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Campaign</h2>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-2">Permanently Delete Campaign</h3>
                  <p className="text-sm text-red-700 mb-4">
                    This action cannot be undone. This will permanently delete the campaign "{campaign.campaign_name}"
                    and all associated data including:
                  </p>
                  <ul className="text-sm text-red-700 mb-6 list-disc list-inside space-y-1">
                    <li>All call logs and recordings</li>
                    <li>Transcriptions and AI analysis</li>
                    <li>Quality reviews and scorecards</li>
                    <li>Campaign analytics and reports</li>
                    <li>Webhook configurations</li>
                    <li>Agent assignments</li>
                  </ul>

                  <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Campaign Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Campaign Name:</span>
                        <div className="font-medium">{campaign.campaign_name}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Campaign ID:</span>
                        <div className="font-mono text-xs">{campaign.id.slice(-3)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Calls:</span>
                        <div className="font-medium">{campaign.total_calls.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <div className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Campaign
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return renderCampaignDetails()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-white">
          <div className="flex h-[90vh]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {campaign.campaign_name} - ID: {campaign.id.slice(-3)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {sidebarSections.map((section) => (
                    <div key={section.title}>
                      <button
                        onClick={() => toggleSection(section.title.toLowerCase().replace(" ", "-"))}
                        className="flex items-center justify-between w-full text-left mb-2"
                      >
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {section.title}
                        </span>
                        {expandedSections[section.title.toLowerCase().replace(" ", "-")] ? (
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-gray-400" />
                        )}
                      </button>

                      {expandedSections[section.title.toLowerCase().replace(" ", "-")] && (
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const Icon = item.icon
                            return (
                              <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={cn(
                                  "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors",
                                  activeSection === item.id
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "text-gray-700 hover:bg-gray-100",
                                  item.section === "danger" && "text-red-600 hover:bg-red-50",
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {item.label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header with Save Button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold">Campaign Settings</DialogTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Click save to apply changes</span>
                  <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <ScrollArea className="flex-1 p-6">{renderContent()}</ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-3">You are about to permanently delete:</p>
              <div className="bg-white border border-red-200 rounded p-3">
                <div className="font-medium text-gray-900">{campaign.campaign_name}</div>
                <div className="text-xs text-gray-500 font-mono">{campaign.id}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation" className="text-sm font-medium">
                Type the campaign name to confirm deletion:
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder={campaign.campaign_name}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Type: <span className="font-medium">{campaign.campaign_name}</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  setDeleteConfirmationText("")
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCampaign}
                disabled={deleteConfirmationText !== campaign.campaign_name || isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Webhook Modals */}
      <WebhookSamplePayloadModal
        isOpen={showSamplePayloadModal}
        onClose={() => setShowSamplePayloadModal(false)}
        campaignId={campaign.id}
        payloadConfig={webhookConfig.payloadConfig}
      />

      <WebhookTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        campaignId={campaign.id}
        webhookUrl={webhookConfig.webhookUrl}
        payloadConfig={webhookConfig.payloadConfig}
      />
    </>
  )
}
