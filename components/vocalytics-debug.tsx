"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { OnScriptVocalyticsDashboard } from "./onscript-vocalytics-dashboard"

export function VocalyticsDebugger() {
  const [transcript, setTranscript] = useState<string>("")
  const [showVocalytics, setShowVocalytics] = useState(false)
  const [mockDeepgramWords, setMockDeepgramWords] = useState<any[]>([])
  const [mockDeepgramUtterances, setMockDeepgramUtterances] = useState<any[]>([])

  const generateMockDeepgramData = (text: string) => {
    // Generate mock Deepgram words based on transcript
    const words = text.split(/\s+/).filter((w) => w.trim().length > 0)
    const mockWords = words.map((word, index) => {
      return {
        word,
        start: index * 0.5,
        end: (index + 1) * 0.5,
        confidence: 0.95,
        speaker: index % 20 < 10 ? 0 : 1,
      }
    })

    // Generate mock utterances
    const utterances = []
    let currentSpeaker = 0
    let startIdx = 0

    for (let i = 0; i < words.length; i += 10) {
      if (i > startIdx) {
        utterances.push({
          speaker: currentSpeaker,
          start: startIdx * 0.5,
          end: i * 0.5,
          transcript: words.slice(startIdx, i).join(" "),
        })
        currentSpeaker = currentSpeaker === 0 ? 1 : 0
        startIdx = i
      }
    }

    // Add final utterance
    if (startIdx < words.length) {
      utterances.push({
        speaker: currentSpeaker,
        start: startIdx * 0.5,
        end: words.length * 0.5,
        transcript: words.slice(startIdx).join(" "),
      })
    }

    setMockDeepgramWords(mockWords)
    setMockDeepgramUtterances(utterances)
  }

  const handleAnalyze = () => {
    if (transcript.trim()) {
      generateMockDeepgramData(transcript)
      setShowVocalytics(true)
    }
  }

  const sampleTranscript = `
Agent: Good morning, thank you for calling customer support. My name is Alex. How may I help you today?
Customer: Hi Alex, I'm having trouble with my recent order. It's been a week and I still haven't received any shipping confirmation.
Agent: I understand your concern about the shipping delay. That must be frustrating. Could you please provide your order number so I can look into this for you?
Customer: Sure, it's ABC12345.
Agent: Thank you for that information. Let me check our system... I see your order here. It looks like there was a slight delay in processing due to an inventory issue with one of the items. I apologize for this inconvenience.
Customer: Oh, I see. So when will it ship?
Agent: Based on what I'm seeing, your order should ship within the next 24 hours. The item that was causing the delay is now back in stock. Would you like me to expedite the shipping at no extra cost to make up for this delay?
Customer: Yes, that would be great. Thank you.
Agent: You're welcome. I've updated your order with expedited shipping. You should receive a shipping confirmation email by tomorrow evening. Is there anything else I can help you with today?
Customer: No, that's all. Thanks for your help.
Agent: It was my pleasure to assist you. Thank you for your patience and understanding. If you have any other questions, please don't hesitate to call us back. Have a wonderful day!
`

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vocalytics Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter transcript to analyze:</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Enter transcript text here..."
              className="min-h-[200px]"
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={handleAnalyze}>Analyze Transcript</Button>
            <Button
              variant="outline"
              onClick={() => {
                setTranscript(sampleTranscript.trim())
              }}
            >
              Load Sample Transcript
            </Button>
          </div>

          {showVocalytics && transcript && (
            <div className="mt-8 border rounded-lg">
              <OnScriptVocalyticsDashboard
                transcript={transcript}
                deepgramWords={mockDeepgramWords}
                deepgramUtterances={mockDeepgramUtterances}
                debug={true}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
