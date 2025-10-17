// type Level = 'Beginner' | 'Intermediate' | 'Advanced'

interface CreateCourse {
  abstract: string
  courseName: string
  createdAt: string
  keyLearnings: string[]
}

export type { CreateCourse }