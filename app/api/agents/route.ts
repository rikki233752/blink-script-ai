import { NextResponse } from "next/server"

interface Agent {
  id: string
  name: string
  email: string
  department: string
  averageScore: number
  totalCalls: number
  totalMinutes: number
  totalCompleted: number
  categories: Array<{
    name: string
    score: number
    trend: "improving" | "declining" | "unchanged"
    previousScore: number
  }>
  traits: Array<{
    id: string
    name: string
    category: string
    score: number
    trend: "improving" | "declining" | "unchanged"
    previousScore: number
    improvement: number
    description: string
  }>
  campaigns: string[]
}

// Mock database - in a real app, this would be your database
const agents: Agent[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    department: "Sales",
    averageScore: 85,
    totalCalls: 156,
    totalMinutes: 2340,
    totalCompleted: 142,
    campaigns: ["campaign-1", "campaign-2"],
    categories: [
      { name: "Vocal Characteristics", score: 88, trend: "improving", previousScore: 82 },
      { name: "Conversation Flow", score: 85, trend: "unchanged", previousScore: 85 },
      { name: "Emotional Intelligence and Adaptability", score: 82, trend: "declining", previousScore: 87 },
      { name: "Professionalism and Etiquette", score: 90, trend: "improving", previousScore: 85 },
    ],
    traits: [
      {
        id: "1",
        name: "Active Listening",
        category: "Conversation Flow",
        score: 92,
        trend: "improving",
        previousScore: 88,
        improvement: 4,
        description: "Demonstrates excellent listening skills",
      },
      {
        id: "2",
        name: "Empathy",
        category: "Emotional Intelligence and Adaptability",
        score: 87,
        trend: "improving",
        previousScore: 82,
        improvement: 5,
        description: "Shows strong emotional connection with customers",
      },
      {
        id: "3",
        name: "Product Knowledge",
        category: "Professionalism and Etiquette",
        score: 94,
        trend: "unchanged",
        previousScore: 94,
        improvement: 0,
        description: "Excellent understanding of products and services",
      },
    ],
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike.chen@company.com",
    department: "Support",
    averageScore: 78,
    totalCalls: 203,
    totalMinutes: 3120,
    totalCompleted: 189,
    campaigns: ["campaign-1", "campaign-3"],
    categories: [
      { name: "Vocal Characteristics", score: 75, trend: "improving", previousScore: 70 },
      { name: "Conversation Flow", score: 80, trend: "improving", previousScore: 75 },
      { name: "Emotional Intelligence and Adaptability", score: 78, trend: "unchanged", previousScore: 78 },
      { name: "Professionalism and Etiquette", score: 79, trend: "declining", previousScore: 83 },
    ],
    traits: [
      {
        id: "4",
        name: "Problem Solving",
        category: "Conversation Flow",
        score: 85,
        trend: "improving",
        previousScore: 78,
        improvement: 7,
        description: "Strong analytical and problem-solving abilities",
      },
      {
        id: "5",
        name: "Patience",
        category: "Emotional Intelligence and Adaptability",
        score: 82,
        trend: "improving",
        previousScore: 76,
        improvement: 6,
        description: "Maintains composure under pressure",
      },
    ],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    department: "Sales",
    averageScore: 92,
    totalCalls: 134,
    totalMinutes: 2890,
    totalCompleted: 128,
    campaigns: ["campaign-2", "campaign-4"],
    categories: [
      { name: "Vocal Characteristics", score: 95, trend: "improving", previousScore: 90 },
      { name: "Conversation Flow", score: 93, trend: "unchanged", previousScore: 93 },
      { name: "Emotional Intelligence and Adaptability", score: 89, trend: "improving", previousScore: 85 },
      { name: "Professionalism and Etiquette", score: 91, trend: "unchanged", previousScore: 91 },
    ],
    traits: [
      {
        id: "6",
        name: "Persuasion",
        category: "Conversation Flow",
        score: 96,
        trend: "improving",
        previousScore: 91,
        improvement: 5,
        description: "Excellent at influencing customer decisions",
      },
      {
        id: "7",
        name: "Clarity",
        category: "Vocal Characteristics",
        score: 98,
        trend: "improving",
        previousScore: 94,
        improvement: 4,
        description: "Speaks clearly and concisely",
      },
    ],
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get("agentId")
  const campaignId = searchParams.get("campaignId")
  const search = searchParams.get("search")

  let filteredAgents = [...agents]

  // Filter by agent ID
  if (agentId) {
    filteredAgents = filteredAgents.filter((agent) => agent.id === agentId)
  }

  // Filter by campaign
  if (campaignId) {
    filteredAgents = filteredAgents.filter((agent) => agent.campaigns.includes(campaignId))
  }

  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase()
    filteredAgents = filteredAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.email.toLowerCase().includes(searchLower) ||
        agent.department.toLowerCase().includes(searchLower),
    )
  }

  return NextResponse.json({ agents: filteredAgents })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newAgent: Agent = {
      id: Date.now().toString(),
      ...body,
      categories: [
        { name: "Vocal Characteristics", score: 0, trend: "unchanged", previousScore: 0 },
        { name: "Conversation Flow", score: 0, trend: "unchanged", previousScore: 0 },
        { name: "Emotional Intelligence and Adaptability", score: 0, trend: "unchanged", previousScore: 0 },
        { name: "Professionalism and Etiquette", score: 0, trend: "unchanged", previousScore: 0 },
      ],
      traits: [],
    }

    agents.push(newAgent)
    return NextResponse.json({ agent: newAgent }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
  }
}
