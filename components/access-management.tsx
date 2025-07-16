"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, MoreVertical, Edit, Trash2, Users, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SupabaseUser {
  id: string
  auth_id?: string
  full_name: string
  email: string
  role: "admin" | "user" | "agent"
  company_name?: string
  phone_number?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  last_login?: string
}

export function AccessManagement() {
  const [users, setUsers] = useState<SupabaseUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user" as "admin" | "user" | "agent",
    company_name: "",
    phone_number: "",
  })
  const { user: currentAuthUser } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        throw new Error(`Failed to fetch users: ${error.message}`)
      }

      console.log("Fetched users:", data)
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: "admin" | "user" | "agent") => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      setSuccess(null)

      // Validate required fields
      if (!formData.full_name || !formData.email) {
        throw new Error("Full name and email are required")
      }

      // Check if user already exists
      const { data: existingUser } = await supabase.from("users").select("email").eq("email", formData.email).single()

      if (existingUser) {
        throw new Error("User with this email already exists")
      }

      // Add to users table
      const { data, error: dbError } = await supabase
        .from("users")
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          company_name: formData.company_name || null,
          phone_number: formData.phone_number || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (dbError) {
        console.error("Database error:", dbError)
        throw new Error(`Failed to create user: ${dbError.message}`)
      }

      setSuccess("User created successfully!")
      setIsAddUserOpen(false)
      setFormData({
        full_name: "",
        email: "",
        role: "user",
        company_name: "",
        phone_number: "",
      })
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      setError(error instanceof Error ? error.message : "Failed to add user")
    }
  }

  const handleEditUser = (user: SupabaseUser) => {
    setCurrentUser(user)
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      company_name: user.company_name || "",
      phone_number: user.phone_number || "",
    })
    setIsEditUserOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setError(null)
      setSuccess(null)

      const { data, error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          company_name: formData.company_name || null,
          phone_number: formData.phone_number || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id)
        .select()
        .single()

      if (error) {
        console.error("Update error:", error)
        throw new Error(`Failed to update user: ${error.message}`)
      }

      setSuccess("User updated successfully!")
      setIsEditUserOpen(false)
      setCurrentUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      setError(error instanceof Error ? error.message : "Failed to update user")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return

    try {
      setError(null)
      setSuccess(null)

      // Deactivate user instead of deleting
      const { error } = await supabase
        .from("users")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        console.error("Deactivate error:", error)
        throw new Error(`Failed to deactivate user: ${error.message}`)
      }

      setSuccess("User deactivated successfully!")
      fetchUsers()
    } catch (error) {
      console.error("Error deactivating user:", error)
      setError(error instanceof Error ? error.message : "Failed to deactivate user")
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "agent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "user":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />
      case "agent":
        return <Users className="h-3 w-3" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading users from database...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Access Management</h2>
          <Badge variant="outline" className="ml-2">
            {users.length} Active Users
          </Badge>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with specific role permissions.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Admin - Full Access</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="agent">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Agent - Call Management</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center space-x-2">
                        <span>User - View Only</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Add User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">User Details</div>
            <div className="col-span-2">Role & Access</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone_number && <div className="text-xs text-gray-400">{user.phone_number}</div>}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge
                    className={`${getRoleBadgeColor(user.role)} font-medium uppercase text-xs flex items-center space-x-1 w-fit`}
                  >
                    {getRoleIcon(user.role)}
                    <span>{user.role}</span>
                  </Badge>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-900">{user.company_name || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">{formatDate(user.created_at)}</div>
                  {user.last_login && <div className="text-xs text-gray-400">Last: {formatDate(user.last_login)}</div>}
                </div>
                <div className="col-span-2 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                        Actions
                        <MoreVertical className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      {user.id !== currentAuthUser?.id && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deactivate User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new user to the system.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_company_name">Company Name</Label>
              <Input
                id="edit_company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone_number">Phone Number</Label>
              <Input
                id="edit_phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Admin - Full Access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="agent">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Agent - Call Management</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center space-x-2">
                      <span>User - View Only</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Update User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
