import { SignupTester } from "@/components/signup-tester"

export default function TestSignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Signup to Supabase Test</h1>
          <p className="text-gray-600 mt-2">
            Test if new user registrations are properly saved to the Supabase users table
          </p>
        </div>
        <SignupTester />
      </div>
    </div>
  )
}
