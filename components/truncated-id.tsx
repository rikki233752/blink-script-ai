"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, ClipboardCopy } from "lucide-react"

interface TruncatedIdProps {
  id: string
  maxLength?: number
  showCopyButton?: boolean
  className?: string
  labelClassName?: string
  tooltipSide?: "top" | "right" | "bottom" | "left"
  label?: string
}

/**
 * TruncatedId - A component for displaying and managing long IDs
 *
 * This component handles long identifiers by:
 * 1. Truncating them with ellipsis when they exceed maxLength
 * 2. Providing a tooltip to show the full ID on hover
 * 3. Including a copy button for easy clipboard access
 * 4. Showing visual feedback when copied
 *
 * @param id - The identifier to display
 * @param maxLength - Maximum length before truncation (default: 20)
 * @param showCopyButton - Whether to show the copy button (default: true)
 * @param className - Additional classes for the ID text
 * @param labelClassName - Additional classes for the label
 * @param tooltipSide - Which side to show the tooltip (default: "top")
 * @param label - Optional label to display before the ID
 */
export function TruncatedId({
  id,
  maxLength = 20,
  showCopyButton = true,
  className = "",
  labelClassName = "",
  tooltipSide = "top",
  label,
}: TruncatedIdProps) {
  const [copied, setCopied] = useState(false)

  // Determine if ID needs truncation
  const needsTruncation = id.length > maxLength
  const displayId = needsTruncation
    ? `${id.substring(0, Math.floor(maxLength / 2))}...${id.substring(id.length - Math.floor(maxLength / 2))}`
    : id

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-start gap-2">
      {label && <span className={`text-sm text-gray-600 ${labelClassName}`}>{label}</span>}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`text-sm font-mono truncate inline-block ${className}`}>{displayId}</span>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="max-w-xs">
                <p className="font-mono break-all">{id}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {showCopyButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={copyToClipboard}
              aria-label="Copy ID to clipboard"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <ClipboardCopy className="h-3 w-3 text-gray-500" />
              )}
            </Button>
          )}
        </div>
        {needsTruncation && showCopyButton && (
          <span className="text-xs text-gray-500 mt-0.5">Click to copy full ID</span>
        )}
      </div>
    </div>
  )
}
