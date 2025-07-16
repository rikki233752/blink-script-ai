import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json({
        success: false,
        error: "Account ID is required",
      })
    }

    // Validate account ID format
    const accountIdPattern = /^RA[a-zA-Z0-9]{30,}$/
    const isValidFormat = accountIdPattern.test(accountId)

    // Try to determine the correct format
    const suggestions = []

    if (!accountId.startsWith("RA")) {
      suggestions.push("Account ID should start with 'RA'")
    }

    if (accountId.length < 32) {
      suggestions.push("Account ID seems too short (should be 32+ characters)")
    }

    if (accountId.length > 50) {
      suggestions.push("Account ID seems too long (typically 32-40 characters)")
    }

    // Test if the account exists (without authentication first)
    const testUrls = [
      `https://api.ringba.com/v2/accounts/${accountId}`,
      `https://api.ringba.com/v2/${accountId}`,
      `https://api.ringba.com/v1/accounts/${accountId}`,
    ]

    const testResults = []

    for (const url of testUrls) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        testResults.push({
          url,
          status: response.status,
          exists: response.status !== 404,
          needsAuth: response.status === 401 || response.status === 403,
        })
      } catch (error) {
        testResults.push({
          url,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      accountId,
      isValidFormat,
      suggestions,
      testResults,
      recommendation: isValidFormat
        ? "Account ID format looks correct"
        : "Account ID format may be incorrect. Check RingBA dashboard for the exact format.",
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to validate account ID",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
