import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { campaignId: string; callLogId: string } }) {
  try {
    const { campaignId, callLogId } = params

    console.log(`📋 Fetching OnScript-style call details for: ${campaignId}/${callLogId}`)

    // Get call details from localStorage (where transcriptions are stored)
    const existingCalls = JSON.parse(localStorage.getItem("uploadedCalls") || "[]")

    // Find the call by callLogId or callId
    const callData = existingCalls.find((call: any) => {
      return (
        call.id === callLogId ||
        call.callId === callLogId ||
        call.externalId === callLogId ||
        call.id === `ringba_${callLogId}` ||
        call.id.includes(callLogId)
      )
    })

    if (!callData) {
      return NextResponse.json(
        {
          success: false,
          error: "Call details not found",
          message: "This call has not been transcribed yet. Please transcribe the call first to view details.",
        },
        { status: 404 },
      )
    }

    // Transform to OnScript AI call details format
    const onscriptCallDetails = {
      callLogId,
      campaignId,
      campaignName: callData.campaignName || callData.ringbaData?.campaignName || `Campaign ${campaignId}`,
      callId: callData.callId || callData.externalId,
      agentName: callData.agent || callData.ringbaData?.agentName || "Unknown Agent",
      customerPhone: callData.ringbaData?.callerNumber || "Unknown",
      direction: callData.ringbaData?.direction || "inbound",
      duration: callData.duration || 0,
      startTime: callData.date || callData.ringbaData?.startTime || new Date().toISOString(),
      endTime: callData.ringbaData?.endTime || null,
      status: callData.ringbaData?.status || "completed",
      disposition: callData.ringbaData?.disposition || "unknown",
      hasRecording: !!callData.recordingUrl,
      recordingUrl: callData.recordingUrl,
      hasTranscription: !!callData.transcript,
      hasAnalysis: !!callData.analysis,

      // OnScript AI-style call details
      transcript: callData.transcript || null,
      analysis: callData.analysis
        ? {
            overallRating: callData.analysis.overallRating,
            overallScore: callData.analysis.overallScore,
            agentPerformance: callData.analysis.agentPerformance,
            businessConversion: callData.analysis.businessConversion || callData.analysis.enhancedConversion,
            sentimentAnalysis: callData.analysis.sentimentAnalysis,
            keyInsights: callData.analysis.keyInsights || [],
            improvementSuggestions: callData.analysis.improvementSuggestions || [],
            callQualityMetrics: callData.analysis.callQualityMetrics,
            vocalyticsReport: callData.analysis.vocalyticsReport,
            toneQuality: callData.analysis.toneQuality,
            intentAnalysis: callData.analysis.intentAnalysis,
            dispositionAnalysis: callData.analysis.dispositionAnalysis,
            preciseScoring: callData.analysis.preciseScoring,
          }
        : null,

      provider: callData.provider || "deepgram-ai-enhanced",
      processedAt: callData.processedAt || new Date().toISOString(),
      fileName: callData.fileName,
      fileSize: callData.fileSize || 0,

      // Additional OnScript-style metadata
      integrationSource: callData.integrationSource || "RingBA",
      automated: callData.automated || false,
      ringbaData: callData.ringbaData,
    }

    console.log(`✅ Retrieved OnScript call details for ${callLogId}`)

    return NextResponse.json({
      success: true,
      data: onscriptCallDetails,
      dataSource: "ONSCRIPT_CALL_DETAILS",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Error fetching OnScript call details:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch call details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
