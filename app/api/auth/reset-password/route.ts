import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Find and validate reset token
    const { data: resetTokens, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used")
      .eq("token", token)
      .eq("used", false)
      .limit(1)

    if (tokenError) {
      console.error("Token lookup error:", tokenError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!resetTokens || resetTokens.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const resetToken = resetTokens[0]

    // Check if token is expired
    if (new Date() > new Date(resetToken.expires_at)) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    // Hash the new password (same method as registration)
    const hashPassword = (password: string): string => {
      return btoa(password + "blinkscript_salt_2024")
    }

    const hashedPassword = hashPassword(password)

    // Update user's password
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resetToken.user_id)

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", resetToken.id)

    if (markUsedError) {
      console.error("Token marking error:", markUsedError)
      // Don't fail the request - password was already updated
    }

    // Invalidate all other reset tokens for this user
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("user_id", resetToken.user_id)
      .eq("used", false)

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Validate the token without using it
    const { data: resetTokens, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("expires_at, used")
      .eq("token", token)
      .limit(1)

    if (tokenError) {
      console.error("Token validation error:", tokenError)
      return NextResponse.json({ valid: false, error: "Database error" }, { status: 500 })
    }

    if (!resetTokens || resetTokens.length === 0) {
      return NextResponse.json({ valid: false, error: "Invalid reset token" }, { status: 400 })
    }

    const resetToken = resetTokens[0]

    if (resetToken.used) {
      return NextResponse.json({ valid: false, error: "Reset token has already been used" }, { status: 400 })
    }

    // Check if token has expired
    if (new Date() > new Date(resetToken.expires_at)) {
      return NextResponse.json({ valid: false, error: "Reset token has expired" }, { status: 400 })
    }

    return NextResponse.json({ valid: true, message: "Token is valid" })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
