import { type NextRequest, NextResponse } from "next/server"
import { queueManager } from "@/lib/background-processing/queue-manager"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { jobType, inputData, priority = 5, callLogId } = await request.json()

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
      .select("id")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Add job to queue
    const result = await queueManager.addJob(userData.id, jobType, inputData, priority, callLogId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      message: "Job added to processing queue",
    })
  } catch (error) {
    console.error("❌ Error adding job to queue:", error)
    return NextResponse.json({ error: "Failed to add job to queue" }, { status: 500 })
  }
}

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

    const url = new URL(request.url)
    const status = url.searchParams.get("status") as any
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")

    // Get user's jobs
    const jobs = await queueManager.getUserJobs(userData.id, status, limit)

    // If admin, also get queue stats
    let queueStats = null
    if (userData.role === "admin") {
      queueStats = await queueManager.getQueueStats()
    }

    return NextResponse.json({
      success: true,
      jobs,
      queueStats,
    })
  } catch (error) {
    console.error("❌ Error getting queue data:", error)
    return NextResponse.json({ error: "Failed to get queue data" }, { status: 500 })
  }
}
