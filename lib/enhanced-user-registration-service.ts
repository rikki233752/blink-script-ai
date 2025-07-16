import { getServiceSupabase } from "@/lib/supabase-client"
import { createClient } from "@supabase/supabase-js"
import { MockAuthService } from "@/lib/mock-auth-service"

export type SignupFormData = {
  email: string
  password: string
  fullName: string
}

export type SupabaseUser = {
  id: string
  auth_id?: string | null
  created_at: string
  updated_at: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  password_hash?: string
}

export class EnhancedUserRegistrationService {
  private static instance: EnhancedUserRegistrationService
  private mockAuthService: MockAuthService

  private constructor() {
    this.mockAuthService = MockAuthService.getInstance()
  }

  public static getInstance(): EnhancedUserRegistrationService {
    if (!EnhancedUserRegistrationService.instance) {
      EnhancedUserRegistrationService.instance = new EnhancedUserRegistrationService()
    }
    return EnhancedUserRegistrationService.instance
  }

  // Get client-side Supabase for all operations
  private getClientSupabase() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  // Demo accounts that should always work
  private isDemoAccount(email: string): boolean {
    const demoEmails = ["admin@company.com", "manager@company.com", "agent@company.com"]
    return demoEmails.includes(email.toLowerCase())
  }

  // Simple password hashing (in production, use bcrypt or similar)
  private hashPassword(password: string): string {
    return btoa(password + "blinkscript_salt")
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash
  }

  async registerUser(userData: SignupFormData): Promise<SupabaseUser> {
    try {
      const supabase = getServiceSupabase()

      // Check if user already exists in our users table
      const { data: existingUsers } = await supabase.from("users").select("id").eq("email", userData.email)

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("User with this email already exists")
      }

      // Create user profile with hashed password for fallback authentication
      const newUser = {
        full_name: userData.fullName,
        email: userData.email,
        role: "user",
        is_active: true,
        auth_id: null,
        password_hash: this.hashPassword(userData.password),
      }

      console.log("Creating user profile with password hash...")
      const { data: userProfile, error: userError } = await supabase.from("users").insert([newUser]).select().single()

      if (userError) {
        console.error("Error creating user profile:", userError)
        throw new Error(`Failed to create user profile: ${userError.message}`)
      }

      console.log("User profile created successfully:", userProfile.id)

      // Also add to mock auth service for consistency
      try {
        await this.mockAuthService.addUser({
          id: userProfile.id,
          email: userData.email,
          name: userData.fullName,
          role: "viewer",
          password: userData.password,
        })
        console.log("User added to mock auth service")
      } catch (mockError) {
        console.warn("Failed to add to mock auth service:", mockError)
      }

      return userProfile
    } catch (error) {
      console.error("Error in registerUser:", error)
      throw error
    }
  }

  async loginUser(email: string, password: string): Promise<SupabaseUser | null> {
    try {
      console.log("Login attempt for:", email)

      // First, try demo accounts (these should always work)
      if (this.isDemoAccount(email)) {
        console.log("Demo account detected, using mock auth service")
        try {
          const mockUser = await this.mockAuthService.login({ email, password })
          if (mockUser) {
            // Convert mock user to SupabaseUser format
            const demoUser: SupabaseUser = {
              id: mockUser.id,
              auth_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              full_name: mockUser.name || mockUser.email.split("@")[0],
              email: mockUser.email,
              role: mockUser.role,
              is_active: true,
            }
            console.log("Demo account login successful")
            return demoUser
          }
        } catch (mockError) {
          console.warn("Mock auth failed for demo account:", mockError)
        }
      }

      // For regular users, try mock auth service first (since they were added during signup)
      console.log("Trying mock auth service for regular user...")
      try {
        const mockUser = await this.mockAuthService.login({ email, password })
        if (mockUser) {
          console.log("Mock auth login successful")

          // Also try to get the full profile from Supabase if available
          try {
            const clientSupabase = this.getClientSupabase()
            const { data: userProfiles } = await clientSupabase
              .from("users")
              .select("*")
              .eq("email", email)
              .eq("is_active", true)

            if (userProfiles && userProfiles.length > 0) {
              console.log("Found Supabase profile, using that")
              return userProfiles[0]
            }
          } catch (supabaseError) {
            console.warn("Could not fetch Supabase profile, using mock user:", supabaseError)
          }

          // Convert mock user to SupabaseUser format
          const fallbackUser: SupabaseUser = {
            id: mockUser.id,
            auth_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            full_name: mockUser.name || mockUser.email.split("@")[0],
            email: mockUser.email,
            role: mockUser.role,
            is_active: true,
          }
          return fallbackUser
        }
      } catch (mockError) {
        console.warn("Mock auth failed:", mockError)
      }

      // If mock auth fails, try direct password hash verification
      console.log("Trying direct password hash verification...")
      try {
        // Create a simple API call to verify the user
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        if (response.ok) {
          const userData = await response.json()
          if (userData.user) {
            console.log("Direct verification successful")
            return userData.user
          }
        }
      } catch (apiError) {
        console.warn("API verification failed:", apiError)
      }

      console.log("All authentication methods failed")
      throw new Error("Invalid email or password")
    } catch (error) {
      console.error("Error in loginUser:", error)
      throw error
    }
  }
}

// Export singleton instance
export const enhancedUserRegistrationService = EnhancedUserRegistrationService.getInstance()
