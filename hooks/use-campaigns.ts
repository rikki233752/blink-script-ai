"use client"

import { useState, useEffect, useCallback } from "react"
import type { Campaign } from "@/app/api/campaigns/route"

interface UseCampaignsOptions {
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

interface UseCampaignsReturn {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createCampaign: (data: any) => Promise<Campaign | null>
}

export function useCampaigns(options: UseCampaignsOptions = {}): UseCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.search) params.append("search", options.search)
      if (options.status) params.append("status", options.status)
      if (options.sortBy) params.append("sortBy", options.sortBy)
      if (options.sortOrder) params.append("sortOrder", options.sortOrder)

      const response = await fetch(`/api/campaigns?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch campaigns")
      }

      setCampaigns(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [options.search, options.status, options.sortBy, options.sortOrder])

  const createCampaign = useCallback(
    async (data: any): Promise<Campaign | null> => {
      try {
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create campaign")
        }

        // Refetch campaigns to update the list
        await fetchCampaigns()

        return result.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create campaign")
        return null
      }
    },
    [fetchCampaigns],
  )

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
  }
}
