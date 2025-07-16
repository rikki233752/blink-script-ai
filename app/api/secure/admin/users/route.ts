import { type NextRequest, NextResponse } from "next/server"
import { secureUserService } from "@/lib/secure-user-service"

export async function GET() {
  try {
    // RLS will automatically check if user is admin
    const users = await secureUserService.getAllUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users (admin):", error)
    return NextResponse.json({ error: "Access denied or failed to fetch users" }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    // RLS will automatically check if user is admin
    const newUser = await secureUserService.createUser(userData)

    if (!newUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 400 })
    }

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error("Error creating user (admin):", error)
    return NextResponse.json({ error: "Access denied or failed to create user" }, { status: 403 })
  }
}
