import { apiConfig } from '@/configs'
import { Section } from '../types'

export const sectionService = {
  getSectionByLesson: async (lessonId: string): Promise<Section> => {
    const response = await apiConfig.post('', {
      query: `
        query Query($lessonId: String!) {
  getSectionByLesson(lessonId: $lessonId) {
    urlPdf
    order
    lessonId
    id
    content
    createdAt
  }
}
      `,
      variables: {lessonId}
    })
    return response.data.data.getSectionByLesson
  },
}