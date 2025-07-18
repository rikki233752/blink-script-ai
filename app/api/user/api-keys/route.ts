import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ApiKeyService } from "@/lib/api-key-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Get user from session (you'll need to implement proper auth middleware)
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // For now, we'll extract user ID from a simple token
    // In production, you should use proper JWT validation
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const apiKeys = await ApiKeyService.getUserApiKeys(userId)

    return NextResponse.json({
      success: true,
      data: apiKeys,
    })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, permissions, expires_at } = body

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ success: false, error: "Name and permissions are required" }, { status: 400 })
    }

    // Get user from session
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const result = await ApiKeyService.createApiKey(userId, {
      name,
      permissions,
      expires_at: expires_at || null,
    })

    return NextResponse.json({
      success: true,
      data: result.apiKey,
      key: result.key,
    })
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json({ success: false, error: "Failed to create API key" }, { status: 500 })
  }
}
