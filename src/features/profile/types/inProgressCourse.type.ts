interface InProgressCourse {
    count: number
    courses: {
      abstract: string
      courseName: string
      id: string
      isDone: boolean
      keyLearnings: string[]
    }[],
    progress: number
}

export type { InProgressCourse }