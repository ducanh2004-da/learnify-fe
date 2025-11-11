import { apiConfig } from '@/configs'
import { Enrollemnt } from '../types/enrollment.type';

export const enrollmentService = {
    findEnrollemnt: async(courseId: string | undefined): Promise<Enrollemnt> =>{
        const response = await apiConfig.post('', {
            query: `
            query Query($courseId: String!) {
  findEnrollment(courseId: $courseId) {
    courseId
    enrolledAt
    id
    userId
  }
}
            `,
            variables: {courseId}
        })
        return response.data.data.findEnrollment
    },
}