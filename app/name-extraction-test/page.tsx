import { NameExtractionTester } from "@/components/name-extraction-tester"

export default function NameExtractionTestPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Name Extraction Testing Tool</h1>
      <p className="mb-6 text-muted-foreground">
        This tool helps validate the name extraction algorithm used in call metadata. Enter a transcript sample or use
        one of the provided examples to test how names are extracted.
      </p>

      <NameExtractionTester />

      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="text-lg font-semibold mb-2">About This Tool</h2>
        <p className="text-sm">
          The name extraction algorithm uses multiple regex patterns to identify names in transcripts. It looks for
          common phrases like "my name is", titles like "Mr." or "Dr.", greeting patterns, and other contextual clues to
          extract the most likely customer name.
        </p>
        <p className="text-sm mt-2">
          The algorithm also validates extracted names to filter out false positives and ranks multiple name candidates
          by frequency and position in the transcript.
        </p>
      </div>
    </div>
  )
}
