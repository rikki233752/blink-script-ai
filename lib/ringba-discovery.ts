/**
 * RingBA API Discovery Utility
 *
 * This utility helps discover the correct RingBA API structure and endpoints.
 */

export async function discoverRingbaApi(apiKey: string) {
  const results = {
    baseUrl: null as string | null,
    apiVersion: null as string | null,
    authMethod: null as string | null,
    accountId: null as string | null,
    endpoints: [] as string[],
    error: null as string | null,
  }

  try {
    // Try to discover the base API structure
    const baseEndpoints = ["https://api.ringba.com/v2", "https://api.ringba.com/v1", "https://api.ringba.com"]

    const authMethods = [
      {
        name: "Bearer",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      {
        name: "API-Key",
        headers: { "API-Key": apiKey },
      },
      {
        name: "X-API-Key",
        headers: { "X-API-Key": apiKey },
      },
    ]

    // First, try to find a working base endpoint
    let foundWorking = false

    for (const baseUrl of baseEndpoints) {
      if (foundWorking) break

      for (const auth of authMethods) {
        try {
          const response = await fetch(`${baseUrl}/ping`, {
            method: "GET",
            headers: {
              ...auth.headers,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })

          if (response.ok) {
            results.baseUrl = baseUrl
            results.authMethod = auth.name
            results.apiVersion = baseUrl.includes("v2") ? "v2" : baseUrl.includes("v1") ? "v1" : "unknown"
            foundWorking = true
            break
          }
        } catch (error) {
          // Continue trying other combinations
        }
      }
    }

    // If we found a working base endpoint, try to discover account ID
    if (results.baseUrl && results.authMethod) {
      const authHeaders = authMethods.find((a) => a.name === results.authMethod)?.headers || {}

      try {
        // Try to list accounts
        const response = await fetch(`${results.baseUrl}/accounts`, {
          method: "GET",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          // Extract account ID from response if possible
          if (Array.isArray(data) && data.length > 0) {
            results.accountId = data[0].id || data[0].accountId || null
            results.endpoints.push(`${results.baseUrl}/accounts/${results.accountId}`)
          }
        }
      } catch (error) {
        // Continue with discovery
      }

      // Try to discover available endpoints
      const commonEndpoints = ["campaigns", "calllogs", "calls", "numbers", "targets", "buyers", "publishers"]

      for (const endpoint of commonEndpoints) {
        try {
          const response = await fetch(`${results.baseUrl}/${endpoint}`, {
            method: "GET",
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })

          if (response.ok || response.status === 401) {
            // 401 means the endpoint exists but requires authentication
            results.endpoints.push(`${results.baseUrl}/${endpoint}`)
          }
        } catch (error) {
          // Continue checking other endpoints
        }
      }
    } else {
      results.error = "Could not find a working base endpoint"
    }

    return results
  } catch (error) {
    results.error = error instanceof Error ? error.message : "Unknown error during API discovery"
    return results
  }
}
