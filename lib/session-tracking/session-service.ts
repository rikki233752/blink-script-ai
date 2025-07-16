import { supabase, getServiceSupabase } from "@/lib/supabase-client"
import { UAParser } from "ua-parser-js"

export interface LoginActivityData {
  id?: string
  user_id: string
  auth_id?: string
  session_id?: string
  login_time?: string
  logout_time?: string
  ip_address?: string
  user_agent?: string
  device_type?: string
  browser?: string
  operating_system?: string
  location_country?: string
  location_city?: string
  location_region?: string
  is_mobile?: boolean
  login_method?: string
  login_status?: string
  failure_reason?: string
  session_duration?: string
  is_active?: boolean
  last_activity?: string
}

export interface SecurityEvent {
  id?: string
  user_id?: string
  event_type: string
  event_description?: string
  ip_address?: string
  user_agent?: string
  risk_score?: number
  metadata?: Record<string, any>
}

export interface DeviceInfo {
  device_type: string
  browser: string
  operating_system: string
  is_mobile: boolean
  user_agent: string
}

export class SessionTrackingService {
  private static instance: SessionTrackingService

  static getInstance(): SessionTrackingService {
    if (!SessionTrackingService.instance) {
      SessionTrackingService.instance = new SessionTrackingService()
    }
    return SessionTrackingService.instance
  }

