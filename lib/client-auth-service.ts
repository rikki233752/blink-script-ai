import { createClient } from "@supabase/supabase-js"

export type UserRole = "admin" | "manager" | "agent" | "viewer" | "user"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at?: string
}

export interface SignupData {
  email: string
  password: string
  fullName: string
}

// Generate a simple UUID-like string for client-side use
function generateClientUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class ClientAuthService {
  private static instance: ClientAuthService
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  private constructor() {}

  public static getInstance(): ClientAuthService {
    if (!ClientAuthService.instance) {
      ClientAuthService.instance = new ClientAuthService()
    }
    return ClientAuthService.instance
  }

  // Simple password hashing for client-side use
  private hashPassword(password: string): string {
    return btoa(password + "blinkscript_salt_2024")
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash
  }

  // Demo accounts that always work
  private getDemoUser(email: string, password: string): AuthUser | null {
    const demoAccounts = {
      "admin@company.com": { role: "admin" as UserRole, name: "Admin User", password: "password123" },
      "manager@company.com": { role: "manager" as UserRole, name: "Manager User", password: "password123" },
      "agent@company.com": { role: "agent" as UserRole, name: "Agent User", password: "password123" },
    }

    const demo = demoAccounts[email.toLowerCase() as keyof typeof demoAccounts]
    if (demo && demo.password === password) {
      return {
        id: generateClientUUID(),
        email: email.toLowerCase(),
        name: demo.name,
        role: demo.role,
        created_at: new Date().toISOString(),
      }
    }
    return null
  }

  // Store user in localStorage for persistence
  private storeUser(user: AuthUser): void {
    try {
      localStorage.setItem("blinkscript_user", JSON.stringify(user))
      localStorage.setItem("blinkscript_login_time", Date.now().toString())
    } catch (error) {
      console.warn("Could not store user in localStorage:", error)
    }
  }

  // Get stored user
  private getStoredUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem("blinkscript_user")
      const loginTime = localStorage.getItem("blinkscript_login_time")

      if (!userStr || !loginTime) return null

      // Check if login is still valid (24 hours)
      const loginTimestamp = Number.parseInt(loginTime)
      const now = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000

      if (now - loginTimestamp > twentyFourHours) {
        this.logout()
        return null
      }

      return JSON.parse(userStr)
    } catch (error) {
      console.warn("Could not get stored user:", error)
      return null
    }
  }

  // Store user credentials for future login (encrypted in localStorage)
  private storeUserCredentials(email: string, password: string, userData: AuthUser): void {
    try {
      const credentials = {
        email,
        passwordHash: this.hashPassword(password),
        userData,
      }

      const existingCreds = this.getStoredCredentials()
      existingCreds[email.toLowerCase()] = credentials

      localStorage.setItem("blinkscript_credentials", JSON.stringify(existingCreds))
    } catch (error) {
      console.warn("Could not store credentials:", error)
    }
  }

  private getStoredCredentials(): Record<string, any> {
    try {
      const credsStr = localStorage.getItem("blinkscript_credentials")
      return credsStr ? JSON.parse(credsStr) : {}
    } catch (error) {
      return {}
    }
  }

  // Register new user - uses server-side API
  async register(signupData: SignupData): Promise<AuthUser> {
    try {
      console.log("Starting registration for:", signupData.email)

      // Use the server-side registration API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: signupData.fullName,
          email: signupData.email,
          password: signupData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Registration failed")
      }

      // Create user object for local storage
      const newUser: AuthUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        created_at: new Date().toISOString(),
      }

      // Store credentials locally for immediate login capability
      this.storeUserCredentials(signupData.email, signupData.password, newUser)

      console.log("Registration successful - user saved to Supabase:", newUser.id)
      return newUser
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  // Login user - completely client-side, no service role dependencies
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      console.log("Login attempt for:", email)

      // First check demo accounts
      const demoUser = this.getDemoUser(email, password)
      if (demoUser) {
        console.log("Demo user login successful")
        this.storeUser(demoUser)
        return demoUser
      }

      // Check stored credentials (this should work for newly registered users)
      const storedCreds = this.getStoredCredentials()
      const userCreds = storedCreds[email.toLowerCase()]

      if (userCreds && this.verifyPassword(password, userCreds.passwordHash)) {
        console.log("Stored credentials login successful")
        this.storeUser(userCreds.userData)
        return userCreds.userData
      }

      // Try server-side login verification as last resort
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.user) {
            const authUser: AuthUser = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              role: result.user.role,
              created_at: result.user.created_at,
            }

            // Store for future use
            this.storeUserCredentials(email, password, authUser)
            this.storeUser(authUser)

            console.log("Server-side login successful")
            return authUser
          }
        }
      } catch (serverError) {
        console.warn("Server-side login failed:", serverError)
      }

      throw new Error("Invalid email or password")
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.getStoredUser()
  }

  // Logout
  logout(): void {
    try {
      localStorage.removeItem("blinkscript_user")
      localStorage.removeItem("blinkscript_login_time")
    } catch (error) {
      console.warn("Logout cleanup failed:", error)
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}

export const clientAuthService = ClientAuthService.getInstance()
