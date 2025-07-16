import { supabase, getServiceSupabase } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

export interface SecureUserProfile {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  company?: string
  phone?: string
  role: "admin" | "agent" | "viewer"
  plan: "free" | "pro" | "enterprise"
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  settings: {
    notifications: boolean
    theme: "light" | "dark"
    timezone: string
  }
}

export interface SecureRingbaAccount {
  id: string
  user_id: string
  account_id: string
  api_key: string
  account_name: string
  is_active: boolean
  last_sync: string | null
  created_at: string
  updated_at: string
}

export interface SecureCampaign {
  id: string
  user_id: string
  ringba_campaign_id: string
  name: string
  description?: string
  status: "active" | "paused" | "completed"
  created_at: string
  updated_at: string
}

export interface SecureCallLog {
  id: string
  user_id: string
  campaign_id: string
  ringba_call_id: string
  caller_number: string
  target_number: string
  call_start_time: string
  call_end_time?: string
  duration: number
  status: string
  disposition?: string
  recording_url?: string
  transcription?: string
  ai_analysis_id?: string
  created_at: string
}

export interface SecureAIAnalysis {
  id: string
  user_id: string
  call_log_id: string
  transcript: string
  summary: string
  sentiment: "positive" | "negative" | "neutral"
  key_points: string[]
  action_items: string[]
  quality_score: number
  compliance_flags: string[]
  created_at: string
}

class SecureUserService {
  private static instance: SecureUserService

  static getInstance(): SecureUserService {
    if (!SecureUserService.instance) {
      SecureUserService.instance = new SecureUserService()
    }
    return SecureUserService.instance
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  // Get current user profile with RLS enforcement
  async getCurrentUserProfile(): Promise<SecureUserProfile | null> {
    try {
      const { data, error } = await supabase.from("users").select("*").single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  // Update user profile (RLS ensures user can only update their own)
  async updateUserProfile(updates: Partial<SecureUserProfile>): Promise<SecureUserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  // Get user's Ringba accounts (RLS enforced)
  async getUserRingbaAccounts(): Promise<SecureRingbaAccount[]> {
    try {
      const { data, error } = await supabase
        .from("ringba_accounts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting Ringba accounts:", error)
      return []
    }
  }

  // Create Ringba account (user_id automatically set to auth.uid())
  async createRingbaAccount(
    accountData: Omit<SecureRingbaAccount, "id" | "user_id" | "created_at" | "updated_at">,
  ): Promise<SecureRingbaAccount | null> {
    try {
      const { data, error } = await supabase
        .from("ringba_accounts")
        .insert({
          ...accountData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating Ringba account:", error)
      throw error
    }
  }

  // Get user's campaigns (RLS enforced)
  async getUserCampaigns(): Promise<SecureCampaign[]> {
    try {
      const { data, error } = await supabase
        .from("ringba_campaigns")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting campaigns:", error)
      return []
    }
  }

  // Get user's call logs (RLS enforced)
  async getUserCallLogs(limit = 50, offset = 0): Promise<SecureCallLog[]> {
    try {
      const { data, error } = await supabase
        .from("ringba_call_logs")
        .select(`
          *,
          ringba_campaigns(name),
          ai_analysis(*)
        `)
        .order("call_start_time", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting call logs:", error)
      return []
    }
  }

  // Get user's AI analysis (RLS enforced)
  async getUserAIAnalysis(callLogId?: string): Promise<SecureAIAnalysis[]> {
    try {
      let query = supabase.from("ai_analysis").select("*").order("created_at", { ascending: false })

      if (callLogId) {
        query = query.eq("call_log_id", callLogId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting AI analysis:", error)
      return []
    }
  }

  // Create AI analysis (user_id automatically enforced by RLS)
  async createAIAnalysis(
    analysisData: Omit<SecureAIAnalysis, "id" | "user_id" | "created_at">,
  ): Promise<SecureAIAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from("ai_analysis")
        .insert({
          ...analysisData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating AI analysis:", error)
      throw error
    }
  }

  // Get user analytics with date filtering
  async getUserAnalytics(dateRange?: { start: string; end: string }): Promise<{
    totalCalls: number
    totalCampaigns: number
    avgCallDuration: number
    sentimentBreakdown: Record<string, number>
    qualityScoreAvg: number
  }> {
    try {
      let callLogsQuery = supabase.from("ringba_call_logs").select("duration, ai_analysis(sentiment, quality_score)")

      if (dateRange) {
        callLogsQuery = callLogsQuery.gte("call_start_time", dateRange.start).lte("call_start_time", dateRange.end)
      }

      const [callLogsResult, campaignsResult] = await Promise.all([
        callLogsQuery,
        supabase.from("ringba_campaigns").select("id"),
      ])

      if (callLogsResult.error) throw callLogsResult.error
      if (campaignsResult.error) throw campaignsResult.error

      const callLogs = callLogsResult.data || []
      const campaigns = campaignsResult.data || []

      const totalCalls = callLogs.length
      const totalCampaigns = campaigns.length
      const avgCallDuration =
        totalCalls > 0 ? callLogs.reduce((sum, call) => sum + (call.duration || 0), 0) / totalCalls : 0

      const sentimentBreakdown = callLogs.reduce(
        (acc, call) => {
          const sentiment = call.ai_analysis?.[0]?.sentiment || "neutral"
          acc[sentiment] = (acc[sentiment] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const qualityScores = callLogs
        .map((call) => call.ai_analysis?.[0]?.quality_score)
        .filter((score) => score !== undefined && score !== null)

      const qualityScoreAvg =
        qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0

      return {
        totalCalls,
        totalCampaigns,
        avgCallDuration,
        sentimentBreakdown,
        qualityScoreAvg,
      }
    } catch (error) {
      console.error("Error getting user analytics:", error)
      return {
        totalCalls: 0,
        totalCampaigns: 0,
        avgCallDuration: 0,
        sentimentBreakdown: {},
        qualityScoreAvg: 0,
      }
    }
  }

  // Admin-only functions (with role checking)
  async getAllUsers(): Promise<SecureUserProfile[]> {
    try {
      // This will only work if the current user is admin due to RLS policies
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting all users (admin only):", error)
      return []
    }
  }

  async createUser(
    userData: Omit<SecureUserProfile, "id" | "created_at" | "updated_at">,
  ): Promise<SecureUserProfile | null> {
    try {
      // This will only work if the current user is admin due to RLS policies
      const serviceSupabase = getServiceSupabase()

      // Create auth user first
      const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
        email: userData.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        email_confirm: true,
      })

      if (authError) throw authError

      // Create user profile
      const { data, error } = await supabase
        .from("users")
        .insert({
          ...userData,
          auth_id: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating user (admin only):", error)
      throw error
    }
  }

  // Check if current user has admin role
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const profile = await this.getCurrentUserProfile()
      return profile?.role === "admin"
    } catch (error) {
      console.error("Error checking admin status:", error)
      return false
    }
  }

  // Get user role
  async getCurrentUserRole(): Promise<string | null> {
    try {
      const profile = await this.getCurrentUserProfile()
      return profile?.role || null
    } catch (error) {
      console.error("Error getting user role:", error)
      return null
    }
  }
}

export const secureUserService = SecureUserService.getInstance()
