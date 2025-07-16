"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, X, Save } from "lucide-react"

export default function CreateCampaignPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    type: "outbound",
    status: "draft",
    startDate: "",
    endDate: "",
    tags: [] as string[],
    targetCalls: 1000,
    targetRevenue: 50000,
    targetConversionRate: 15,
    budget: 10000,
    qcPercentage: 10,
    agents: [] as { name: string; email: string }[],
    script: {
      opening: "",
      keyPoints: "",
      objectionHandling: "",
      closing: "",
    },
    integrations: {
      ringba: false,
      twilio: false,
      salesforce: false,
    },
  })

  const [newTag, setNewTag] = useState("")
  const [newAgent, setNewAgent] = useState({ name: "", email: "" })

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setCampaignData({
      ...campaignData,
      [field]: value,
    })
  }

  const handleScriptChange = (field: string, value: string) => {
    setCampaignData({
      ...campaignData,
      script: {
        ...campaignData.script,
        [field]: value,
      },
    })
  }

  const handleIntegrationChange = (integration: string, value: boolean) => {
    setCampaignData({
      ...campaignData,
      integrations: {
        ...campaignData.integrations,
        [integration]: value,
      },
    })
  }

  const addTag = () => {
    if (newTag && !campaignData.tags.includes(newTag)) {
      setCampaignData({
        ...campaignData,
        tags: [...campaignData.tags, newTag],
      })
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setCampaignData({
      ...campaignData,
      tags: campaignData.tags.filter((t) => t !== tag),
    })
  }

  const addAgent = () => {
    if (newAgent.name && newAgent.email) {
      setCampaignData({
        ...campaignData,
        agents: [...campaignData.agents, { ...newAgent }],
      })
      setNewAgent({ name: "", email: "" })
    }
  }

  const removeAgent = (index: number) => {
    const updatedAgents = [...campaignData.agents]
    updatedAgents.splice(index, 1)
    setCampaignData({
      ...campaignData,
      agents: updatedAgents,
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Navigate back to campaigns page
    router.push("/campaigns")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => router.push("/campaigns")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Create Campaign</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
              onClick={() => router.push("/campaigns")}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Campaign
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800 border-b border-gray-700 rounded-none w-full justify-start p-0">
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-transparent data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-400 border-b-2 border-transparent rounded-none px-6 py-4"
            >
              Campaign Details
            </TabsTrigger>
            <TabsTrigger
              value="targets"
              className="data-[state=active]:bg-transparent data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-400 border-b-2 border-transparent rounded-none px-6 py-4"
            >
              Targets & Budget
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="data-[state=active]:bg-transparent data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-400 border-b-2 border-transparent rounded-none px-6 py-4"
            >
              Team & Scripts
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-transparent data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-gray-400 border-b-2 border-transparent rounded-none px-6 py-4"
            >
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Campaign Details */}
          <TabsContent value="details" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      value={campaignData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Campaign Type</Label>
                    <Select value={campaignData.type} onValueChange={(value) => handleInputChange("type", value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="outbound">Outbound Sales</SelectItem>
                        <SelectItem value="inbound">Inbound Support</SelectItem>
                        <SelectItem value="mixed">Mixed Campaign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={campaignData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Describe your campaign objectives and strategy"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={campaignData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={campaignData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={campaignData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button variant="outline" className="border-gray-700 hover:bg-gray-800" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {campaignData.tags.map((tag, index) => (
                    <Badge key={index} className="bg-gray-700 hover:bg-gray-600 px-3 py-1">
                      {tag}
                      <button className="ml-2 text-gray-400 hover:text-white" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {campaignData.tags.length === 0 && <span className="text-gray-500 text-sm">No tags added yet</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Targets & Budget */}
          <TabsContent value="targets" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Performance Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetCalls">Target Calls</Label>
                    <Input
                      id="targetCalls"
                      type="number"
                      value={campaignData.targetCalls}
                      onChange={(e) => handleInputChange("targetCalls", Number.parseInt(e.target.value))}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetConversionRate">Target Conversion %</Label>
                    <Input
                      id="targetConversionRate"
                      type="number"
                      value={campaignData.targetConversionRate}
                      onChange={(e) => handleInputChange("targetConversionRate", Number.parseInt(e.target.value))}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetRevenue">Target Revenue ($)</Label>
                    <Input
                      id="targetRevenue"
                      type="number"
                      value={campaignData.targetRevenue}
                      onChange={(e) => handleInputChange("targetRevenue", Number.parseInt(e.target.value))}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Budget Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Campaign Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={campaignData.budget}
                    onChange={(e) => handleInputChange("budget", Number.parseInt(e.target.value))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Quality Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qcPercentage">QC Review Percentage</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="qcPercentage"
                      type="number"
                      value={campaignData.qcPercentage}
                      onChange={(e) => handleInputChange("qcPercentage", Number.parseInt(e.target.value))}
                      className="bg-gray-700 border-gray-600"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <p className="text-sm text-gray-400">Percentage of calls that will be reviewed for quality control</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team & Scripts */}
          <TabsContent value="team" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Agent Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agentName">Agent Name</Label>
                    <Input
                      id="agentName"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Enter agent name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentEmail">Agent Email</Label>
                    <Input
                      id="agentEmail"
                      type="email"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Enter agent email"
                    />
                  </div>
                </div>

                <Button variant="outline" className="border-gray-700 hover:bg-gray-800" onClick={addAgent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agent
                </Button>

                {campaignData.agents.length > 0 ? (
                  <div className="border border-gray-700 rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-gray-300">Name</th>
                          <th className="text-left p-3 text-sm font-medium text-gray-300">Email</th>
                          <th className="p-3 text-sm font-medium text-gray-300 w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignData.agents.map((agent, index) => (
                          <tr key={index} className="border-t border-gray-700">
                            <td className="p-3 text-gray-300">{agent.name}</td>
                            <td className="p-3 text-gray-300">{agent.email}</td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white"
                                onClick={() => removeAgent(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">No agents added yet</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Call Script</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opening">Opening Script</Label>
                  <Textarea
                    id="opening"
                    value={campaignData.script.opening}
                    onChange={(e) => handleScriptChange("opening", e.target.value)}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Enter your opening script"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyPoints">Key Points</Label>
                  <Textarea
                    id="keyPoints"
                    value={campaignData.script.keyPoints}
                    onChange={(e) => handleScriptChange("keyPoints", e.target.value)}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Enter key points to cover"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectionHandling">Objection Handling</Label>
                  <Textarea
                    id="objectionHandling"
                    value={campaignData.script.objectionHandling}
                    onChange={(e) => handleScriptChange("objectionHandling", e.target.value)}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Enter objection handling strategies"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closing">Closing Script</Label>
                  <Textarea
                    id="closing"
                    value={campaignData.script.closing}
                    onChange={(e) => handleScriptChange("closing", e.target.value)}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Enter your closing script"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Third-Party Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Ringba</h3>
                    <p className="text-sm text-gray-400">Connect to Ringba for call tracking</p>
                  </div>
                  <Switch
                    checked={campaignData.integrations.ringba}
                    onCheckedChange={(checked) => handleIntegrationChange("ringba", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Twilio</h3>
                    <p className="text-sm text-gray-400">Connect to Twilio for SMS notifications</p>
                  </div>
                  <Switch
                    checked={campaignData.integrations.twilio}
                    onCheckedChange={(checked) => handleIntegrationChange("twilio", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Salesforce</h3>
                    <p className="text-sm text-gray-400">Connect to Salesforce for CRM integration</p>
                  </div>
                  <Switch
                    checked={campaignData.integrations.salesforce}
                    onCheckedChange={(checked) => handleIntegrationChange("salesforce", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
