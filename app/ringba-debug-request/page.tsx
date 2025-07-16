"use client"

import { RingbaRequestDebugger } from "@/components/ringba-request-debugger"

export default function RingbaDebugRequestPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">RingBA API Request Debugger</h1>
        <p className="text-gray-600 mt-2">Debug and inspect the exact API requests being made to RingBA</p>
      </div>

      <RingbaRequestDebugger />
    </div>
  )
}
