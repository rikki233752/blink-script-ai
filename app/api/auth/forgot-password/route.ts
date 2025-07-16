import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Find user by email
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .limit(1)

    if (userError) {
      console.error("Database error:", userError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    // Always return success to prevent email enumeration
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, we've sent a password reset link.",
      })
    }

    const user = users[0]

    // Generate reset token
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database
    const { error: tokenError } = await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    if (tokenError) {
      console.error("Token creation error:", tokenError)
      return NextResponse.json({ error: "Failed to create reset token" }, { status: 500 })
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`

    // For now, just log the reset URL (no email dependency)
    console.log("🔗 Password Reset Link Generated:")
    console.log(resetUrl)
    console.log("📧 Reset requested for:", email)
    console.log("💡 To enable email sending, configure email service separately")

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a password reset link.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
