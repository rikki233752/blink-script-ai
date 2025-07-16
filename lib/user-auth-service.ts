import { supabase } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  company?: string
  phone?: string
  plan: "free" | "pro" | "enterprise"
  is_active: boolean
  created_at: string
  updated_at: string
  settings: {
    notifications: boolean
    theme: "light" | "dark"
    timezone: string
  }
}

export interface UserIntegration {
  id: string
  user_id: string
  integration_type: "ringba" | "twilio" | "salesforce"
  credentials: Record<string, any>
  is_active: boolean
  last_sync: string | null
  created_at: string
}

export class UserAuthService {
  private static instance: UserAuthService

  static getInstance(): UserAuthService {
    if (!UserAuthService.instance) {
      UserAuthService.instance = new UserAuthService()
    }
    return UserAuthService.instance
  }

  // User Registration
  async registerUser(userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    company?: string
    phone?: string
  }): Promise<{ user: User; profile: UserProfile }> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user")

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .insert({
          auth_id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          company: userData.company,
          phone: userData.phone,
          plan: "free",
          is_active: true,
          settings: {
            notifications: true,
            theme: "light",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        })
        .select()
        .single()

      if (profileError) throw profileError

      return { user: authData.user, profile }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  // User Login
  async loginUser(email: string, password: string): Promise<{ user: User; profile: UserProfile }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Login failed")

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single()

      if (profileError) throw profileError

      // Update last login
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("auth_id", authData.user.id)

      return { user: authData.user, profile }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  // Get Current User Profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile, error } = await supabase.from("users").select("*").eq("auth_id", user.id).single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error("Get profile error:", error)
      return null
    }
  }

  // Update User Profile
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_id", user.id)
        .select()
        .single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  // User-specific data access methods
  async getUserCalls(userId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("ringba_call_logs")
        .select(`
          *,
          ringba_campaigns(*)
        `)
        .eq("user_id", userId)
        .order("call_start_time", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Get user calls error:", error)
      return []
    }
  }

  async getUserCampaigns(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("ringba_campaigns")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Get user campaigns error:", error)
      return []
    }
  }

  async getUserAnalytics(userId: string, dateRange?: { start: string; end: string }): Promise<any> {
    try {
      let query = supabase
        .from("ai_analysis")
        .select(`
          *,
          ringba_call_logs(*)
        `)
        .eq("user_id", userId)

      if (dateRange) {
        query = query.gte("created_at", dateRange.start).lte("created_at", dateRange.end)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Get user analytics error:", error)
      return []
    }
  }

  // Integration Management
  async saveUserIntegration(integration: Omit<UserIntegration, "id" | "created_at">): Promise<UserIntegration> {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .insert({
          ...integration,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Save integration error:", error)
      throw error
    }
  }

  async getUserIntegrations(userId: string): Promise<UserIntegration[]> {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Get integrations error:", error)
      return []
    }
  }

  // Password Reset
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }
}

export const userAuthService = UserAuthService.getInstance()
