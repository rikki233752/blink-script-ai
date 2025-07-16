import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Get user from users table
    const { data: userProfiles, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)

    if (userError || !userProfiles || userProfiles.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const userProfile = userProfiles[0]

    // Simple password hashing (same as in the service)
    const hashPassword = (pwd: string): string => {
      return btoa(pwd + "blinkscript_salt")
    }

    // Verify password hash
    if (userProfile.password_hash) {
      const hashedPassword = hashPassword(password)
      if (hashedPassword === userProfile.password_hash) {
        // Password is correct, return user data
        return NextResponse.json({
          success: true,
          user: userProfile,
        })
      }
    } else {
      // No password hash exists, create one and allow login (for existing users)
      const hashedPassword = hashPassword(password)
      await supabase.from("users").update({ password_hash: hashedPassword }).eq("id", userProfile.id)

      return NextResponse.json({
        success: true,
        user: userProfile,
      })
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  } catch (error) {
    console.error("Error in auth verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
