export type UserRole = "admin" | "agent" | "user"

export interface User {
  id: string
  email: string
  role: UserRole
  name?: string
  avatar?: string
  department?: string
  lastLogin?: Date
  isActive?: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  role?: UserRole
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  clearError: () => void
}
