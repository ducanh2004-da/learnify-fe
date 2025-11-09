import { apiConfig } from '@/configs'
import { Lesson } from '../types'
import { CreateLessonResponse, LessonContent } from '../types';

const GRAPHQL_URL = import.meta.env.VITE_API_BACKEND_URL ?? "https://learnify-be.onrender.com/graphql";

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
  },

  createLesson: async (
    file: File,
    courseId: string,
    lessonName: string,
    abstract: string
  ): Promise<CreateLessonResponse> => {
    // GraphQL mutation (note: variable names match operations/map below)
    const mutation = `
      mutation CreateLessonFromAi($data: CreateLessonFromAiInput!, $pdfFile: Upload!) {
        createLessonFromAi(data: $data, pdfFile: $pdfFile) {
          lesson_id
          content {
            url_pdf
            content
          }
        }
      }
    `

    const operations = JSON.stringify({
      query: mutation,
      variables: {
        data: { course_id: courseId, lessonName, abstract },
        pdfFile: null
      }
    })

    // map for graphql-multipart-request-spec
    const map = JSON.stringify({ '0': ['variables.pdfFile'] })

    const formData = new FormData()
    formData.append('operations', operations)
    formData.append('map', map)
    formData.append('0', file, file.name)

    // Use apiConfig.post('', ...) so it respects apiConfig.baseURL (same style as other methods)
    const res = await apiConfig.post('', formData, {
      headers: {
        // Let axios set the correct boundary for multipart; explicit header is OK but not required.
        'Content-Type': 'multipart/form-data'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      // ensure cookies (httpOnly) are sent if your axios instance doesn't already set this globally
      withCredentials: true
    })

    const json = res.data
    if (json?.errors && json.errors.length > 0) {
      throw new Error(json.errors[0]?.message || JSON.stringify(json.errors))
    }
    if (!json.data?.createLessonFromAi) {
      throw new Error('Invalid response from createLessonFromAi')
    }
    return json.data.createLessonFromAi as CreateLessonResponse
  }

}