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

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Start with base query
    let query = supabase.from("campaigns").select(`
        *,
        call_logs (
          id,
          agent_name,
          publisher_name,
          call_duration,
          campaign_status,
          created_at
        )
      `)

    // Apply RLS - users see only their data
    if (userData.role !== "admin") {
      query = query.eq("user_id", userData.id)
    }

    // Apply admin filters if user is admin
    if (userData.role === "admin") {
      query = await adminFilterService.applyFiltersToQuery(query, userData.id, "campaigns")
    }

    // Execute query
    const { data: campaigns, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching campaigns:", error)
      return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
    }

    // Log filter application for debugging
    if (userData.role === "admin") {
      const activeFilters = await adminFilterService.getActiveFilters(userData.id, "campaigns")
      console.log(`🔍 Applied ${activeFilters.length} admin filters to campaigns query`)
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || [],
      filtersApplied: userData.role === "admin",
    })
  } catch (error) {
    console.error("❌ Error in filtered campaigns endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
