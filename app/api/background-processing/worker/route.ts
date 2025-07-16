import { type NextRequest, NextResponse } from "next/server"
import { workerService } from "@/lib/background-processing/worker-service"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { action, intervalMs = 5000 } = await request.json()

    // Check if user is admin
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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Handle worker actions
    switch (action) {
      case "start":
        workerService.start(intervalMs)
        return NextResponse.json({
          success: true,
          message: "Background worker started",
          status: workerService.getStatus(),
        })

      case "stop":
        workerService.stop()
        return NextResponse.json({
          success: true,
          message: "Background worker stopped",
          status: workerService.getStatus(),
        })

      case "status":
        return NextResponse.json({
          success: true,
          status: workerService.getStatus(),
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Error managing worker:", error)
    return NextResponse.json({ error: "Failed to manage worker" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    status: workerService.getStatus(),
  })
}
