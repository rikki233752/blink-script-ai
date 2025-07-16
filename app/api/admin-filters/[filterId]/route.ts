import { type NextRequest, NextResponse } from "next/server"
import { adminFilterService } from "@/lib/admin-filters/filter-service"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { filterId: string } }) {
  try {
    const { filterId } = params
    const updates = await request.json()

    // Get user from auth
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin
    const adminUserId = await adminFilterService.getAdminUserId(user.id)
    if (!adminUserId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Update filter
    const result = await adminFilterService.updateFilter(filterId, updates)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin filter updated successfully",
    })
  } catch (error) {
    console.error("❌ Error updating admin filter:", error)
    return NextResponse.json({ error: "Failed to update admin filter" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { filterId: string } }) {
  try {
    const { filterId } = params

    // Get user from auth
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin
    const adminUserId = await adminFilterService.getAdminUserId(user.id)
    if (!adminUserId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Delete filter
    const result = await adminFilterService.deleteFilter(filterId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin filter deleted successfully",
    })
  } catch (error) {
    console.error("❌ Error deleting admin filter:", error)
    return NextResponse.json({ error: "Failed to delete admin filter" }, { status: 500 })
  }
}
