export interface CoachingInsights {
  coachingScore: number
  positivePoints: string[]
  improvementAreas: string[]
  actionableTips: {
    title: string
    description: string
    example?: string
  }[]
  learningResources: {
    title: string
    description: string
    type: "video" | "article" | "course" | "practice"
  }[]
  specificFeedback: {
    communication: {
      score: number
      feedback: string
    }
    empathy: {
      score: number
      feedback: string
    }
    problemSolving: {
      score: number
      feedback: string
    }
    productKnowledge: {
      score: number
      feedback: string
    }
  }
}

export interface ImprovementPlan {
  currentScore: number
  targetScore: number
  timeframe: string
  estimatedImprovement: string
  priorityAreas: string[]
  weeklyGoals: string[]
  learningPath: string[]
  milestones: {
    week: number
    goal: string
    metrics: string[]
  }[]
}

export function generateCoachingInsights(transcript: string, analysis: any): CoachingInsights {
  const text = transcript.toLowerCase()

  // Analyze communication patterns
  const communicationScore = analysis.agentPerformance.communicationSkills
  const empathyScore = calculateEmpathyScore(text)
  const problemSolvingScore = analysis.agentPerformance.problemSolving
  const productKnowledgeScore = analysis.agentPerformance.productKnowledge

  // Calculate overall coaching score
  const coachingScore = Math.round(
    ((communicationScore + empathyScore + problemSolvingScore + productKnowledgeScore) / 4) * 10,
  )

  // Generate positive points
  const positivePoints = []
  if (communicationScore >= 8) positivePoints.push("Excellent communication clarity and professionalism")
  if (empathyScore >= 7) positivePoints.push("Demonstrated strong empathy and understanding")
  if (problemSolvingScore >= 8) positivePoints.push("Effective problem-solving approach")
  if (text.includes("thank")) positivePoints.push("Good use of courtesy and appreciation")
  if (text.includes("understand")) positivePoints.push("Showed active listening and understanding")

  // Generate improvement areas
  const improvementAreas = []
  if (communicationScore < 7) improvementAreas.push("Communication clarity and structure")
  if (empathyScore < 6) improvementAreas.push("Empathy and emotional connection with customers")
  if (problemSolvingScore < 7) improvementAreas.push("Problem-solving methodology and efficiency")
  if (productKnowledgeScore < 7) improvementAreas.push("Product knowledge and technical expertise")

  // Generate actionable tips
  const actionableTips = []

  if (communicationScore < 8) {
    actionableTips.push({
      title: "Improve Communication Structure",
      description: "Use the STAR method (Situation, Task, Action, Result) to structure your responses",
      example: "Let me understand the situation first, then I'll walk you through the solution step by step.",
    })
  }

  if (empathyScore < 7) {
    actionableTips.push({
      title: "Enhance Empathy Expression",
      description: "Acknowledge customer emotions before jumping into solutions",
      example: "I can understand how frustrating this must be for you. Let me help resolve this right away.",
    })
  }

  if (problemSolvingScore < 8) {
    actionableTips.push({
      title: "Systematic Problem Solving",
      description: "Follow a structured approach: Listen → Clarify → Diagnose → Solve → Confirm",
      example: "Let me make sure I understand the issue correctly before we proceed with the solution.",
    })
  }

  // Generate learning resources
  const learningResources = []

  if (communicationScore < 8) {
    learningResources.push({
      title: "Effective Communication in Customer Service",
      description: "Learn advanced communication techniques for better customer interactions",
      type: "course" as const,
    })
  }

  if (empathyScore < 7) {
    learningResources.push({
      title: "Building Customer Empathy",
      description: "Develop emotional intelligence and empathy skills",
      type: "video" as const,
    })
  }

  if (productKnowledgeScore < 8) {
    learningResources.push({
      title: "Product Knowledge Deep Dive",
      description: "Comprehensive training on product features and troubleshooting",
      type: "course" as const,
    })
  }

  return {
    coachingScore,
    positivePoints: positivePoints.length > 0 ? positivePoints : ["Completed the call professionally"],
    improvementAreas: improvementAreas.length > 0 ? improvementAreas : ["Continue maintaining current standards"],
    actionableTips,
    learningResources,
    specificFeedback: {
      communication: {
        score: communicationScore,
        feedback:
          communicationScore >= 8
            ? "Excellent communication skills demonstrated"
            : "Focus on clearer, more structured communication",
      },
      empathy: {
        score: empathyScore,
        feedback:
          empathyScore >= 7
            ? "Strong empathy and customer connection"
            : "Work on acknowledging and validating customer emotions",
      },
      problemSolving: {
        score: problemSolvingScore,
        feedback:
          problemSolvingScore >= 8
            ? "Effective problem-solving approach"
            : "Develop more systematic problem-solving methodology",
      },
      productKnowledge: {
        score: productKnowledgeScore,
        feedback:
          productKnowledgeScore >= 8
            ? "Strong product knowledge demonstrated"
            : "Enhance product knowledge and technical expertise",
      },
    },
  }
}

