"use client"

import { useEffect, useState } from "react"
import { secureUserService } from "@/lib/secure-user-service"
import RingbaPixelSetup from "@/components/ringba-pixel-setup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function PixelSetupPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await secureUserService.getCurrentUser()
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error("Error getting current user:", error)
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the pixel setup</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ringba Pixel Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure pixel tracking for your Ringba campaigns to capture call events and conversions
        </p>
      </div>

      <RingbaPixelSetup userId={userId} />
    </div>
  )
}
