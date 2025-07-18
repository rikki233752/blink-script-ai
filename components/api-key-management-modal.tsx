"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"

interface ApiKey {
  id: string
  user_id: string
  name: string
  key_hash: string
  key_preview: string
  permissions: string[]
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  created_at: string
  updated_at: string
}

interface ApiKeyManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const AVAILABLE_PERMISSIONS = [
  {
    value: "campaigns:read",
    label: "Read Campaigns",
    description: "View campaign data and metrics",
  },
  {
    value: "campaigns:write",
    label: "Write Campaigns",
    description: "Create and modify campaigns",
  },
  {
    value: "calls:read",
    label: "Read Calls",
    description: "View call logs and recordings",
  },
  {
    value: "calls:write",
    label: "Write Calls",
    description: "Create and modify call data",
  },
  {
    value: "transcripts:read",
    label: "Read Transcripts",
    description: "Access call transcriptions",
  },
  {
    value: "analytics:read",
    label: "Read Analytics",
    description: "View analytics and reports",
  },
  {
    value: "webhooks:manage",
    label: "Manage Webhooks",
    description: "Configure webhook endpoints",
  },
]

export function ApiKeyManagementModal({ isOpen, onClose }: ApiKeyManagementModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyData, setNewKeyData] = useState<{
    key: string
    name: string
    permissions: string[]
    expires_at: string | null
  } | null>(null)

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    permissions: [] as string[],
    expires_at: "",
    never_expires: true,
  })

  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      fetchApiKeys()
    }
  }, [isOpen, user])

  const fetchApiKeys = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/user/api-keys")
      const result = await response.json()

      if (result.success) {
        setApiKeys(result.data)
      } else {
        setError(result.error || "Failed to fetch API keys")
      }
    } catch (err) {
      setError("Failed to fetch API keys")
      console.error("Error fetching API keys:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateApiKey = async () => {
    if (!user || !createForm.name || createForm.permissions.length === 0) {
      setError("Please provide a name and select at least one permission")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createForm.name,
          permissions: createForm.permissions,
          expires_at: createForm.never_expires ? null : createForm.expires_at || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setNewKeyData({
          key: result.key,
          name: createForm.name,
          permissions: createForm.permissions,
          expires_at: createForm.never_expires ? null : createForm.expires_at || null,
        })
        setShowCreateForm(false)
        setCreateForm({
          name: "",
          permissions: [],
          expires_at: "",
          never_expires: true,
        })
        fetchApiKeys()
      } else {
        setError(result.error || "Failed to create API key")
      }
    } catch (err) {
      setError("Failed to create API key")
      console.error("Error creating API key:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleApiKey = async (keyId: string, isActive: boolean) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      })

      const result = await response.json()

      if (result.success) {
        fetchApiKeys()
      } else {
        setError(result.error || "Failed to update API key")
      }
    } catch (err) {
      setError("Failed to update API key")
      console.error("Error updating API key:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        fetchApiKeys()
      } else {
        setError(result.error || "Failed to delete API key")
      }
    } catch (err) {
      setError("Failed to delete API key")
      console.error("Error deleting API key:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setCreateForm((prev) => ({
        ...prev,
        permissions: [...prev.permissions, permission],
      }))
    } else {
      setCreateForm((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => p !== permission),
      }))
    }
  }

  const getStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.is_active) {
      return <Badge variant="secondary">Disabled</Badge>
    }

    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>
    }

    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            API Key Management
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* New API Key Display */}
            {newKeyData && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium text-green-800">API Key Created Successfully!</p>
                    <p className="text-sm text-green-700">
                      Please copy your API key now. You won't be able to see it again.
                    </p>
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono break-all">{newKeyData.key}</code>
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKeyData.key)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setNewKeyData(null)}>
                      I've saved my API key
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Create New API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Create New API Key</span>
                  <Button variant="outline" size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New API Key
                  </Button>
                </CardTitle>
              </CardHeader>

              {showCreateForm && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="keyName">API Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Production Integration"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <div key={permission.value} className="flex items-start space-x-2">
                          <Checkbox
                            id={permission.value}
                            checked={createForm.permissions.includes(permission.value)}
                            onCheckedChange={(checked) => handlePermissionChange(permission.value, checked as boolean)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor={permission.value}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="never_expires"
                        checked={createForm.never_expires}
                        onCheckedChange={(checked) =>
                          setCreateForm((prev) => ({ ...prev, never_expires: checked as boolean }))
                        }
                      />
                      <Label htmlFor="never_expires">Never expires</Label>
                    </div>

                    {!createForm.never_expires && (
                      <div>
                        <Label htmlFor="expires_at">Expiration Date</Label>
                        <Input
                          id="expires_at"
                          type="datetime-local"
                          value={createForm.expires_at}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateApiKey}
                      disabled={isLoading || !createForm.name || createForm.permissions.length === 0}
                    >
                      Create API Key
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Existing API Keys */}
            <Card>
              <CardHeader>
                <CardTitle>Your API Keys ({apiKeys.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading API keys...</p>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No API keys found</p>
                    <p className="text-sm text-gray-500 mt-1">Create your first API key to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{apiKey.name}</h3>
                            {getStatusBadge(apiKey)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleApiKey(apiKey.id, apiKey.is_active)}
                              disabled={isLoading}
                            >
                              {apiKey.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {apiKey.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Key:</span>
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{apiKey.key_preview}</code>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(apiKey.key_preview)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Permissions:</span>
                            <div className="flex flex-wrap gap-1">
                              {apiKey.permissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Created:</span>
                            <span>{format(new Date(apiKey.created_at), "MMM dd, yyyy")}</span>
                          </div>

                          {apiKey.expires_at && (
                            <div className="flex items-center justify-between">
                              <span>Expires:</span>
                              <span className={new Date(apiKey.expires_at) < new Date() ? "text-red-600" : ""}>
                                {format(new Date(apiKey.expires_at), "MMM dd, yyyy")}
                              </span>
                            </div>
                          )}

                          {apiKey.last_used_at && (
                            <div className="flex items-center justify-between">
                              <span>Last used:</span>
                              <span>{format(new Date(apiKey.last_used_at), "MMM dd, yyyy HH:mm")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Security Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Store API keys securely and never commit them to version control</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Use environment variables to store API keys in your applications</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Regularly rotate your API keys and disable unused ones</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Grant only the minimum permissions required for your use case</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Monitor API key usage and set expiration dates when appropriate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
