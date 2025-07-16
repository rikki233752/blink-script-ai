import { queueManager, type ProcessingJob, type JobInput } from "./queue-manager"
import { DeepgramDirectClient } from "../deepgram-direct"
import { openRouterAnalyzer } from "../openrouter-comprehensive-analyzer"
import { createClient } from "@supabase/supabase-js"

export class WorkerService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  private isRunning = false
  private processingInterval: NodeJS.Timeout | null = null

  /**
   * Start the background worker
   */
  start(intervalMs = 5000): void {
    if (this.isRunning) {
      console.log("⚠️ Worker is already running")
      return
    }

    this.isRunning = true
    console.log("🚀 Starting background worker...")

    this.processingInterval = setInterval(async () => {
      await this.processNextJob()
    }, intervalMs)

    // Process one job immediately
    this.processNextJob()
  }

  /**
   * Stop the background worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log("⚠️ Worker is not running")
      return
    }

    this.isRunning = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    console.log("🛑 Background worker stopped")
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    try {
      const job = await queueManager.getNextJob()
      if (!job) {
        return // No jobs to process
      }

      console.log(`🔄 Processing job ${job.id} (${job.job_type})`)

      // Mark job as processing
      const started = await queueManager.startJob(job.id)
      if (!started) {
        console.error(`❌ Failed to start job ${job.id}`)
        return
      }

      // Process based on job type
      let result: any
      let transcriptionId: string | undefined
      let analysisId: string | undefined

      try {
        switch (job.job_type) {
          case "transcribe":
            result = await this.processTranscription(job)
            transcriptionId = result.transcriptionId
            break

          case "analyze":
            result = await this.processAnalysis(job)
            analysisId = result.analysisId
            break

          case "full_process":
            result = await this.processFullPipeline(job)
            transcriptionId = result.transcriptionId
            analysisId = result.analysisId
            break

          default:
            throw new Error(`Unknown job type: ${job.job_type}`)
        }

        // Mark job as completed
        await queueManager.completeJob(job.id, result, transcriptionId, analysisId)
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error)
        await queueManager.failJob(job.id, error instanceof Error ? error.message : "Unknown error", {
          error: error instanceof Error ? error.stack : error,
        })
      }
    } catch (error) {
      console.error("❌ Error in processNextJob:", error)
    }
  }

  /**
   * Process transcription job
   */
  private async processTranscription(job: ProcessingJob): Promise<any> {
    console.log(`🎤 Processing transcription for job ${job.id}`)

    const input = job.input_data as JobInput
    if (!input.audioUrl && !input.audioFile) {
      throw new Error("No audio source provided")
    }

    // Initialize Deepgram client
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramApiKey) {
      throw new Error("Deepgram API key not configured")
    }

    const deepgram = new DeepgramDirectClient(deepgramApiKey)

    // Transcribe audio
    let transcriptionResult: any
    if (input.audioUrl) {
      transcriptionResult = await deepgram.transcribeFromUrl(input.audioUrl)
    } else if (input.audioFile) {
      transcriptionResult = await deepgram.transcribeFile(input.audioFile)
    }

    // Extract transcript
    const transcript = transcriptionResult?.results?.channels?.[0]?.alternatives?.[0]?.transcript
    if (!transcript) {
      throw new Error("No transcript generated")
    }

    // Save transcription to database
    const { data: transcriptionRecord, error } = await this.supabase
      .from("transcriptions")
      .insert({
        user_id: job.user_id,
        call_log_id: job.call_log_id,
        transcript_text: transcript,
        confidence_score: transcriptionResult?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
        language: "en-US",
        provider: "deepgram",
        provider_response: transcriptionResult,
        metadata: {
          fileName: input.fileName,
          processingJobId: job.id,
          ...input.metadata,
        },
      })
      .select("id")
      .single()

    if (error) {
      throw new Error(`Failed to save transcription: ${error.message}`)
    }

    console.log(`✅ Transcription completed for job ${job.id}`)

    return {
      transcript,
      transcriptionId: transcriptionRecord.id,
      confidence: transcriptionResult?.results?.channels?.[0]?.alternatives?.[0]?.confidence,
      duration: transcriptionResult?.metadata?.duration,
      deepgramResult: transcriptionResult,
    }
  }

  /**
   * Process analysis job
   */
  private async processAnalysis(job: ProcessingJob): Promise<any> {
    console.log(`🧠 Processing analysis for job ${job.id}`)

    const input = job.input_data as JobInput
    if (!input.transcript) {
      throw new Error("No transcript provided for analysis")
    }

    // Perform comprehensive analysis
    const analysisResult = await openRouterAnalyzer.analyzeCall(input.transcript)

    // Save analysis to database
    const { data: analysisRecord, error } = await this.supabase
      .from("ai_analysis")
      .insert({
        user_id: job.user_id,
        call_log_id: job.call_log_id,
        transcription_id: input.transcriptionId,

        // Scores
        overall_score: analysisResult.qualityAnalysis.overallScore,
        communication_score: analysisResult.qualityAnalysis.communicationClarity,
        professionalism_score: analysisResult.qualityAnalysis.professionalism,
        empathy_score: analysisResult.qualityAnalysis.empathy,
        problem_resolution_score: analysisResult.qualityAnalysis.problemSolving,

        // Analysis results
        intent: analysisResult.intentAnalysis.primaryIntent,
        intent_confidence: analysisResult.intentAnalysis.confidence,
        disposition: analysisResult.dispositionAnalysis.disposition,
        disposition_confidence: analysisResult.dispositionAnalysis.confidence,

        // Conversion data
        business_conversion: analysisResult.businessAnalysis.conversionPotential > 70,
        conversion_probability: analysisResult.businessAnalysis.conversionPotential,
        lead_quality_score: Math.round(analysisResult.businessAnalysis.conversionPotential / 10),

        // Follow-up
        follow_up_required: analysisResult.dispositionAnalysis.followUpRequired,
        follow_up_priority: analysisResult.businessAnalysis.conversionPotential > 70 ? "high" : "medium",

        // Arrays
        key_topics: analysisResult.factsAnalysis.keyFacts,
        mentioned_products: analysisResult.factsAnalysis.productsMentioned,
        objections_raised: analysisResult.factsAnalysis.objections,
        pain_points: analysisResult.businessAnalysis.riskFactors,
        positive_indicators: analysisResult.businessAnalysis.buyingSignals,
        negative_indicators: analysisResult.businessAnalysis.riskFactors,
        strengths: analysisResult.qualityAnalysis.strengths,
        improvement_areas: analysisResult.qualityAnalysis.improvementAreas,
        coaching_points: analysisResult.qualityAnalysis.coachingRecommendations,

        // Provider info
        ai_model: "openrouter-comprehensive",
        model_version: "1.0",
        analysis_confidence: analysisResult.confidence,

        // Full results
        metadata: {
          fullAnalysis: analysisResult,
          processingJobId: job.id,
          processingTime: analysisResult.processingTime,
        },
      })
      .select("id")
      .single()

    if (error) {
      throw new Error(`Failed to save analysis: ${error.message}`)
    }

    console.log(`✅ Analysis completed for job ${job.id}`)

    return {
      analysisId: analysisRecord.id,
      analysisResult,
      overallScore: analysisResult.qualityAnalysis.overallScore,
      intent: analysisResult.intentAnalysis.primaryIntent,
      disposition: analysisResult.dispositionAnalysis.disposition,
    }
  }

  /**
   * Process full pipeline (transcribe + analyze)
   */
  private async processFullPipeline(job: ProcessingJob): Promise<any> {
    console.log(`🔄 Processing full pipeline for job ${job.id}`)

    // Step 1: Transcription
    const transcriptionResult = await this.processTranscription(job)

    // Step 2: Analysis (update job input with transcript)
    const analysisJob = {
      ...job,
      input_data: {
        ...job.input_data,
        transcript: transcriptionResult.transcript,
        transcriptionId: transcriptionResult.transcriptionId,
      },
    }

    const analysisResult = await this.processAnalysis(analysisJob)

    console.log(`✅ Full pipeline completed for job ${job.id}`)

    return {
      transcriptionId: transcriptionResult.transcriptionId,
      analysisId: analysisResult.analysisId,
      transcript: transcriptionResult.transcript,
      analysis: analysisResult.analysisResult,
      overallScore: analysisResult.overallScore,
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; intervalMs?: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.processingInterval ? 5000 : undefined,
    }
  }
}

// Export singleton instance
export const workerService = new WorkerService()
