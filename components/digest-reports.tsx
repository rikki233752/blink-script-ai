"use client"

import { FileText, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DigestReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Digest Reports</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Digest Configuration</span>
          </CardTitle>
          <CardDescription>Configure automated digest reports and email notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Digest Reports</h3>
            <p className="mt-1 text-sm text-gray-500">Set up automated reports and email digest schedules.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
