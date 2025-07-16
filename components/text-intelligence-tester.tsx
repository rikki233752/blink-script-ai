"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle, XCircle, Brain, MessageSquare } from "lucide-react"

export function TextIntelligenceTester() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const sampleTexts = {
    callTranscript: `Agent: Thank you for calling TechSupport, this is Sarah. How can I help you today?
Customer: Hi Sarah, I'm having trouble with my internet connection. It keeps dropping out every few minutes.
Agent: I'm sorry to hear that. Let me help you troubleshoot this issue. Can you tell me what type of router you're using?
Customer: It's a Netgear router, about 2 years old. This problem started yesterday.
Agent: Okay, let's try restarting your router first. Can you unplug it for 30 seconds and then plug it back in?
Customer: Sure, let me do that now... Okay, it's back on.
Agent: Great! Now let's check if the connection is stable. Can you try browsing to a website?
Customer: Yes, it seems to be working now. Thank you so much for your help!
Agent: You're welcome! If the problem persists, please don't hesitate to call us back. Is there anything else I can help you with today?
Customer: No, that's all. Thanks again!`,

    businessEmail: `Dear Mr. Johnson,
I hope this email finds you well. I wanted to follow up on our conversation last week regarding the new software implementation project.
After reviewing your requirements, I believe our Enterprise Solution would be perfect for your organization. The key benefits include:
- 40% reduction in processing time
- Enhanced security features
- 24/7 customer support
- Seamless integration with existing systems
I'd love to schedule a demo next week to show you how this can transform your operations. Are you available Tuesday or Wednesday afternoon?
Looking forward to hearing from you.
Best regards,
Michael Chen`,

    customerFeedback: `I recently purchased your premium subscription and I have mixed feelings about it. The user interface is really intuitive and easy to navigate, which I love. However, I've been experiencing some performance issues during peak hours. The loading times are quite slow and sometimes the app crashes. The customer service team was helpful when I contacted them, but it took 3 days to get a response. Overall, I think the product has great potential but needs some improvements in reliability and support response times.`,
  }

  const loadSampleText = (key: keyof typeof sampleTexts) => {
    setText(sampleTexts[key])
    setResult(null)
    setError(null)
  }

  const analyzeText = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("📝 Starting Text Intelligence analysis...")

      const response = await fetch("/api/deepgram/text-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        console.log("✅ Text Intelligence analysis successful:", data.data)
      } else {
        setError(data.error || "Unknown error occurred")
        console.error("❌ Text Intelligence analysis failed:", data.error)
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`)
      console.error("❌ Network error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Deepgram Text Intelligence API Test
          </CardTitle>
          <div className="text-sm text-gray-600">
            <p>This uses the Deepgram Text Intelligence API endpoint:</p>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-x-auto">
              {`import requests

url = "https://api.deepgram.com/v1/read"
headers = {
    "Authorization": "Token 826b863658186408cc422feb47b5fe93809d0eb7",
    "Content-Type": "application/json"
}

data = {"text": "Your text here"}
response = requests.post(url, headers=headers, json=data)
print(response.json())`}
            </pre>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Text Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Start - Load Sample Text:</label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => loadSampleText("callTranscript")} className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Call Transcript
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadSampleText("businessEmail")} className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Business Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSampleText("customerFeedback")}
                className="text-xs"
              >
                <Brain className="h-3 w-3 mr-1" />
                Customer Feedback
              </Button>
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Text to Analyze:
            </label>
            <Textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text here for sentiment analysis, topic extraction, intent detection, and more..."
              className="min-h-[200px]"
            />
            <div className="mt-1 text-sm text-gray-500">
              {text.length} characters, {text.split(/\s+/).filter((word) => word.length > 0).length} words
            </div>
          </div>

          {/* Analyze Button */}
          <Button onClick={analyzeText} disabled={!text.trim() || loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing with Text Intelligence API...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Text
              </>
            )}
          </Button>

          {/* Configuration Display */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-purple-900 mb-2">API Configuration:</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>URL:</strong> <code>https://api.deepgram.com/v1/read</code>
                </div>
                <div>
                  <strong>API Key:</strong> <code>826b863658186408cc422feb47b5fe93809d0eb7</code>
                </div>
                <div>
                  <strong>Content-Type:</strong> <code>application/json</code>
                </div>
                <div>
                  <strong>Features:</strong> <code>summarize, sentiment, topics, intents, entities</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Text Intelligence Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.deepgram_text_intelligence_response?.results?.summary ? "✓" : "✗"}
                </div>
                <div className="text-sm text-gray-600">Summary</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.deepgram_text_intelligence_response?.results?.sentiment ? "✓" : "✗"}
                </div>
                <div className="text-sm text-gray-600">Sentiment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {result.deepgram_text_intelligence_response?.results?.topics?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {result.deepgram_text_intelligence_response?.results?.intents?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Intents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.deepgram_text_intelligence_response?.results?.entities?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Entities</div>
              </div>
            </div>

            {/* Summary */}
            {result.deepgram_text_intelligence_response?.results?.summary && (
              <div>
                <h4 className="font-semibold mb-2">📋 Summary:</h4>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  {result.deepgram_text_intelligence_response.results.summary.text}
                </div>
              </div>
            )}

            {/* Sentiment Analysis */}
            {result.deepgram_text_intelligence_response?.results?.sentiment && (
              <div>
                <h4 className="font-semibold mb-2">😊 Sentiment Analysis:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.deepgram_text_intelligence_response.results.sentiment.segments?.map(
                    (segment: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <Badge
                            variant={
                              segment.sentiment === "positive"
                                ? "default"
                                : segment.sentiment === "negative"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {segment.sentiment}
                          </Badge>
                          <span className="text-sm font-semibold">{(segment.sentiment_score * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-sm text-gray-700">{segment.text}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Topics */}
            {result.deepgram_text_intelligence_response?.results?.topics &&
              result.deepgram_text_intelligence_response.results.topics.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">🏷️ Topics Detected:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.deepgram_text_intelligence_response.results.topics.map((topic: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {topic.topic} ({(topic.confidence_score * 100).toFixed(1)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Intents */}
            {result.deepgram_text_intelligence_response?.results?.intents &&
              result.deepgram_text_intelligence_response.results.intents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">🎯 Intents Identified:</h4>
                  <div className="space-y-2">
                    {result.deepgram_text_intelligence_response.results.intents.map((intent: any, index: number) => (
                      <div key={index} className="bg-orange-50 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{intent.intent}</span>
                          <Badge variant="outline">{(intent.confidence_score * 100).toFixed(1)}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Entities */}
            {result.deepgram_text_intelligence_response?.results?.entities &&
              result.deepgram_text_intelligence_response.results.entities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">🏢 Entities Found:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.deepgram_text_intelligence_response.results.entities.map((entity: any, index: number) => (
                      <div key={index} className="bg-red-50 p-3 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{entity.label}</span>
                          <Badge variant="outline">{(entity.confidence * 100).toFixed(1)}%</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{entity.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* API Response Details */}
            <div>
              <h4 className="font-semibold mb-2">🔧 API Response Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>API Key Used:</strong>
                  <Badge variant="outline" className="ml-2">
                    {result.api_key_used}
                  </Badge>
                </div>
                <div>
                  <strong>Endpoint:</strong>
                  <Badge variant="outline" className="ml-2">
                    {result.endpoint_used}
                  </Badge>
                </div>
                <div>
                  <strong>Text Length:</strong>
                  <Badge variant="outline" className="ml-2">
                    {result.text_info.length} chars
                  </Badge>
                </div>
                <div>
                  <strong>Word Count:</strong>
                  <Badge variant="outline" className="ml-2">
                    {result.text_info.word_count} words
                  </Badge>
                </div>
              </div>
            </div>

            {/* Raw JSON Response */}
            <details className="border rounded p-3">
              <summary className="font-semibold cursor-pointer">Raw JSON Response (click to expand)</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(result.deepgram_text_intelligence_response, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
