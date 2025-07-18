import { type NextRequest, NextResponse } from "next/server"
import { ApiKeyService } from "@/lib/api-key-service"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const keyId = params.id

    // Get user from session
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const updatedKey = await ApiKeyService.updateApiKey(userId, keyId, body)

    return NextResponse.json({
      success: true,
      data: updatedKey,
    })
  } catch (error) {
    console.error("Error updating API key:", error)
    return NextResponse.json({ success: false, error: "Failed to update API key" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const keyId = params.id

    // Get user from session
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    await ApiKeyService.deleteApiKey(userId, keyId)

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json({ success: false, error: "Failed to delete API key" }, { status: 500 })
  }
}
