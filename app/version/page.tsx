"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { VersionDisplay } from "@/components/version-display"

export default function VersionPage() {
  return (
    <ProtectedRoute>
      <VersionDisplay />
    </ProtectedRoute>
  )
}
