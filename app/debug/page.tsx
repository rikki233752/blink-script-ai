import { DebugPanel } from "@/components/debug-panel"

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API Debug Page</h1>
      <DebugPanel />
    </div>
  )
}
