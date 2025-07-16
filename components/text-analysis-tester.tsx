"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, BarChart3 } from "lucide-react"

export default function TextAnalysisTester() {
  const [text, setText] = useState("Hello, I am having trouble with my account login. Can you help me please?")
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<"GET" | "POST">("GET")

  const testAnalysis = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let response: Response

      if (method === "GET") {
        const params = new URLSearchParams({
          text: text,
          language: language,
        })
        response = await fetch(`/api/analyze-text?${params}`)
      } else {
        response = await fetch("/api/analyze-text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            language,
            options: {
              includeCallAnalysis: true,
            },
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Text Analysis API Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Text to Analyze:</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to analyze..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Language:</label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Method:</label>
              <div className="flex gap-2">
                <Button variant={method === "GET" ? "default" : "outline"} size="sm" onClick={() => setMethod("GET")}>
                  GET
                </Button>
                <Button variant={method === "POST" ? "default" : "outline"} size="sm" onClick={() => setMethod("POST")}>
                  POST
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={testAnalysis} disabled={loading || !text.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Text"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Error:</span>
            </div>
            <p className="mt-2 text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.input && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Input:</h4>
                <p className="text-sm text-gray-600">{result.input.text}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Length: {result.input.length}</Badge>
                  <Badge variant="outline">Language: {result.input.language}</Badge>
                </div>
              </div>
            )}

            {result.analysis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Sentiment:</span>
                  <Badge className={getSentimentColor(result.analysis.sentiment)}>{result.analysis.sentiment}</Badge>
                  {result.analysis.confidence && (
                    <Badge variant="outline">{Math.round(result.analysis.confidence * 100)}% confidence</Badge>
                  )}
                </div>

                {result.analysis.topics && result.analysis.topics.length > 0 && (
                  <div>
                    <span className="font-medium">Topics:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.analysis.topics.map((topic: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.analysis.intent && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Intent:</span>
                    <Badge variant="outline">{result.analysis.intent}</Badge>
                  </div>
                )}

                {result.analysis.summary && (
                  <div>
                    <span className="font-medium">Summary:</span>
                    <p className="text-sm text-gray-600 mt-1">{result.analysis.summary}</p>
                  </div>
                )}
              </div>
            )}

            {result.metadata && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Metadata:</h4>
                <div className="text-sm space-y-1">
                  <div>Model: {result.metadata.model}</div>
                  <div>Timestamp: {new Date(result.metadata.timestamp).toLocaleString()}</div>
                  {result.metadata.enhanced && <div>Enhanced Analysis: Yes</div>}
                </div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Raw Response</summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">GET Request:</h4>
            <code className="block p-2 bg-gray-100 rounded text-sm">GET /api/analyze-text?text=hello&language=en</code>
          </div>
          <div>
            <h4 className="font-medium">POST Request:</h4>
            <code className="block p-2 bg-gray-100 rounded text-sm">
              POST /api/analyze-text
              <br />
              {`{"text": "hello", "language": "en", "options": {"includeCallAnalysis": true}}`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
