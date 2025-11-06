import { apiConfig } from '@/configs'
import { User } from '@/features/classroom/types/user.type'
import { courses } from './../../../mocks/courses.mock';
import { CompleteCourse } from '../types/completeCourse.type';
import { InProgressCourse } from '../types/inProgressCourse.type';
export const profileService = {
  getUserById: async () : Promise<User> => {
    
    const response = await apiConfig.post('', {
      query: `
        query User {
          user {
            id
            username
            email
            phoneNumber
            role
            createdAt
            updatedAt
          }
        }
      `,
    })

    const userData = response.data.data.user;
    return {
      ...userData,
      stats: userData.stats || {
        coursesCompleted: 0,
        inProgress: 0,
        totalHours: 0,
        certificates: 0
      }
    }
  },

  getCompletedCourses: async (userId: string) : Promise<CompleteCourse> => {
    if (!userId) throw new Error('User ID is required');
    
    const response = await apiConfig.post('', {
      query: `
        query CountSuccessEnrollments($userId: String!) {
  countSuccessEnrollments(userId: $userId) {
    count
    data {
      abstract
      courseName
      id
      isDone
      keyLearnings
    }
  }
}
      `,
      variables: { userId: userId }
    });

    const count = response.data.data.countSuccessEnrollments.count? response.data.data.countSuccessEnrollments.count : 0;
    const courses = response.data.data.countSuccessEnrollments.data? response.data.data.countSuccessEnrollments.data : [];
    return {
      count,
      courses
    };
  },

  getInProgressCourses: async (userId: string) : Promise<InProgressCourse> => {
    if (!userId) throw new Error('User ID is required');
    
    const response = await apiConfig.post('', {
      query: `
        query CountInProgressEnrollments($userId: String!) {
  countInProgressEnrollments(userId: $userId) {
    count
    progress
    data {
      abstract
      courseName
      isDone
      keyLearnings
    }
  }
}
      `,
      variables: { userId: userId }
    });

    const count = response.data.data.countInProgressEnrollments.count? response.data.data.countInProgressEnrollments.count : 0;
    const courses = response.data.data.countInProgressEnrollments.data? response.data.data.countInProgressEnrollments.data : [];
    const progress = response.data.data.countInProgressEnrollments.progress? response.data.data.countInProgressEnrollments.progress : 0;
    return {
      count,
      courses,
      progress
    };
  }
}