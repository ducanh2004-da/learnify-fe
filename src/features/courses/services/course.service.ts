import { apiConfig } from '@/configs'
import { Course, Enrollment } from '../types'

export const courseService = {
  getAllCourses: async (): Promise<Course[]> => {
    const response = await apiConfig.post('', {
      query: `
        query GetAllCourses {
          getAllCourses {
            id
            courseName
            abstract
            createdAt
            updatedAt
            keyLearnings
          }
        }
      `
    })
    return response.data.data.getAllCourses
  },
  getCourseById: async (id: string): Promise<Course> => {
    const response = await apiConfig.post('', {
      query: `
        query GetCourseById($id: String!) {
          getCourseById(id: $id) {
            id
            courseName
            abstract
            createdAt
            updatedAt
            keyLearnings
          }
        }
      `,
      variables: { id }
    })
    return response.data.data.getCourseById
  },
  enrollCourse: async (userId: string, courseId: string, totalLessons: number): Promise<Enrollment> => {
    const response = await apiConfig.post('', {
      query: `
        mutation EnrollCourse($input: CreateEnrollmentInput!) {
          enrollCourse(input: $input) {
            userId
            courseId
            enrolledAt
          }
        }
      `,
      variables: { 
        input: { 
          userId,
          courseId,
          totalLessons
        }
      }
    })
    return response.data.data.enrollCourse
  },
  getUserEnrollments: async (userId: string): Promise<Enrollment[]> => {
    const response = await apiConfig.post('', {
      query: `
        query GetUserEnrollments($userId: String!) {
          getUserEnrollments(userId: $userId) {
            userId
            courseId
            enrolledAt
          }
        }
      `,
      variables: { userId }
    })
    return response.data.data.getUserEnrollments
  },
  getCourseByUserId: async (userId: string): Promise<Course[]> => {
    const response = await apiConfig.post('', {
      query: `
      query GetCourseByUserId($userId: String!) {
  getCourseByUserId(userId: $userId) {
    abstract
    courseName
    createdAt
    id
    keyLearnings
    updatedAt
  }
}`,
      variables: { userId }
    })
    return response.data.data.getCourseByUserId
  },
}