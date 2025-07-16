"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { BlinkscriptLogin } from "@/components/blinkscript-login"

function LoginContent() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("")
  const [prefillEmail, setPrefillEmail] = useState("")

  useEffect(() => {
    const messageParam = searchParams.get("message")
    const emailParam = searchParams.get("email")

    if (messageParam) {
      setMessage(messageParam)
    }

    if (emailParam) {
      setPrefillEmail(emailParam)
    }
  }, [searchParams])

  return (
    <div>
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          {message}
        </div>
      )}
      <BlinkscriptLogin prefillEmail={prefillEmail} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
