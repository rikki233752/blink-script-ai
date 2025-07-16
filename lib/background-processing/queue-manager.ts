import { createClient } from "@supabase/supabase-js"

export interface ProcessingJob {
  id: string
  user_id: string
  job_type: "transcribe" | "analyze" | "full_process"
  status: "pending" | "processing" | "completed" | "failed" | "retrying"
  priority: number
  input_data: any
  attempts: number
  max_attempts: number
  error_message?: string
  error_details?: any
  result_data?: any
  created_at: string
  started_at?: string
  completed_at?: string
  retry_after?: string
  call_log_id?: string
  transcription_id?: string
  analysis_id?: string
}

export interface JobInput {
  audioUrl?: string
  audioFile?: File
  transcript?: string
  callLogId?: string
  fileName?: string
  metadata?: any
}

export class QueueManager {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  /**
   * Add a new job to the processing queue
   */
  async addJob(
    userId: string,
    jobType: ProcessingJob["job_type"],
    inputData: JobInput,
    priority = 5,
    callLogId?: string,
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      console.log(`📋 Adding ${jobType} job to queue for user ${userId}`)

      const { data, error } = await this.supabase
        .from("processing_jobs")
        .insert({
          user_id: userId,
          job_type: jobType,
          priority,
          input_data: inputData,
          call_log_id: callLogId,
        })
        .select("id")
        .single()

      if (error) {
        console.error("❌ Failed to add job to queue:", error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Job ${data.id} added to queue successfully`)

      // Update stats
      await this.updateStats(userId, "jobs_created")

      return { success: true, jobId: data.id }
    } catch (error) {
      console.error("❌ Error adding job to queue:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get the next job from the queue
   */
  async getNextJob(): Promise<ProcessingJob | null> {
    try {
      const { data, error } = await this.supabase.from("processing_queue").select("*").limit(1).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("❌ Error getting next job:", error)
        return null
      }

      return data || null
    } catch (error) {
      console.error("❌ Error getting next job:", error)
      return null
    }
  }

  /**
   * Mark a job as processing
   */
  async startJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("processing_jobs")
        .update({
          status: "processing",
          started_at: new Date().toISOString(),
          attempts: this.supabase.rpc("increment_attempts", { job_id: jobId }),
        })
        .eq("id", jobId)

      if (error) {
        console.error("❌ Failed to start job:", error)
        return false
      }

      console.log(`🚀 Job ${jobId} started processing`)
      return true
    } catch (error) {
      console.error("❌ Error starting job:", error)
      return false
    }
  }

  /**
   * Mark a job as completed
   */
  async completeJob(jobId: string, resultData: any, transcriptionId?: string, analysisId?: string): Promise<boolean> {
    try {
      const { data: job, error: fetchError } = await this.supabase
        .from("processing_jobs")
        .select("user_id, started_at")
        .eq("id", jobId)
        .single()

      if (fetchError) {
        console.error("❌ Failed to fetch job for completion:", fetchError)
        return false
      }

      const { error } = await this.supabase
        .from("processing_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result_data: resultData,
          transcription_id: transcriptionId,
          analysis_id: analysisId,
        })
        .eq("id", jobId)

      if (error) {
        console.error("❌ Failed to complete job:", error)
        return false
      }

      console.log(`✅ Job ${jobId} completed successfully`)

      // Update stats
      await this.updateStats(job.user_id, "jobs_completed")

      // Calculate processing time if available
      if (job.started_at) {
        const processingTime = (new Date().getTime() - new Date(job.started_at).getTime()) / 1000
        await this.updateProcessingTime(job.user_id, processingTime)
      }

      return true
    } catch (error) {
      console.error("❌ Error completing job:", error)
      return false
    }
  }

  /**
   * Mark a job as failed
   */
  async failJob(jobId: string, errorMessage: string, errorDetails?: any): Promise<boolean> {
    try {
      const { data: job, error: fetchError } = await this.supabase
        .from("processing_jobs")
        .select("user_id, attempts, max_attempts")
        .eq("id", jobId)
        .single()

      if (fetchError) {
        console.error("❌ Failed to fetch job for failure:", fetchError)
        return false
      }

      const shouldRetry = job.attempts < job.max_attempts
      const retryAfter = shouldRetry
        ? new Date(Date.now() + Math.pow(2, job.attempts) * 60000).toISOString() // Exponential backoff
        : null

      const { error } = await this.supabase
        .from("processing_jobs")
        .update({
          status: shouldRetry ? "retrying" : "failed",
          error_message: errorMessage,
          error_details: errorDetails,
          retry_after: retryAfter,
        })
        .eq("id", jobId)

      if (error) {
        console.error("❌ Failed to fail job:", error)
        return false
      }

      console.log(`❌ Job ${jobId} ${shouldRetry ? "scheduled for retry" : "failed permanently"}`)

      if (!shouldRetry) {
        await this.updateStats(job.user_id, "jobs_failed")
      }

      return true
    } catch (error) {
      console.error("❌ Error failing job:", error)
      return false
    }
  }

  /**
   * Get jobs for a specific user
   */
  async getUserJobs(userId: string, status?: ProcessingJob["status"], limit = 50): Promise<ProcessingJob[]> {
    try {
      let query = this.supabase
        .from("processing_jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq("status", status)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Error getting user jobs:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("❌ Error getting user jobs:", error)
      return []
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
    retrying: number
  }> {
    try {
      const { data, error } = await this.supabase.from("processing_jobs").select("status")

      if (error) {
        console.error("❌ Error getting queue stats:", error)
        return { pending: 0, processing: 0, completed: 0, failed: 0, retrying: 0 }
      }

      const stats = data.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {} as any)

      return {
        pending: stats.pending || 0,
        processing: stats.processing || 0,
        completed: stats.completed || 0,
        failed: stats.failed || 0,
        retrying: stats.retrying || 0,
      }
    } catch (error) {
      console.error("❌ Error getting queue stats:", error)
      return { pending: 0, processing: 0, completed: 0, failed: 0, retrying: 0 }
    }
  }

  /**
   * Update user statistics
   */
  private async updateStats(userId: string, statType: string): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0]

      await this.supabase.rpc("upsert_processing_stats", {
        p_user_id: userId,
        p_date: today,
        p_stat_type: statType,
        p_increment: 1,
      })
    } catch (error) {
      console.error("❌ Error updating stats:", error)
    }
  }

  /**
   * Update processing time statistics
   */
  private async updateProcessingTime(userId: string, processingTime: number): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0]

      await this.supabase.rpc("update_processing_time", {
        p_user_id: userId,
        p_date: today,
        p_processing_time: processingTime,
      })
    } catch (error) {
      console.error("❌ Error updating processing time:", error)
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data, error } = await this.supabase
        .from("processing_jobs")
        .delete()
        .eq("status", "completed")
        .lt("completed_at", cutoffDate.toISOString())
        .select("id")

      if (error) {
        console.error("❌ Error cleaning up old jobs:", error)
        return 0
      }

      const deletedCount = data?.length || 0
      console.log(`🧹 Cleaned up ${deletedCount} old completed jobs`)
      return deletedCount
    } catch (error) {
      console.error("❌ Error cleaning up old jobs:", error)
      return 0
    }
  }
}

// Export singleton instance
export const queueManager = new QueueManager()
