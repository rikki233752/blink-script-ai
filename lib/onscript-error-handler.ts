export interface OnScriptError {
  code: string
  message: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
  context?: any
}

export class OnScriptErrorHandler {
  private static errors: OnScriptError[] = []

  static logError(code: string, message: string, severity: OnScriptError["severity"], context?: any): void {
    const error: OnScriptError = {
      code,
      message,
      severity,
      timestamp: new Date().toISOString(),
      context,
    }

    this.errors.push(error)

    // Log based on severity
    switch (severity) {
      case "critical":
        console.error(`🚨 CRITICAL [${code}]:`, message, context)
        break
      case "high":
        console.error(`❌ HIGH [${code}]:`, message, context)
        break
      case "medium":
        console.warn(`⚠️ MEDIUM [${code}]:`, message, context)
        break
      case "low":
        console.log(`ℹ️ LOW [${code}]:`, message, context)
        break
    }

    // Keep only last 100 errors to prevent memory leaks
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100)
    }
  }

  static getErrors(): OnScriptError[] {
    return [...this.errors]
  }

  static getErrorsByCode(code: string): OnScriptError[] {
    return this.errors.filter((error) => error.code === code)
  }

  static clearErrors(): void {
    this.errors = []
  }

  static getErrorSummary(): { total: number; bySeverity: Record<string, number> } {
    const bySeverity = this.errors.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: this.errors.length,
      bySeverity,
    }
  }
}

// Validation utilities
export class OnScriptValidator {
  static validateTranscript(transcript: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!transcript) {
      errors.push("Transcript is required")
    } else if (typeof transcript !== "string") {
      errors.push("Transcript must be a string")
    } else if (transcript.trim().length === 0) {
      errors.push("Transcript cannot be empty")
    } else if (transcript.length > 100000) {
      errors.push("Transcript is too long (max 100,000 characters)")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static validateAnalysis(analysis: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!analysis) {
      errors.push("Analysis object is required")
    } else if (typeof analysis !== "object") {
      errors.push("Analysis must be an object")
    }

    // Check for required analysis properties
    const requiredProps = ["overallScore", "overallRating"]
    for (const prop of requiredProps) {
      if (analysis && !(prop in analysis)) {
        errors.push(`Analysis missing required property: ${prop}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static validateFileInfo(fileName: any, fileSize: any, duration: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!fileName || typeof fileName !== "string") {
      errors.push("Valid file name is required")
    }

    if (typeof fileSize !== "number" || fileSize < 0) {
      errors.push("Valid file size is required")
    }

    if (typeof duration !== "number" || duration < 0) {
      errors.push("Valid duration is required")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static sanitizeInput(input: any): any {
    if (typeof input === "string") {
      return input
        .replace(/[<>]/g, "") // Remove HTML tags
        .replace(/javascript:/gi, "") // Remove javascript protocols
        .replace(/on\w+=/gi, "") // Remove event handlers
        .trim()
    }

    if (typeof input === "object" && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value)
      }
      return sanitized
    }

    return input
  }
}

// Performance monitoring
export class OnScriptPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static startTimer(operation: string): () => number {
    const startTime = Date.now()

    return () => {
      const duration = Date.now() - startTime
      this.recordMetric(operation, duration)
      return duration
    }
  }

  static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }

    const durations = this.metrics.get(operation)!
    durations.push(duration)

    // Keep only last 100 measurements
    if (durations.length > 100) {
      durations.splice(0, durations.length - 100)
    }
  }

  static getMetrics(operation: string): { avg: number; min: number; max: number; count: number } | null {
    const durations = this.metrics.get(operation)
    if (!durations || durations.length === 0) {
      return null
    }

    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    return { avg, min, max, count: durations.length }
  }

  static getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {}

    for (const [operation, durations] of this.metrics.entries()) {
      if (durations.length > 0) {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length
        const min = Math.min(...durations)
        const max = Math.max(...durations)
        result[operation] = { avg, min, max, count: durations.length }
      }
    }

    return result
  }

  static clearMetrics(): void {
    this.metrics.clear()
  }
}
