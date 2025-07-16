import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password } = await request.json()

    console.log("Testing signup for:", { fullName, email })

    // Use service role client for database operations
    const supabase = getServiceSupabase()

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .limit(1)

    console.log("Existing user check:", { existingUsers, checkError })

    if (checkError) {
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "Database error occurred", details: checkError }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Simple password hashing (same as client-side)
    const hashPassword = (password: string): string => {
      return btoa(password + "blinkscript_salt_2024")
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      full_name: fullName,
      email: email.toLowerCase(),
      role: "user",
      is_active: true,
      password_hash: hashPassword(password),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Attempting to insert user:", newUser)

    // Insert user into database
    const { data, error } = await supabase.from("users").insert([newUser]).select().single()

    console.log("Insert result:", { data, error })

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json(
        {
          error: "Failed to create user account",
          details: error,
          user: newUser,
        },
        { status: 500 },
      )
    }

    console.log("User created successfully in Supabase:", data.id)

    // Verify the user was actually created
    const { data: verifyUser, error: verifyError } = await supabase.from("users").select("*").eq("id", data.id).single()

    console.log("Verification result:", { verifyUser, verifyError })

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully! User saved to Supabase.",
        user: {
          id: data.id,
          email: data.email,
          name: data.full_name,
          role: data.role,
        },
        verification: verifyUser,
        debug: {
          insertedUser: newUser,
          supabaseResponse: data,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in test signup:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
