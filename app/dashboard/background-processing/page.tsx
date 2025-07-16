import type { Metadata } from "next"
import BackgroundProcessingDashboard from "@/components/background-processing-dashboard"

export const metadata: Metadata = {
  title: "Background Processing | OnScript",
  description: "Monitor and manage background call processing pipeline",
}

export default function BackgroundProcessingPage() {
  return <BackgroundProcessingDashboard />
}
