import { NameExtractionValidator } from "@/components/name-extraction-validator"

export default function NameExtractionValidatorPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Name Extraction Validator</h1>
        <p className="text-gray-600">
          Test and validate the enhanced name extraction system to ensure mock data is completely replaced with real
          extracted names.
        </p>
      </div>

      <NameExtractionValidator />
    </div>
  )
}
