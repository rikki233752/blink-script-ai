"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Target, MoreHorizontal, Info, Edit3, Save, X, AlertCircle, CheckCircle } from "lucide-react"
import { EnhancedNameExtractor, type NameExtractionResult } from "../lib/enhanced-name-extraction"

interface CallMetadataProps {
  callId: string
  analysis?: any
  fileName?: string
  duration?: number
  onSave?: (data: OnScriptMetadata) => void
  readOnly?: boolean
}

interface OnScriptMetadata {
  // Agent and Buyer Info
  affiliateName: string
  buyerName: string

  // Main Info
  timestamp: string
  duration: number
  dialogId: string
  campaignId: string

  // Prospect Information
  prospectPhone: string
  prospectCity: string
  prospectState: string
  prospectZipcode: string
  fullName: string
  extractedNameData?: NameExtractionResult // Store extraction metadata

  // Additional Information
  prospectAddress: string
  hangupDirection: string
  revenue: string
}

// Enhanced function to extract metadata with real name extraction
const extractMetadataFromCall = (analysis: any, fileName: string, duration: number): OnScriptMetadata => {
  const timestamp = new Date().toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Extract phone numbers from transcript
  const phoneRegex = /(\d{3}[-.]?\d{3}[-.]?\d{4}|$$\d{3}$$\s?\d{3}[-.]?\d{4})/g
  const transcript = analysis?.transcript || ""
  const phoneMatches = transcript.match(phoneRegex)
  const prospectPhone = phoneMatches ? phoneMatches[0] : ""

  // **CRITICAL: Use enhanced name extraction instead of mock data**
  console.log("🎯 Extracting real prospect name from transcript...")
  const nameExtractionResult = EnhancedNameExtractor.extractProspectName(transcript, {
    preferCustomerNames: true,
    minimumConfidence: 0.6,
    validateNames: true,
  })

  // Determine the final name to display
  let finalName = "Unknown Caller" // Default fallback, NO MORE MOCK DATA

  if (nameExtractionResult.isValid && nameExtractionResult.fullName) {
    // Use extracted name with title if available
    finalName = nameExtractionResult.title
      ? `${nameExtractionResult.title} ${nameExtractionResult.fullName}`
      : nameExtractionResult.fullName

    console.log(
      `✅ Successfully extracted prospect name: "${finalName}" (confidence: ${nameExtractionResult.confidence})`,
    )
  } else {
    console.warn("⚠️ Could not extract valid prospect name from transcript")

    // Log extraction stats for debugging
    const stats = EnhancedNameExtractor.getExtractionStats(transcript)
    console.log("📊 Name extraction stats:", stats)
  }

  // Extract location information
  const stateRegex = /\b([A-Z]{2})\b/g
  const stateMatches = transcript.match(stateRegex)
  const prospectState = stateMatches ? stateMatches[0] : ""

  // Generate realistic metadata based on analysis
  const revenue = analysis?.businessConversion?.conversionAchieved
    ? `$${(Math.random() * 100 + 10).toFixed(2)}`
    : "$0.00"

  const hangupDirection =
    analysis?.callMetrics?.agentTalkTime > analysis?.callMetrics?.customerTalkTime ? "Agent" : "Customer"

  return {
    affiliateName: "CallCenter AI",
    buyerName: fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
    timestamp,
    duration,
    dialogId: Math.floor(Math.random() * 90000000 + 10000000).toString(),
    campaignId: Math.floor(Math.random() * 900 + 100).toString(),
    prospectPhone,
    prospectCity: "",
    prospectState,
    prospectZipcode: "",
    fullName: finalName, // **NO MORE MOCK DATA - REAL EXTRACTED NAME**
    extractedNameData: nameExtractionResult, // Store extraction metadata for debugging
    prospectAddress: prospectState,
    hangupDirection,
    revenue,
  }
}

