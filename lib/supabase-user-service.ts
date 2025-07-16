import { supabase } from "@/lib/supabase-client"
import type { SignupFormData } from "@/lib/user-registration-service"

export interface SupabaseUser {
  id?: string
  auth_id?: string
  full_name: string
  email: string
  role: string
  avatar_url?: string
  phone_number?: string
  company_name?: string
  department?: string
  is_active?: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
}

export class SupabaseUserService {
  private static instance: SupabaseUserService

  private constructor() {}

  public static getInstance(): SupabaseUserService {
    if (!SupabaseUserService.instance) {
      SupabaseUserService.instance = new SupabaseUserService()
    }
    return SupabaseUserService.instance
  }

  async createUser(userData: SignupFormData): Promise<SupabaseUser> {
    try {
      // Create user without auth_id to avoid foreign key constraint
      const newUser: Omit<SupabaseUser, "id" | "created_at" | "updated_at" | "auth_id"> = {
        full_name: userData.fullName,
        email: userData.email,
        role: "user",
        is_active: true,
      }

      const { data, error } = await supabase.from("users").insert([newUser]).select().single()

      if (error) {
        console.error("Error creating user in Supabase:", error)
        throw new Error(`Failed to create user: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in createUser:", error)
      throw error
    }
  }

  async getUserByEmail(email: string): Promise<SupabaseUser | null> {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("email", email).eq("is_active", true).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null
        }
        console.error("Error fetching user from Supabase:", error)
        throw new Error(`Failed to fetch user: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in getUserByEmail:", error)
      return null
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", userId)

      if (error) {
        console.error("Error updating last login:", error)
        // Don't throw error for login update failures
      }
    } catch (error) {
      console.error("Error in updateLastLogin:", error)
      // Don't throw error for login update failures
    }
  }

  async updateUserProfile(userId: string, updates: Partial<SupabaseUser>): Promise<void> {
    try {
      const { error } = await supabase.from("users").update(updates).eq("id", userId)

      if (error) {
        console.error("Error updating user profile:", error)
        throw new Error(`Failed to update profile: ${error.message}`)
      }
    } catch (error) {
      console.error("Error in updateUserProfile:", error)
      throw error
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from("users").update({ is_active: false }).eq("id", userId)

      if (error) {
        console.error("Error deactivating user:", error)
        throw new Error(`Failed to deactivate user: ${error.message}`)
      }
    } catch (error) {
      console.error("Error in deactivateUser:", error)
      throw error
    }
  }
}

export const supabaseUserService = SupabaseUserService.getInstance()
