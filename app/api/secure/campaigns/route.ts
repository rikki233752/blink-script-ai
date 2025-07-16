import { NextResponse } from "next/server"
import { secureUserService } from "@/lib/secure-user-service"

export async function GET() {
  try {
    const campaigns = await secureUserService.getUserCampaigns()
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}
