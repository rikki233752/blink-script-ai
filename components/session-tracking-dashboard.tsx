"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Monitor, Clock, MapPin, Smartphone, AlertTriangle, Activity, LogOut } from "lucide-react"

interface LoginActivity {
  id: string
  login_time: string
  logout_time?: string
  ip_address: string
  device_type: string
  browser: string
  operating_system: string
  location_country?: string
  location_city?: string
  is_mobile: boolean
  login_status: string
  session_duration?: string
  is_active: boolean
  last_activity: string
}

interface SecurityEvent {
  id: string
  event_type: string
  event_description: string
  ip_address: string
  risk_score: number
  created_at: string
  metadata?: any
}

interface SessionStats {
  totalLogins: number
  activeSessions: number
  recentSecurityEvents: number
}

export default function SessionTrackingDashboard({ userId }: { userId: string }) {
  const [loginHistory, setLoginHistory] = useState<LoginActivity[]>([])
  const [activeSessions, setActiveSessions] = useState<LoginActivity[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [stats, setStats] = useState<SessionStats>({ totalLogins: 0, activeSessions: 0, recentSecurityEvents: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSessionData()
  }, [userId])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/session-tracking/activity?userId=${userId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch session data")
      }

      const data = await response.json()
      setLoginHistory(data.loginHistory || [])
      setActiveSessions(data.activeSessions || [])
      setSecurityEvents(data.securityEvents || [])
      setStats(data.stats || { totalLogins: 0, activeSessions: 0, recentSecurityEvents: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/session-tracking/terminate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        await fetchSessionData() // Refresh data
      }
    } catch (err) {
      console.error("Error terminating session:", err)
    }
  }

  const formatDuration = (duration: string | null) => {
    if (!duration) return "Active"

    const match = duration.match(/(\d+):(\d+):(\d+)/)
    if (match) {
      const [, hours, minutes, seconds] = match
      return `${hours}h ${minutes}m ${seconds}s`
    }
    return duration
  }

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 70) return "destructive"
    if (riskScore >= 40) return "secondary"
    return "default"
  }

  const getDeviceIcon = (deviceType: string, isMobile: boolean) => {
    if (isMobile || deviceType === "mobile") return <Smartphone className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogins}</div>
            <p className="text-xs text-muted-foreground">All time login attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.recentSecurityEvents}</div>
            <p className="text-xs text-muted-foreground">Recent security events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active-sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active-sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="login-history">Login History</TabsTrigger>
          <TabsTrigger value="security-events">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="active-sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently active login sessions for your account</CardDescription>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <p className="text-muted-foreground">No active sessions</p>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getDeviceIcon(session.device_type, session.is_mobile)}
                        <div>
                          <div className="font-medium">
                            {session.browser} on {session.operating_system}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{session.ip_address}</span>
                            {session.location_city && (
                              <span>
                                • {session.location_city}, {session.location_country}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>Started: {new Date(session.login_time).toLocaleString()}</span>
                            <span>• Last active: {new Date(session.last_activity).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => terminateSession(session.id)}>
                          <LogOut className="h-3 w-3 mr-1" />
                          Terminate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login attempts and session information</CardDescription>
            </CardHeader>
            <CardContent>
              {loginHistory.length === 0 ? (
                <p className="text-muted-foreground">No login history available</p>
              ) : (
                <div className="space-y-4">
                  {loginHistory.map((login) => (
                    <div key={login.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getDeviceIcon(login.device_type, login.is_mobile)}
                        <div>
                          <div className="font-medium">
                            {login.browser} on {login.operating_system}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{login.ip_address}</span>
                            {login.location_city && (
                              <span>
                                • {login.location_city}, {login.location_country}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(login.login_time).toLocaleString()}</span>
                            {login.session_duration && (
                              <span>• Duration: {formatDuration(login.session_duration)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={login.login_status === "success" ? "default" : "destructive"}>
                          {login.login_status}
                        </Badge>
                        {login.is_active && (
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Security-related events and alerts for your account</CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <p className="text-muted-foreground">No security events recorded</p>
              ) : (
                <div className="space-y-4">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="font-medium">{event.event_description}</div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <span>Type: {event.event_type}</span>
                            <span>• IP: {event.ip_address}</span>
                            <span>• {new Date(event.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getRiskBadgeColor(event.risk_score)}>Risk: {event.risk_score}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
