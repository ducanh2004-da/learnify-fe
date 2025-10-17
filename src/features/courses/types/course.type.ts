// type Level = 'Beginner' | 'Intermediate' | 'Advanced'

interface Course {
  id: string
  courseName: string
  abstract: string
  createdAt: string
  updatedAt: string
  keyLearnings: string[]
  // instructor?: string
  // level?: Level
  // duration?: string
  // rating?: number
  // students?: number
  // price?: number
  // category?: string
  image?: {
    name: string
    folder: string
  }
}

export type { Course }