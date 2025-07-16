import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Use service role client for database operations
    const supabase = getServiceSupabase()

    // Simple password hashing (same as client-side)
    const hashPassword = (password: string): string => {
      return btoa(password + "blinkscript_salt_2024")
    }

    // Find user in database
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .limit(1)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    if (!user.password_hash || hashPassword(password) !== user.password_hash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
