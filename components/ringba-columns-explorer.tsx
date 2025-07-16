"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, AlertCircle, Info, CheckCircle, XCircle, Database } from "lucide-react"

interface ColumnDefinition {
  name: string
  displayName: string
  type: string
  isFilterable: boolean
  [key: string]: any
}

export function RingbaColumnsExplorer() {
  const [columns, setColumns] = useState<ColumnDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean
    method: string
    dataSource: string
  }>({
    isConnected: false,
    method: "Unknown",
    dataSource: "Unknown",
  })

  useEffect(() => {
    fetchColumns()
  }, [])

  const fetchColumns = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ringba/calllogs/columns")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch Ringba call log columns")
      }

      setColumns(result.data || [])
      setApiStatus({
        isConnected: true,
        method: result.method || "Unknown",
        dataSource: result.dataSource || "Unknown",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setApiStatus({
        isConnected: false,
        method: "Failed",
        dataSource: "Error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getApiStatusBadge = () => {
    if (apiStatus.isConnected && apiStatus.dataSource === "REAL_RINGBA_API") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Live API
        </Badge>
      )
    } else if (apiStatus.dataSource === "MOCK_DATA") {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Info className="h-3 w-3 mr-1" />
          Mock Data
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          API Error
        </Badge>
      )
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return "bg-blue-100 text-blue-800"
      case "number":
        return "bg-green-100 text-green-800"
      case "datetime":
        return "bg-purple-100 text-purple-800"
      case "boolean":
        return "bg-orange-100 text-orange-800"
      case "array":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            Ringba Call Log Columns
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600">Method: {apiStatus.method}</p>
            {getApiStatusBadge()}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchColumns} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* API Status Alert */}
      {apiStatus.dataSource === "MOCK_DATA" && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Using Mock Data:</strong> The Ringba API connection failed. Showing sample column data for
            development. Check your API credentials and network connectivity.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Available Call Log Columns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Failed to load columns:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {!isLoading && columns.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>No column definitions found.</AlertDescription>
            </Alert>
          )}

          {!isLoading && columns.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Filterable</TableHead>
                    <TableHead>Properties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((column) => (
                    <TableRow key={column.name}>
                      <TableCell className="font-medium">{column.name}</TableCell>
                      <TableCell>{column.displayName}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(column.type)}>{column.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {column.isFilterable ? (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-500 text-gray-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(column)
                            .filter(([key]) => !["name", "displayName", "type", "isFilterable"].includes(key))
                            .map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
