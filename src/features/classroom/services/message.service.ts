import { apiConfig } from '@/configs'
import { Message } from '../types'

export const messageService = {
  createMessage: async (
    conversationId: string | null, 
    question: string | null,
    lesson_id: string | null,
    messages: string | null, 
    user_id: string | null,
  ): Promise<Message> => {
    const response = await apiConfig.post('', {
      query: `
        mutation CreateMessage($data: CreateMessage2Input!) {
        createMessage(data: $data) {
          agent
          content
          conversationId
          id
          message
          response
          senderType
          timestamp
          type
        }
      }
      `,
      variables: {
        data: {
          conversationId,
          lesson_id,
          question,
          messages,
          user_id
        }
      }
    })
    console.log(response.data.data.createMessage)
    return response.data.data.createMessage
  },
  messagesByConversation: async (conversationId: string | null) : Promise<Message[]> => {
    const response = await apiConfig.post('', {
      query: `
      query MessagesByConversation($conversationId: String!) {
  messagesByConversation(conversationId: $conversationId) {
    content
    conversationId
    id
    message
    response
    senderType
    timestamp
    type
    agent
  }
}
      `,
      variables: {
        conversationId
      }
    })
    return response.data.data.messagesByConversation
  }
}