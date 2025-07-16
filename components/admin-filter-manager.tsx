"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, Eye, EyeOff, Filter } from "lucide-react"

interface AdminFilter {
  id: string
  filter_name: string
  filter_type: string
  filter_value: any
  operator: string
  is_active: boolean
  applies_to: string[]
  created_at: string
}

export default function AdminFilterManager() {
  const [filters, setFilters] = useState<AdminFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [showManager, setShowManager] = useState(false)

  // New filter form state
  const [newFilter, setNewFilter] = useState({
    filter_name: "",
    filter_type: "agent_name",
    filter_value: "",
    operator: "equals",
    applies_to: ["campaigns"],
  })

  useEffect(() => {
    fetchFilters()
  }, [])

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem("supabase_token")
      if (!token) return

      const response = await fetch("/api/admin-filters", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFilters(data.filters || [])
      }
    } catch (error) {
      console.error("Error fetching admin filters:", error)
    } finally {
      setLoading(false)
    }
  }

  const createFilter = async () => {
    try {
      const token = localStorage.getItem("supabase_token")
      if (!token) return

      // Parse filter value based on type
      let parsedValue = newFilter.filter_value
      if (newFilter.filter_type === "call_duration") {
        parsedValue = Number.parseFloat(newFilter.filter_value)
      } else if (newFilter.filter_type === "keyword" && newFilter.filter_value.includes(",")) {
        parsedValue = newFilter.filter_value.split(",").map((k: string) => k.trim())
      }

      const response = await fetch("/api/admin-filters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newFilter,
          filter_value: parsedValue,
        }),
      })

      if (response.ok) {
        await fetchFilters()
        setNewFilter({
          filter_name: "",
          filter_type: "agent_name",
          filter_value: "",
          operator: "equals",
          applies_to: ["campaigns"],
        })
      }
    } catch (error) {
      console.error("Error creating filter:", error)
    }
  }

  const toggleFilter = async (filterId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem("supabase_token")
      if (!token) return

      const response = await fetch(`/api/admin-filters/${filterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (response.ok) {
        await fetchFilters()
      }
    } catch (error) {
      console.error("Error toggling filter:", error)
    }
  }

  const deleteFilter = async (filterId: string) => {
    try {
      const token = localStorage.getItem("supabase_token")
      if (!token) return

      const response = await fetch(`/api/admin-filters/${filterId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchFilters()
      }
    } catch (error) {
      console.error("Error deleting filter:", error)
    }
  }

  const getFilterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      agent_name: "Agent Name",
      publisher_name: "Publisher Name",
      campaign_status: "Campaign Status",
      call_duration: "Call Duration",
      keyword: "Keywords",
      date_range: "Date Range",
      custom: "Custom",
    }
    return labels[type] || type
  }

  const getOperatorLabel = (operator: string) => {
    const labels: Record<string, string> = {
      equals: "Equals",
      contains: "Contains",
      greater_than: "Greater Than",
      less_than: "Less Than",
      between: "Between",
      in: "In List",
      not_in: "Not In List",
    }
    return labels[operator] || operator
  }

  // Hidden trigger - only show if user presses Ctrl+Shift+F
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault()
        setShowManager(!showManager)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [showManager])

  if (!showManager) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManager(true)}
          className="opacity-20 hover:opacity-100 transition-opacity"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Admin Filter Manager
              </CardTitle>
              <CardDescription>Hidden background filters for admin users (Ctrl+Shift+F)</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowManager(false)}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active Filters ({filters.filter((f) => f.is_active).length})</TabsTrigger>
              <TabsTrigger value="all">All Filters ({filters.length})</TabsTrigger>
              <TabsTrigger value="create">Create Filter</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {filters
                .filter((f) => f.is_active)
                .map((filter) => (
                  <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{filter.filter_name}</span>
                      </div>
                      <Badge variant="secondary">{getFilterTypeLabel(filter.filter_type)}</Badge>
                      <Badge variant="outline">{getOperatorLabel(filter.operator)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Value: {JSON.stringify(filter.filter_value)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={filter.is_active}
                        onCheckedChange={(checked) => toggleFilter(filter.id, checked)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => deleteFilter(filter.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {filter.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">{filter.filter_name}</span>
                    </div>
                    <Badge variant="secondary">{getFilterTypeLabel(filter.filter_type)}</Badge>
                    <Badge variant="outline">{getOperatorLabel(filter.operator)}</Badge>
                    <span className="text-sm text-muted-foreground">Value: {JSON.stringify(filter.filter_value)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={filter.is_active}
                      onCheckedChange={(checked) => toggleFilter(filter.id, checked)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => deleteFilter(filter.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter_name">Filter Name</Label>
                  <Input
                    id="filter_name"
                    value={newFilter.filter_name}
                    onChange={(e) => setNewFilter({ ...newFilter, filter_name: e.target.value })}
                    placeholder="e.g., High Value Agents"
                  />
                </div>

                <div>
                  <Label htmlFor="filter_type">Filter Type</Label>
                  <Select
                    value={newFilter.filter_type}
                    onValueChange={(value) => setNewFilter({ ...newFilter, filter_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent_name">Agent Name</SelectItem>
                      <SelectItem value="publisher_name">Publisher Name</SelectItem>
                      <SelectItem value="campaign_status">Campaign Status</SelectItem>
                      <SelectItem value="call_duration">Call Duration</SelectItem>
                      <SelectItem value="keyword">Keywords</SelectItem>
                      <SelectItem value="date_range">Date Range</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select
                    value={newFilter.operator}
                    onValueChange={(value) => setNewFilter({ ...newFilter, operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="between">Between</SelectItem>
                      <SelectItem value="in">In List</SelectItem>
                      <SelectItem value="not_in">Not In List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter_value">Filter Value</Label>
                  <Input
                    id="filter_value"
                    value={newFilter.filter_value}
                    onChange={(e) => setNewFilter({ ...newFilter, filter_value: e.target.value })}
                    placeholder="Enter value or comma-separated list"
                  />
                </div>
              </div>

              <Button onClick={createFilter} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Filter
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
