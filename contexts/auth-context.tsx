"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { clientAuthService, type AuthUser } from "@/lib/client-auth-service"

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  clearError: () => void
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

// Action types
type AuthAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; payload: AuthUser | null }
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: AuthUser }
  | { type: "LOGIN_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, isLoading: true, error: null }
    case "INIT_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      }
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null }
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case "LOGIN_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: "INIT_START" })

      try {
        const currentUser = clientAuthService.getCurrentUser()
        dispatch({ type: "INIT_SUCCESS", payload: currentUser })

        // Only redirect to login if no user and not already on auth pages
        if (!currentUser && typeof window !== "undefined") {
          const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(window.location.pathname)
          if (!isAuthPage) {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error)
        dispatch({ type: "INIT_SUCCESS", payload: null })
      }
    }

    initializeAuth()
  }, [router])

  // Memoized login function - uses only client auth service
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch({ type: "LOGIN_START" })
      try {
        const user = await clientAuthService.login(credentials.email, credentials.password)
        dispatch({ type: "LOGIN_SUCCESS", payload: user })

        // Redirect to home page
        router.push("/")
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Login failed"
        dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
        throw error
      }
    },
    [router],
  )

  // Memoized logout function
  const logout = useCallback(() => {
    clientAuthService.logout()
    dispatch({ type: "LOGOUT" })
    router.push("/login")
  }, [router])

  // Memoized clear error function
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" })
  }, [])

  // Context value
  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
