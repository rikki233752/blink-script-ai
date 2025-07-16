// Define types
export type UserRole = "admin" | "manager" | "agent" | "viewer"

export interface User {
  id: string
  email: string
  role: UserRole
  name?: string
  company?: string
}

interface UserWithPassword extends User {
  password: string
}

interface LoginCredentials {
  email: string
  password: string
  role?: UserRole
}

// Initial mock users - these should always work
const INITIAL_MOCK_USERS: UserWithPassword[] = [
  {
    id: "demo-admin-1",
    email: "admin@company.com",
    role: "admin",
    name: "Admin User",
    password: "password123",
  },
  {
    id: "demo-manager-1",
    email: "manager@company.com",
    role: "manager",
    name: "Manager User",
    password: "password123",
  },
  {
    id: "demo-agent-1",
    email: "agent@company.com",
    role: "agent",
    name: "Agent User",
    password: "password123",
  },
]

// Mock authentication service
export class MockAuthService {
  private static instance: MockAuthService
  private users: UserWithPassword[]

  private constructor() {
    // Always start with demo users
    this.users = [...INITIAL_MOCK_USERS]

    // Try to load additional users from localStorage
    const storedUsers = this.loadUsers()
    if (storedUsers) {
      // Merge stored users with demo users, avoiding duplicates
      storedUsers.forEach((storedUser) => {
        const existingIndex = this.users.findIndex((u) => u.email.toLowerCase() === storedUser.email.toLowerCase())
        if (existingIndex === -1) {
          this.users.push(storedUser)
        }
      })
    }
  }

  public static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService()
    }
    return MockAuthService.instance
  }

  private loadUsers(): UserWithPassword[] | null {
    if (typeof window === "undefined") return null

    try {
      const usersJson = localStorage.getItem("mockUsers")
      return usersJson ? JSON.parse(usersJson) : null
    } catch (error) {
      console.error("Error loading users from localStorage:", error)
      return null
    }
  }

  private saveUsers(): void {
    if (typeof window === "undefined") return

    try {
      // Only save non-demo users to localStorage
      const nonDemoUsers = this.users.filter((user) => !this.isDemoUser(user.email))
      localStorage.setItem("mockUsers", JSON.stringify(nonDemoUsers))
    } catch (error) {
      console.error("Error saving users to localStorage:", error)
    }
  }

  private isDemoUser(email: string): boolean {
    const demoEmails = ["admin@company.com", "manager@company.com", "agent@company.com"]
    return demoEmails.includes(email.toLowerCase())
  }

  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    const { email, password } = credentials

    // Find user by email
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    // Check if user exists and password is correct
    if (!user || user.password !== password) {
      throw new Error("Invalid login credentials")
    }

    // Create a copy without the password
    const userWithoutPassword: User = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }

    // Store user in localStorage for persistence (only if not demo user)
    if (!this.isDemoUser(email)) {
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
    }

    return userWithoutPassword
  }

  async addUser(user: UserWithPassword): Promise<void> {
    // Check if user with this email already exists
    const existingUser = this.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase())
    if (existingUser && !this.isDemoUser(existingUser.email)) {
      throw new Error("User with this email already exists")
    }

    // Don't add if it's a demo user (they're always present)
    if (!this.isDemoUser(user.email)) {
      // Add the new user
      this.users.push(user)
      // Save updated users list
      this.saveUsers()
    }
  }

  logout(): void {
    localStorage.removeItem("currentUser")
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const userJson = localStorage.getItem("currentUser")
    if (!userJson) return null

    try {
      return JSON.parse(userJson) as User
    } catch {
      return null
    }
  }
}