  // Parse user agent to extract device information
  parseUserAgent(userAgent: string): DeviceInfo {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      device_type: result.device.type || "desktop",
      browser: `${result.browser.name || "Unknown"} ${result.browser.version || ""}`.trim(),
      operating_system: `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim(),
      is_mobile: result.device.type === "mobile" || result.device.type === "tablet",
      user_agent: userAgent,
    }
  }

  // Get IP geolocation (you can integrate with services like ipapi.co)
  async getLocationFromIP(ipAddress: string): Promise<{
    country?: string
    city?: string
    region?: string
  }> {
    try {
      // Using a free IP geolocation service
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`)
      if (response.ok) {
        const data = await response.json()
        return {
          country: data.country_name,
          city: data.city,
          region: data.region,
        }
      }
    } catch (error) {
      console.error("Error getting location from IP:", error)
    }
    return {}
  }

  // Record successful login
  async recordLogin(data: {
    userId: string
    authId?: string
    sessionId?: string
    ipAddress?: string
    userAgent?: string
    loginMethod?: string
  }): Promise<LoginActivityData | null> {
    try {
      const serviceSupabase = getServiceSupabase()
      const deviceInfo = data.userAgent ? this.parseUserAgent(data.userAgent) : null
      const locationInfo = data.ipAddress ? await this.getLocationFromIP(data.ipAddress) : {}

      const loginData: Partial<LoginActivityData> = {
        user_id: data.userId,
        auth_id: data.authId,
        session_id: data.sessionId || crypto.randomUUID(),
        login_time: new Date().toISOString(),
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        login_method: data.loginMethod || "email",
        login_status: "success",
        is_active: true,
        last_activity: new Date().toISOString(),
        ...deviceInfo,
        ...locationInfo,
      }

      const { data: loginActivity, error } = await serviceSupabase
        .from("login_activity")
        .insert([loginData])
        .select()
        .single()

      if (error) {
        console.error("Error recording login:", error)
        return null
      }

      // Record security event
      await this.recordSecurityEvent({
        user_id: data.userId,
        event_type: "login_success",
        event_description: `User logged in successfully from ${data.ipAddress}`,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        risk_score: 0,
        metadata: {
          login_method: data.loginMethod,
          device_info: deviceInfo,
          location_info: locationInfo,
        },
      })

      return loginActivity
    } catch (error) {
      console.error("Error in recordLogin:", error)
      return null
    }
  }

  // Record failed login attempt
  async recordFailedLogin(data: {
    userId?: string
    email?: string
    ipAddress?: string
    userAgent?: string
    failureReason: string
    loginMethod?: string
  }): Promise<void> {
    try {
      const serviceSupabase = getServiceSupabase()
      const deviceInfo = data.userAgent ? this.parseUserAgent(data.userAgent) : null
      const locationInfo = data.ipAddress ? await this.getLocationFromIP(data.ipAddress) : {}

      // Calculate risk score based on failure patterns
      const riskScore = await this.calculateRiskScore(data.ipAddress, data.email)

      if (data.userId) {
        const loginData: Partial<LoginActivityData> = {
          user_id: data.userId,
          login_time: new Date().toISOString(),
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          login_method: data.loginMethod || "email",
          login_status: "failed",
          failure_reason: data.failureReason,
          is_active: false,
          ...deviceInfo,
          ...locationInfo,
        }

        await serviceSupabase.from("login_activity").insert([loginData])
      }

      // Record security event
      await this.recordSecurityEvent({
        user_id: data.userId,
        event_type: "login_failed",
        event_description: `Failed login attempt: ${data.failureReason}`,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        risk_score: riskScore,
        metadata: {
          email: data.email,
          failure_reason: data.failureReason,
          login_method: data.loginMethod,
          device_info: deviceInfo,
          location_info: locationInfo,
        },
      })
    } catch (error) {
      console.error("Error in recordFailedLogin:", error)
    }
  }

  // Record logout
  async recordLogout(sessionId: string): Promise<void> {
    try {
      const serviceSupabase = getServiceSupabase()
      const logoutTime = new Date().toISOString()

      const { error } = await serviceSupabase
        .from("login_activity")
        .update({
          logout_time: logoutTime,
          is_active: false,
          updated_at: logoutTime,
        })
        .eq("session_id", sessionId)
        .eq("is_active", true)

      if (error) {
        console.error("Error recording logout:", error)
      }
    } catch (error) {
      console.error("Error in recordLogout:", error)
    }
  }

  // Update last activity
  async updateLastActivity(sessionId: string): Promise<void> {
    try {
      const serviceSupabase = getServiceSupabase()

      const { error } = await serviceSupabase
        .from("login_activity")
        .update({
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("is_active", true)

      if (error) {
        console.error("Error updating last activity:", error)
      }
    } catch (error) {
      console.error("Error in updateLastActivity:", error)
    }
  }

  // Record security event
  async recordSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const serviceSupabase = getServiceSupabase()

      const { error } = await serviceSupabase.from("security_events").insert([
        {
          ...event,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error("Error recording security event:", error)
      }
    } catch (error) {
      console.error("Error in recordSecurityEvent:", error)
    }
  }

  // Calculate risk score based on patterns
  private async calculateRiskScore(ipAddress?: string, email?: string): Promise<number> {
    try {
      const serviceSupabase = getServiceSupabase()
      let riskScore = 0

      // Check for multiple failed attempts from same IP
      if (ipAddress) {
        const { count: ipFailures } = await serviceSupabase
          .from("security_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "login_failed")
          .eq("ip_address", ipAddress)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        riskScore += Math.min((ipFailures || 0) * 10, 50)
      }

      // Check for multiple failed attempts for same email
      if (email) {
        const { count: emailFailures } = await serviceSupabase
          .from("security_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "login_failed")
          .like("metadata->email", `%${email}%`)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        riskScore += Math.min((emailFailures || 0) * 15, 60)
      }

      return Math.min(riskScore, 100)
    } catch (error) {
      console.error("Error calculating risk score:", error)
      return 0
    }
  }

  // Get user's login history
  async getUserLoginHistory(userId: string, limit = 50): Promise<LoginActivityData[]> {
    try {
      const { data, error } = await supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", userId)
        .order("login_time", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error getting login history:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserLoginHistory:", error)
      return []
    }
  }

  // Get active sessions for user
  async getUserActiveSessions(userId: string): Promise<LoginActivityData[]> {
    try {
      const { data, error } = await supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("login_time", { ascending: false })

      if (error) {
        console.error("Error getting active sessions:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserActiveSessions:", error)
      return []
    }
  }

  // Terminate session
  async terminateSession(sessionId: string): Promise<boolean> {
    try {
      const serviceSupabase = getServiceSupabase()

      const { error } = await serviceSupabase
        .from("login_activity")
        .update({
          logout_time: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)

      return !error
    } catch (error) {
      console.error("Error terminating session:", error)
      return false
    }
  }

  // Get security events for user
  async getUserSecurityEvents(userId: string, limit = 100): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from("security_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error getting security events:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserSecurityEvents:", error)
      return []
    }
  }
}

export const sessionTrackingService = SessionTrackingService.getInstance()
