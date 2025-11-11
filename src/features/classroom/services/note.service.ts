import { apiConfig } from '@/configs'
import { Notes, CreateNoteInput, UpdateNoteInput } from '../types'

export const noteService = {
    getNotesByEnrollment: async(enrollmentId: string | null): Promise<Notes[]> => {
        const response = await apiConfig.post('', {
            query: `
            query GetNotesByEnrollment($enrollmentId: String!) {
  getNotesByEnrollment(enrollmentId: $enrollmentId) {
    title
    id
    enrollmentId
    createdAt
    content
  }
}`,
            variables: { enrollmentId }
        })
        return response.data.data.getNotesByEnrollment
    },


    async createNote(data: CreateNoteInput): Promise<Notes> {
        const response = await apiConfig.post('', {
            query: `
            mutation Mutation($data: CreateNoteInput!) {
  createNote(data: $data) {
    message
    data {
      title
      id
      enrollmentId
      createdAt
      content
    }
  }
}`,
            variables: {
                data
            }
        })
        return response.data.data.createNote.data
    },
    async deleteNote(id: string): Promise<{ success: boolean; message: string }> {
        const response = await apiConfig.post('', {
            query: `
            mutation Mutation($deleteNoteId: String!) {
  deleteNote(id: $deleteNoteId) {
    message
    data {
      title
      id
      enrollmentId
      createdAt
      content
    }
  }
}`,
            variables: { deleteNoteId: id }
        })
        return response.data.data.deleteNote
    },
    async updateNote(id: string, data: UpdateNoteInput): Promise<Notes> {
        const response = await apiConfig.post('', {
            query: `
            mutation UpdateNote($updateNoteId: String!, $data: UpdateNoteInput!) {
  updateNote(id: $updateNoteId, data: $data) {
    message
    data {
      title
      id
      enrollmentId
      createdAt
      content
    }
  }
}`,
            variables: { updateNoteId: id, data: data }
        })
        return response.data.data.updateNote.data
    }
}