import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // This would connect to your database in a real application
  // For now, we'll return empty data to match the zero-state UI

  const scores = {
    averageScore: 0,
    totalCalls: 0,
    totalMinutes: 0,
    totalCompleted: 0,
    categories: [
      { name: "Vocal Characteristics", score: 0 },
      { name: "Conversation Flow", score: 0 },
      { name: "Emotional Intelligence and Adaptability", score: 0 },
      { name: "Professionalism and Etiquette", score: 0 },
    ],
  }

  return NextResponse.json(scores)
}
