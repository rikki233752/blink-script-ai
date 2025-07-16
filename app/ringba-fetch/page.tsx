"use client"
import { RingBACallFetcher } from "@/components/ringba-call-fetcher"
import { Badge } from "@/components/ui/badge"
import { Phone, Download, Brain, Zap } from "lucide-react"

export default function RingBAFetchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">RingBA Call Fetcher</h1>
                  <p className="text-gray-600">Fetch and analyze calls from RingBA</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Phone className="h-4 w-4 mr-1" />
                RingBA
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Brain className="h-4 w-4 mr-1" />
                Deepgram AI
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Zap className="h-4 w-4 mr-1" />
                Auto-Analysis
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RingBACallFetcher />
      </div>
    </div>
  )
}
