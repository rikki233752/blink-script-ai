import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // For now, return mock data since we're focusing on RingBA integration
    // You can later integrate with your user authentication system
    const mockCallLogs = [
      {
        id: "1",
        campaignId: "campaign1",
        callerId: "+1234567890",
        duration: 120,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        campaignId: "campaign1",
        callerId: "+1987654321",
        duration: 85,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json(mockCallLogs)
  } catch (error) {
    console.error("Error fetching call logs:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
