"use client"

import { CallActivityFeed } from "@/components/call-activity-feed"

export default function CallsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Call Activity</h1>
      <CallActivityFeed />
    </div>
  )
}
