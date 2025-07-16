import type { User, LoginCredentials, UserRole } from "./auth-types"

// Simulated user database - in production, this would be a real database
const users: User[] = [
  {
    id: "1",
    email: "admin@company.com",
    name: "Admin User",
    role: "admin",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "IT",
    lastLogin: new Date(),
    isActive: true,
  },
  {
    id: "2",
    email: "manager@company.com",
    name: "John Manager",
    role: "manager",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "Sales",
    lastLogin: new Date(),
    isActive: true,
  },
  {
    id: "3",
    email: "agent@company.com",
    name: "Sarah Agent",
    role: "agent",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "Customer Service",
    lastLogin: new Date(),
    isActive: true,
  },
  {
    id: "4",
    email: "supervisor@company.com",
    name: "Mike Supervisor",
    role: "supervisor",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "Quality Assurance",
    lastLogin: new Date(),
    isActive: true,
  },
]

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = users.find(
      (u) => u.email === credentials.email && u.isActive && (!credentials.role || u.role === credentials.role),
    )

    if (!user) {
      throw new Error("Invalid credentials or user not found")
    }

    // In production, verify password hash here
    if (credentials.password !== "password123") {
      throw new Error("Invalid password")
    }

    // Update last login
    user.lastLogin = new Date()
    this.currentUser = user

    // Store in localStorage for persistence
    localStorage.setItem("auth_user", JSON.stringify(user))
    localStorage.setItem("auth_token", "mock_jwt_token_" + user.id)

    return user
  }

  logout(): void {
    this.currentUser = null
    localStorage.removeItem("auth_user")
    localStorage.removeItem("auth_token")
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser
    }

    // Try to restore from localStorage
    try {
      const storedUser = localStorage.getItem("auth_user")
      const storedToken = localStorage.getItem("auth_token")

      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser)
        return this.currentUser
      }
    } catch (error) {
      console.error("Error restoring user session:", error)
    }

    return null
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser()
    return user ? roles.includes(user.role) : false
  }

  getPermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      admin: ["all"],
      manager: ["view_all_campaigns", "create_campaigns", "manage_agents", "view_reports"],
      supervisor: ["view_campaigns", "manage_agents", "view_reports"],
      agent: ["view_own_campaigns", "view_own_calls"],
    }

    return permissions[role] || []
  }
}
