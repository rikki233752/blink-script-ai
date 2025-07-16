"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function VersionBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 font-medium"
          >
            v1.0
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Current version</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
