interface CompleteCourse {
    count: number
    courses: {
      abstract: string
      courseName: string
      id: string
      isDone: boolean
      keyLearnings: string[]
    }[]
}

export type { CompleteCourse }