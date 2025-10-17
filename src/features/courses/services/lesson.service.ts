import { apiConfig } from '@/configs'
import { Lesson } from '../types'

export const lessonService = {
  getAllLessons: async () => {
    const response = await apiConfig.post('', {
      query: `
        query GetAllLessons {
          getAllLessons {
            id
            lessonName
            abstract
            courseId
            createdAt
            updatedAt
          }
        }
      `
    })
    return response.data.data.getAllLessons
  },
  getLessonsByCourseId: async (id: string): Promise<Lesson[]> => {
    const response = await apiConfig.post('', {
      query: `
        query GetLessonsByCourseId($id: String!) {
          getLessonsByCourseId(id: $id) {
            id
            lessonName
            abstract
            courseId
            createdAt
            updatedAt
          }
        }
      `,
      variables: { id }
    })
    return response.data.data.getLessonsByCourseId
  },
  getLessonById: async (id: string): Promise<Lesson> => {
    const response = await apiConfig.post('', {
      query: `
        query GetLessonById($id: String!) {
          getLessonById(id: $id) {
            id
            lessonName
            abstract
            courseId
            createdAt
            updatedAt
          }
        }
      `,
      variables: { id }
    })
    return response.data.data.getLessonById
  },
  createLessonExplanation: async (emotion: string, lessonId: string, userId: string, courseId: string): Promise<any> => {
    const response = await apiConfig.post('', {
      query: `
        mutation CreateLessonExplanation($data: CreateLessonExplanationInput!) {
          createLessonExplanation(data: $data) {
            id
            content
            createdAt
            updatedAt
          }
        }
      `,
      variables: { 
        data: {
          emotion,
          lessonId,
          userId,
          courseId
        }
      }
    })
    return response.data.data.createLessonExplanation
  },
  getLessonExplanationByLessonAndUser: async (lessonId: string, userId: string): Promise<any> => {
    const response = await apiConfig.post('', {
      query: `
        query LessonExplanationByLessonAndUser($lessonId: String!, $userId: String!) {
          lessonExplanationByLessonAndUser(lessonId: $lessonId, userId: $userId) {
            id
            content
            createdAt
            updatedAt
          }
        }
      `,
      variables: { lessonId, userId }
    })
    return response.data.data.lessonExplanationByLessonAndUser
  }
}