import type { Campaign, Call, QualityReview } from "./schema"

// In-memory storage for server-side compatibility
const inMemoryStore: {
  campaigns: Campaign[]
  calls: Call[]
  quality_reviews: QualityReview[]
} = {
  campaigns: [],
  calls: [],
  quality_reviews: [],
}

// Flag to track if sample data has been initialized
let sampleDataInitialized = false

class CampaignService {
  // Get data from the appropriate storage
  private getData<T>(key: string): T[] {
    // Server-side: use in-memory store
    if (typeof window === "undefined") {
      return (inMemoryStore[key as keyof typeof inMemoryStore] as T[]) || []
    }

    // Client-side: try localStorage
    try {
      const storageKey = `onscript_${key}`
      const data = localStorage.getItem(storageKey)
      if (!data) return []

      const parsed = JSON.parse(data)

      // Handle date conversions
      if (key === "campaigns") {
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          startDate: new Date(item.startDate),
          endDate: item.endDate ? new Date(item.endDate) : undefined,
        }))
      }

      if (key === "calls") {
        return parsed.map((item: any) => ({
          ...item,
          startTime: new Date(item.startTime),
          endTime: item.endTime ? new Date(item.endTime) : undefined,
        }))
      }

      if (key === "quality_reviews") {
        return parsed.map((item: any) => ({
          ...item,
          reviewedAt: new Date(item.reviewedAt),
        }))
      }

      return parsed
    } catch (error) {
      console.error(`Error retrieving data for ${key}:`, error)
      return []
    }
  }

  // Save data to the appropriate storage
  private saveData<T>(key: string, data: T[]): void {
    // Server-side: use in-memory store
    if (typeof window === "undefined") {
      inMemoryStore[key as keyof typeof inMemoryStore] = data as any
      return
    }

    // Client-side: use localStorage
    try {
      const storageKey = `onscript_${key}`
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.error(`Error saving data for ${key}:`, error)
    }
  }

  // Campaign methods
  async getCampaigns(filters?: {
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
  }): Promise<{ campaigns: Campaign[]; total: number }> {
    try {
      let campaigns = this.getData<Campaign>("campaigns")

      // Apply filters
      if (filters?.search) {
        campaigns = campaigns.filter((c) => c.name.toLowerCase().includes(filters.search!.toLowerCase()))
      }

      if (filters?.status && filters.status !== "all") {
        campaigns = campaigns.filter((c) => c.status === filters.status)
      }

      // Sort
      if (filters?.sortBy) {
        campaigns.sort((a, b) => {
          const aVal = a[filters.sortBy as keyof Campaign]
          const bVal = b[filters.sortBy as keyof Campaign]

          if (aVal instanceof Date && bVal instanceof Date) {
            return filters.sortOrder === "desc" ? bVal.getTime() - aVal.getTime() : aVal.getTime() - bVal.getTime()
          }

          if (typeof aVal === "string" && typeof bVal === "string") {
            return filters.sortOrder === "desc" ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
          }

          if (typeof aVal === "number" && typeof bVal === "number") {
            return filters.sortOrder === "desc" ? bVal - aVal : aVal - bVal
          }

          return 0
        })
      }

      const total = campaigns.length

      // Paginate
      if (filters?.page && filters?.limit) {
        const start = (filters.page - 1) * filters.limit
        campaigns = campaigns.slice(start, start + filters.limit)
      }

      return { campaigns, total }
    } catch (error) {
      console.error("Error getting campaigns:", error)
      throw new Error(`Failed to get campaigns: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    try {
      const campaigns = this.getData<Campaign>("campaigns")
      return campaigns.find((c) => c.id === id) || null
    } catch (error) {
      console.error(`Error getting campaign ${id}:`, error)
      throw new Error(`Failed to get campaign: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async createCampaign(data: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Promise<Campaign> {
    try {
      const campaigns = this.getData<Campaign>("campaigns")

      const newCampaign: Campaign = {
        ...data,
        id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      campaigns.push(newCampaign)
      this.saveData("campaigns", campaigns)

      return newCampaign
    } catch (error) {
      console.error("Error creating campaign:", error)
      throw new Error(`Failed to create campaign: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
    try {
      const campaigns = this.getData<Campaign>("campaigns")
      const index = campaigns.findIndex((c) => c.id === id)

      if (index === -1) return null

      campaigns[index] = {
        ...campaigns[index],
        ...data,
        updatedAt: new Date(),
      }

      this.saveData("campaigns", campaigns)
      return campaigns[index]
    } catch (error) {
      console.error(`Error updating campaign ${id}:`, error)
      throw new Error(`Failed to update campaign: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async deleteCampaign(id: string): Promise<boolean> {
    try {
      const campaigns = this.getData<Campaign>("campaigns")
      const filteredCampaigns = campaigns.filter((c) => c.id !== id)

      if (filteredCampaigns.length === campaigns.length) return false

      this.saveData("campaigns", filteredCampaigns)
      return true
    } catch (error) {
      console.error(`Error deleting campaign ${id}:`, error)
      throw new Error(`Failed to delete campaign: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async deleteCampaignWithRelatedData(id: string): Promise<boolean> {
    try {
      console.log(`Starting deletion process for campaign: ${id}`)

      // For server-side (API routes), we need to actually delete from the data source
      if (typeof window === "undefined") {
        // Get all data first for logging
        const campaigns = this.getData<Campaign>("campaigns")
        const calls = this.getData<Call>("calls")
        const reviews = this.getData<QualityReview>("quality_reviews")

        const campaignToDelete = campaigns.find((c) => c.id === id)
        if (!campaignToDelete) {
          console.warn(`Campaign ${id} not found in data source`)
          return false
        }

        const relatedCalls = calls.filter((c) => c.campaignId === id)
        const relatedReviews = reviews.filter((r) => r.campaignId === id)

        console.log(`Found campaign: ${campaignToDelete.name}`)
        console.log(`Related calls: ${relatedCalls.length}`)
        console.log(`Related reviews: ${relatedReviews.length}`)

        // Delete quality reviews first (foreign key dependency)
        const filteredReviews = reviews.filter((r) => r.campaignId !== id)
        this.saveData("quality_reviews", filteredReviews)
        console.log(`Deleted ${relatedReviews.length} quality reviews`)

        // Delete calls
        const filteredCalls = calls.filter((c) => c.campaignId !== id)
        this.saveData("calls", filteredCalls)
        console.log(`Deleted ${relatedCalls.length} calls`)

        // Finally delete the campaign
        const filteredCampaigns = campaigns.filter((c) => c.id !== id)
        this.saveData("campaigns", filteredCampaigns)
        console.log(`Deleted campaign: ${campaignToDelete.name}`)

        // Force re-initialization of sample data flag to ensure data persistence
        sampleDataInitialized = false

        return true
      }

      // For client-side, also delete from localStorage
      const campaigns = this.getData<Campaign>("campaigns")
      const calls = this.getData<Call>("calls")
      const reviews = this.getData<QualityReview>("quality_reviews")

      const campaignExists = campaigns.some((c) => c.id === id)
      if (!campaignExists) {
        console.warn(`Campaign ${id} not found in client storage`)
        return false
      }

      // Delete from all related tables
      const filteredReviews = reviews.filter((r) => r.campaignId !== id)
      const filteredCalls = calls.filter((c) => c.campaignId !== id)
      const filteredCampaigns = campaigns.filter((c) => c.id !== id)

      this.saveData("quality_reviews", filteredReviews)
      this.saveData("calls", filteredCalls)
      this.saveData("campaigns", filteredCampaigns)

      console.log(`Successfully deleted campaign ${id} from client storage`)
      return true
    } catch (error) {
      console.error(`Error deleting campaign with related data ${id}:`, error)
      throw new Error(
        `Failed to delete campaign with related data: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  // Call methods
  async getCalls(
    campaignId?: string,
    filters?: {
      startDate?: Date
      endDate?: Date
      agentId?: string
      status?: string
    },
  ): Promise<Call[]> {
    try {
      let calls = this.getData<Call>("calls")

      if (campaignId) {
        calls = calls.filter((c) => c.campaignId === campaignId)
      }

      if (filters?.startDate) {
        calls = calls.filter((c) => new Date(c.startTime) >= filters.startDate!)
      }

      if (filters?.endDate) {
        calls = calls.filter((c) => new Date(c.startTime) <= filters.endDate!)
      }

      if (filters?.agentId) {
        calls = calls.filter((c) => c.agentId === filters.agentId)
      }

      if (filters?.status) {
        calls = calls.filter((c) => c.status === filters.status)
      }

      return calls
    } catch (error) {
      console.error("Error getting calls:", error)
      throw new Error(`Failed to get calls: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async createCall(data: Omit<Call, "id">): Promise<Call> {
    try {
      const calls = this.getData<Call>("calls")

      const newCall: Call = {
        ...data,
        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      calls.push(newCall)
      this.saveData("calls", calls)

      return newCall
    } catch (error) {
      console.error("Error creating call:", error)
      throw new Error(`Failed to create call: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Quality Review methods
  async getQualityReviews(campaignId?: string): Promise<QualityReview[]> {
    try {
      let reviews = this.getData<QualityReview>("quality_reviews")

      if (campaignId) {
        reviews = reviews.filter((r) => r.campaignId === campaignId)
      }

      return reviews
    } catch (error) {
      console.error("Error getting quality reviews:", error)
      throw new Error(`Failed to get quality reviews: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async createQualityReview(data: Omit<QualityReview, "id">): Promise<QualityReview> {
    try {
      const reviews = this.getData<QualityReview>("quality_reviews")

      const newReview: QualityReview = {
        ...data,
        id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      reviews.push(newReview)
      this.saveData("quality_reviews", reviews)

      return newReview
    } catch (error) {
      console.error("Error creating quality review:", error)
      throw new Error(`Failed to create quality review: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Analytics methods
  async getCampaignMetrics(campaignId: string, dateRange: { from: Date; to: Date }) {
    try {
      const calls = await this.getCalls(campaignId, {
        startDate: dateRange.from,
        endDate: dateRange.to,
      })

      const reviews = await this.getQualityReviews(campaignId)

      const totalCalls = calls.length
      const completedCalls = calls.filter((c) => c.status === "completed").length
      const avgCallDuration =
        calls.length > 0
          ? calls.reduce((sum, call) => sum + call.duration, 0) / calls.length / 60 // in minutes
          : 0

      const qualityScores = calls.filter((c) => c.qualityScore).map((c) => c.qualityScore!)
      const avgScore =
        qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0

      const qcApproved = reviews.filter((r) => r.status === "approved").length
      const qcRejected = reviews.filter((r) => r.status === "rejected").length
      const qcPending = reviews.filter((r) => r.status === "pending").length

      const conversions = calls.filter((c) => c.disposition === "sale").length
      const conversionRate = totalCalls > 0 ? (conversions / totalCalls) * 100 : 0

      return {
        totalCalls,
        completedCalls,
        avgCallDuration,
        avgScore,
        qcApproved,
        qcRejected,
        qcPending,
        conversions,
        conversionRate,
        audioHours: calls.reduce((sum, call) => sum + call.duration, 0) / 3600, // in hours
        skipped: calls.filter((c) => c.status === "missed" || c.status === "no-answer").length,
      }
    } catch (error) {
      console.error(`Error getting campaign metrics for ${campaignId}:`, error)
      throw new Error(`Failed to get campaign metrics: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getAllCampaignMetrics(dateRange: { from: Date; to: Date }) {
    try {
      const campaigns = await this.getCampaigns()
      const allCalls = await this.getCalls(undefined, {
        startDate: dateRange.from,
        endDate: dateRange.to,
      })
      const allReviews = await this.getQualityReviews()

      const totalCalls = allCalls.length
      const completedCalls = allCalls.filter((c) => c.status === "completed").length
      const avgCallDuration =
        allCalls.length > 0 ? allCalls.reduce((sum, call) => sum + call.duration, 0) / allCalls.length / 60 : 0

      const qualityScores = allCalls.filter((c) => c.qualityScore).map((c) => c.qualityScore!)
      const avgScore =
        qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0

      const qcApproved = allReviews.filter((r) => r.status === "approved").length
      const qcRejected = allReviews.filter((r) => r.status === "rejected").length

      const conversions = allCalls.filter((c) => c.disposition === "sale").length
      const revenue = conversions * 150 // Assuming $150 per conversion
      const cpa = totalCalls > 0 ? revenue / totalCalls : 0

      return {
        totalAverageScore: avgScore,
        accountHours: allCalls.reduce((sum, call) => sum + call.duration, 0) / 3600,
        totalCalls,
        avgCallDuration,
        commissionable: conversions,
        cpa,
        revenue,
        skipped: allCalls.filter((c) => c.status === "missed" || c.status === "no-answer").length,
        completed: completedCalls,
        qcApproved,
        qcRejected,
      }
    } catch (error) {
      console.error("Error getting all campaign metrics:", error)
      throw new Error(`Failed to get all campaign metrics: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Add this method to force refresh of campaign data
  async refreshCampaignData(): Promise<void> {
    try {
      // Clear the initialization flag to force data reload
      sampleDataInitialized = false

      // Re-initialize sample data if needed
      await this.initializeSampleData()

      console.log("Campaign data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing campaign data:", error)
      throw new Error(`Failed to refresh campaign data: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Initialize with sample data if empty
  async initializeSampleData(): Promise<void> {
    try {
      // Only initialize once per server instance
      if (sampleDataInitialized) {
        return
      }

      const campaigns = this.getData<Campaign>("campaigns")

      if (campaigns.length === 0) {
        // Create sample campaigns
        const sampleCampaigns: Campaign[] = [
          {
            id: "camp_1",
            name: "Healthcare Lead Generation",
            description: "Outbound calls for healthcare insurance leads",
            status: "active",
            type: "lead-generation",
            targetCalls: 1000,
            budget: 50000,
            startDate: new Date("2025-01-01"),
            createdAt: new Date("2025-01-01"),
            updatedAt: new Date("2025-01-01"),
            createdBy: "admin",
            settings: {
              qualityThreshold: 4.0,
              autoApproval: false,
              recordingEnabled: true,
              transcriptionEnabled: true,
            },
          },
          {
            id: "camp_2",
            name: "Medicare Advantage Campaign",
            description: "Medicare advantage enrollment campaign",
            status: "active",
            type: "sales",
            targetCalls: 500,
            budget: 25000,
            startDate: new Date("2025-02-01"),
            createdAt: new Date("2025-02-01"),
            updatedAt: new Date("2025-02-01"),
            createdBy: "admin",
            settings: {
              qualityThreshold: 4.5,
              autoApproval: false,
              recordingEnabled: true,
              transcriptionEnabled: true,
            },
          },
        ]

        this.saveData("campaigns", sampleCampaigns)

        // Create sample calls
        const sampleCalls: Call[] = []
        const now = new Date()

        for (let i = 0; i < 100; i++) {
          const callDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
          const duration = Math.floor(Math.random() * 1800) + 60 // 1-30 minutes

          sampleCalls.push({
            id: `call_${i + 1}`,
            campaignId: Math.random() > 0.5 ? "camp_1" : "camp_2",
            agentId: `agent_${Math.floor(Math.random() * 5) + 1}`,
            phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            duration,
            status: ["completed", "missed", "busy", "no-answer"][Math.floor(Math.random() * 4)] as any,
            disposition: ["sale", "no-sale", "callback", "not-interested"][Math.floor(Math.random() * 4)] as any,
            qualityScore: Math.random() * 2 + 3, // 3-5 range
            sentiment: ["positive", "negative", "neutral"][Math.floor(Math.random() * 3)] as any,
            startTime: callDate,
            endTime: new Date(callDate.getTime() + duration * 1000),
            metadata: {
              leadSource: ["Google Ads", "Facebook", "Direct Mail", "Referral"][Math.floor(Math.random() * 4)],
              notes: "Sample call data",
            },
          })
        }

        this.saveData("calls", sampleCalls)

        // Create sample quality reviews
        const sampleReviews: QualityReview[] = sampleCalls
          .filter(() => Math.random() > 0.3) // 70% of calls have reviews
          .map((call, index) => ({
            id: `qr_${index + 1}`,
            callId: call.id,
            campaignId: call.campaignId,
            reviewerId: "qa_1",
            status: ["approved", "rejected", "pending"][Math.floor(Math.random() * 3)] as any,
            score: Math.random() * 2 + 3,
            feedback: "Quality review feedback",
            criteria: {
              greeting: Math.random() * 2 + 3,
              productKnowledge: Math.random() * 2 + 3,
              objectionHandling: Math.random() * 2 + 3,
              closing: Math.random() * 2 + 3,
              compliance: Math.random() * 2 + 3,
            },
            reviewedAt: new Date(),
          }))

        this.saveData("quality_reviews", sampleReviews)

        // Mark as initialized
        sampleDataInitialized = true
      }
    } catch (error) {
      console.error("Error initializing sample data:", error)
      throw new Error(`Failed to initialize sample data: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

export const campaignService = new CampaignService()
