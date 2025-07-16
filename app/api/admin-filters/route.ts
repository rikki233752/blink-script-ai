import { type NextRequest, NextResponse } from "next/server"
import { adminFilterService } from "@/lib/admin-filters/filter-service"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
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

    // Get admin filters
    const filters = await adminFilterService.getAdminFilters(adminUserId)

    return NextResponse.json({
      success: true,
      filters,
    })
  } catch (error) {
    console.error("❌ Error getting admin filters:", error)
    return NextResponse.json({ error: "Failed to get admin filters" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filterName, filterType, filterValue, operator, appliesTo } = await request.json()

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

    // Create filter
    const result = await adminFilterService.createFilter(
      adminUserId,
      filterName,
      filterType,
      filterValue,
      operator,
      appliesTo,
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      filterId: result.filterId,
      message: "Admin filter created successfully",
    })
  } catch (error) {
    console.error("❌ Error creating admin filter:", error)
    return NextResponse.json({ error: "Failed to create admin filter" }, { status: 500 })
  }
}