export function generateImprovementPlan(callRecords: any[], agentProfile: any): ImprovementPlan {
  // Calculate current performance metrics
  const totalCalls = callRecords.length
  const averageScore = callRecords.reduce((sum, call) => sum + call.overallScore, 0) / totalCalls

  // Identify weakest areas
  const performanceAreas = {
    communication:
      callRecords.reduce((sum, call) => sum + call.analysis.agentPerformance.communicationSkills, 0) / totalCalls,
    problemSolving:
      callRecords.reduce((sum, call) => sum + call.analysis.agentPerformance.problemSolving, 0) / totalCalls,
    productKnowledge:
      callRecords.reduce((sum, call) => sum + call.analysis.agentPerformance.productKnowledge, 0) / totalCalls,
    customerService:
      callRecords.reduce((sum, call) => sum + call.analysis.agentPerformance.customerService, 0) / totalCalls,
  }

  // Sort areas by performance (lowest first)
  const sortedAreas = Object.entries(performanceAreas)
    .sort(([, a], [, b]) => a - b)
    .map(([area]) => area)

  // Generate priority areas
  const priorityAreas = sortedAreas.slice(0, 3).map((area) => {
    switch (area) {
      case "communication":
        return "Communication Skills & Clarity"
      case "problemSolving":
        return "Problem-Solving Methodology"
      case "productKnowledge":
        return "Product Knowledge & Technical Skills"
      case "customerService":
        return "Customer Service Excellence"
      default:
        return area
    }
  })

  // Generate weekly goals
  const weeklyGoals = [
    "Complete 3 practice scenarios focusing on your priority areas",
    "Review and reflect on 2 previous calls each week",
    "Implement 1 new technique learned from coaching feedback",
    "Achieve 10% improvement in lowest-scoring performance area",
  ]

  // Generate learning path
  const learningPath = [
    "Week 1-2: Foundation Skills Assessment & Basic Improvements",
    "Week 3-4: Advanced Communication Techniques",
    "Week 5-6: Problem-Solving Mastery",
    "Week 7-8: Product Knowledge Enhancement",
    "Week 9-10: Integration & Advanced Scenarios",
    "Week 11-12: Performance Review & Goal Setting",
  ]

  // Calculate targets
  const currentScore = Math.round(averageScore * 10) / 10
  const targetScore = Math.min(10, Math.round((averageScore + 1.5) * 10) / 10)
  const estimatedImprovement = `+${(targetScore - currentScore).toFixed(1)}`

  return {
    currentScore,
    targetScore,
    timeframe: "12 weeks",
    estimatedImprovement,
    priorityAreas,
    weeklyGoals,
    learningPath,
    milestones: [
      {
        week: 2,
        goal: "Complete initial skills assessment",
        metrics: ["Baseline performance established", "Priority areas identified"],
      },
      {
        week: 4,
        goal: "Show improvement in communication",
        metrics: ["Communication score +0.5", "Customer satisfaction feedback"],
      },
      {
        week: 8,
        goal: "Demonstrate problem-solving mastery",
        metrics: ["Problem-solving score +1.0", "First-call resolution rate +10%"],
      },
      {
        week: 12,
        goal: "Achieve target performance level",
        metrics: ["Overall score improvement", "Consistent high performance"],
      },
    ],
  }
}

function calculateEmpathyScore(text: string): number {
  const empathyWords = [
    "understand",
    "sorry",
    "apologize",
    "feel",
    "frustrating",
    "appreciate",
    "concern",
    "help",
    "support",
    "care",
  ]

  const negativeWords = ["can't", "won't", "impossible", "no way", "not possible"]

  const empathyCount = empathyWords.filter((word) => text.includes(word)).length
  const negativeCount = negativeWords.filter((word) => text.includes(word)).length

  // Calculate empathy score (1-10 scale)
  const baseScore = Math.min(10, Math.max(1, 5 + empathyCount - negativeCount))
  return Math.round(baseScore)
}
