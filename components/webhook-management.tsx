"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { WebhookService } from "@/lib/webhook-service"
import type { WebhookConfig } from "@/types"
import { WebhookStorage } from "@/lib/webhook-storage"

const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
    name: "",
    url: "",
    events: [],
    enabled: true,
    secret: "",
    retryAttempts: 3,
    timeout: 30000,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = () => {
    const webhooks = WebhookStorage.getWebhooks()
    setWebhooks(webhooks)

    // Update webhook service
    const webhookService = WebhookService.getInstance()
    webhookService.setWebhooks(webhooks)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewWebhook({ ...newWebhook, [name]: value })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    if (checked) {
      setNewWebhook({
        ...newWebhook,
        events: [...(newWebhook.events || []), name],
      })
    } else {
      setNewWebhook({
        ...newWebhook,
        events: (newWebhook.events || []).filter((event) => event !== name),
      })
    }
  }

  const handleSave = () => {
    if (!newWebhook.name || !newWebhook.url) {
      setError("Name and URL are required")
      return
    }

    const webhook: WebhookConfig = {
      ...newWebhook,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastTriggered: undefined,
    }

    WebhookStorage.addWebhook(webhook)
    loadWebhooks()
    setIsDialogOpen(false)
    setNewWebhook({
      name: "",
      url: "",
      events: [],
      enabled: true,
      secret: "",
      retryAttempts: 3,
      timeout: 30000,
    })
    setError("")
  }

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Add Webhook</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Webhook</DialogTitle>
            <DialogDescription>Create a new webhook to listen for events.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={newWebhook.name || ""}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                type="text"
                id="url"
                name="url"
                value={newWebhook.url || ""}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secret" className="text-right">
                Secret
              </Label>
              <Input
                type="text"
                id="secret"
                name="secret"
                value={newWebhook.secret || ""}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="retryAttempts" className="text-right">
                Retry Attempts
              </Label>
              <Input
                type="number"
                id="retryAttempts"
                name="retryAttempts"
                value={newWebhook.retryAttempts || 3}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeout" className="text-right">
                Timeout (ms)
              </Label>
              <Input
                type="number"
                id="timeout"
                name="timeout"
                value={newWebhook.timeout || 30000}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Events</Label>
              <div className="col-span-3 flex flex-col">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="order.created"
                    name="order.created"
                    checked={(newWebhook.events || []).includes("order.created")}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange({
                        target: { name: "order.created", checked },
                      } as any)
                    }
                  />
                  <Label htmlFor="order.created">Order Created</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="order.updated"
                    name="order.updated"
                    checked={(newWebhook.events || []).includes("order.updated")}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange({
                        target: { name: "order.updated", checked },
                      } as any)
                    }
                  />
                  <Label htmlFor="order.updated">Order Updated</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="order.deleted"
                    name="order.deleted"
                    checked={(newWebhook.events || []).includes("order.deleted")}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange({
                        target: { name: "order.deleted", checked },
                      } as any)
                    }
                  />
                  <Label htmlFor="order.deleted">Order Deleted</Label>
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Triggered</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks.map((webhook) => (
            <TableRow key={webhook.id}>
              <TableCell>{webhook.name}</TableCell>
              <TableCell>{webhook.url}</TableCell>
              <TableCell>{webhook.events?.join(", ") || "All"}</TableCell>
              <TableCell>{webhook.createdAt}</TableCell>
              <TableCell>{webhook.lastTriggered || "Never"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { WebhookManagement }
export default WebhookManagement