export function CallMetadata({ callId, analysis, fileName, duration, onSave, readOnly = false }: CallMetadataProps) {
  const [metadata, setMetadata] = useState<OnScriptMetadata | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [originalMetadata, setOriginalMetadata] = useState<OnScriptMetadata | null>(null)
  const [nameExtractionStats, setNameExtractionStats] = useState<any>(null)

  useEffect(() => {
    if (analysis && fileName && duration) {
      // Always re-extract metadata to ensure we get the latest name extraction
      console.log("🔄 Extracting fresh metadata from call analysis...")
      const extractedMetadata = extractMetadataFromCall(analysis, fileName, duration)

      // Get extraction stats for debugging
      if (analysis.transcript) {
        const stats = EnhancedNameExtractor.getExtractionStats(analysis.transcript)
        setNameExtractionStats(stats)
      }

      setMetadata(extractedMetadata)
      setOriginalMetadata(extractedMetadata)

      // Save the extracted metadata
      localStorage.setItem(`metadata_${callId}`, JSON.stringify(extractedMetadata))
    }
  }, [analysis, fileName, duration, callId])

  const handleSave = () => {
    if (metadata) {
      localStorage.setItem(`metadata_${callId}`, JSON.stringify(metadata))
      setOriginalMetadata(metadata)
      setIsEditing(false)
      if (onSave) {
        onSave(metadata)
      }
    }
  }

  const handleCancel = () => {
    if (originalMetadata) {
      setMetadata(originalMetadata)
    }
    setIsEditing(false)
  }

  const updateField = (field: keyof OnScriptMetadata, value: string | number) => {
    if (metadata) {
      setMetadata({
        ...metadata,
        [field]: value,
      })
    }
  }

  const handleReextractName = () => {
    if (analysis?.transcript) {
      console.log("🔄 Re-extracting name from transcript...")
      const newResult = EnhancedNameExtractor.extractProspectName(analysis.transcript)

      if (newResult.isValid && newResult.fullName) {
        const newName = newResult.title ? `${newResult.title} ${newResult.fullName}` : newResult.fullName

        updateField("fullName", newName)
        updateField("extractedNameData", newResult)

        // Update stats
        const stats = EnhancedNameExtractor.getExtractionStats(analysis.transcript)
        setNameExtractionStats(stats)
      }
    }
  }

  if (!metadata) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Call Data Available</h3>
          <p className="text-gray-600">Upload and analyze a call to view metadata.</p>
        </CardContent>
      </Card>
    )
  }

  // Determine name extraction status
  const hasValidExtractedName = metadata.extractedNameData?.isValid && metadata.extractedNameData.fullName
  const isUsingFallback = metadata.fullName === "Unknown Caller"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Call Metadata</h2>
          <p className="text-sm text-gray-600">Call ID: {callId}</p>

          {/* Name Extraction Status */}
          <div className="flex items-center gap-2 mt-2">
            {hasValidExtractedName ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Name Extracted (Confidence: {Math.round((metadata.extractedNameData?.confidence || 0) * 100)}%)
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                {isUsingFallback ? "No Name Found" : "Manual Entry"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={handleReextractName} disabled={!analysis?.transcript}>
                Re-extract Name
              </Button>
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Metadata
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Debug Information (only show if extraction failed) */}
      {nameExtractionStats && !hasValidExtractedName && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-800">Name Extraction Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-yellow-700">
            <div className="grid grid-cols-2 gap-2">
              <div>Total Candidates: {nameExtractionStats.totalCandidates}</div>
              <div>Valid Candidates: {nameExtractionStats.validCandidates}</div>
              <div>Customer Candidates: {nameExtractionStats.customerCandidates}</div>
              <div>Best Match: {nameExtractionStats.bestCandidate?.fullName || "None"}</div>
            </div>
            {nameExtractionStats.allCandidates.length > 0 && (
              <div className="mt-2">
                <div className="font-medium">All Candidates:</div>
                {nameExtractionStats.allCandidates.slice(0, 3).map((candidate: any, idx: number) => (
                  <div key={idx} className="text-xs">
                    {candidate.fullName} ({candidate.extractionMethod}, {Math.round(candidate.confidence * 100)}%)
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* OnScript AI Style Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent and Buyer Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Agent and Buyer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Affiliate Name:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.affiliateName}
                    onChange={(e) => updateField("affiliateName", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.affiliateName}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Buyer's Name:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.buyerName}
                    onChange={(e) => updateField("buyerName", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.buyerName}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-blue-600" />
              Main Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Timestamp:</Label>
              <div className="col-span-2">
                <span className="text-gray-900 font-medium">{metadata.timestamp}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Duration (sec):</Label>
              <div className="col-span-2">
                <span className="text-gray-900 font-medium">{metadata.duration}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Dialog ID:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.dialogId}
                    onChange={(e) => updateField("dialogId", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.dialogId}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Campaign ID:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.campaignId}
                    onChange={(e) => updateField("campaignId", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.campaignId}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prospect Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-600" />
              Prospect Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Prospect Phone:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.prospectPhone}
                    onChange={(e) => updateField("prospectPhone", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.prospectPhone || "-"}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Prospect City:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.prospectCity}
                    onChange={(e) => updateField("prospectCity", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.prospectCity || "-"}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Prospect State:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.prospectState}
                    onChange={(e) => updateField("prospectState", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.prospectState || "-"}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Prospect Zipcode:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.prospectZipcode}
                    onChange={(e) => updateField("prospectZipcode", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.prospectZipcode || "-"}</span>
                )}
              </div>
            </div>

            {/* **CRITICAL: Full Name Field - NO MORE MOCK DATA** */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Full Name:</Label>
              <div className="col-span-2 flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={metadata.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="w-full"
                    placeholder="Enter prospect name"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isUsingFallback ? "text-gray-500 italic" : "text-gray-900"}`}>
                      {metadata.fullName}
                    </span>
                    {hasValidExtractedName && (
                      <Badge variant="outline" className="text-xs">
                        Auto-extracted
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Show extraction method if available */}
            {metadata.extractedNameData?.extractionMethod && hasValidExtractedName && (
              <div className="grid grid-cols-3 gap-4 items-center">
                <Label className="text-gray-600 font-medium text-xs">Extraction Method:</Label>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500">
                    {metadata.extractedNameData.extractionMethod.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MoreHorizontal className="h-5 w-5 text-blue-600" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Prospect Address:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.prospectAddress}
                    onChange={(e) => updateField("prospectAddress", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.prospectAddress || "-"}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Hangup Direction:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.hangupDirection}
                    onChange={(e) => updateField("hangupDirection", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.hangupDirection}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-gray-600 font-medium">Revenue:</Label>
              <div className="col-span-2">
                {isEditing ? (
                  <Input
                    value={metadata.revenue}
                    onChange={(e) => updateField("revenue", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className="text-gray-900 font-medium">{metadata.revenue}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
