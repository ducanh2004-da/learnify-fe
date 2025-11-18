import { apiConfig } from '@/configs'
import { User } from '@/types/user.type'
import { Message, Conversation } from '../types/chat.type'

export const chatService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiConfig.post('', {
      query: `
        query Query {
  users {
    username
    role
    email
    avatar
    id
    phoneNumber
  }
}
      `
    })
    return response.data.data.users
  },

   // mutation createSocketToken(): String (server-side AuthGuard will read cookie)
  getSocketToken: async (): Promise<string> => {
    const q = `mutation Mutation {
  createSocketToken
}`;
    const resp = await apiConfig.post('', { query: q }, { withCredentials: true });
    if (resp.data?.errors) throw new Error(resp.data.errors[0].message);
    return resp.data.data.createSocketToken;
  },

  // query getMessages(conversationId: String, take: Int)
  getMessages: async (conversationId: string, take = 50): Promise<Message[]> => {
    const q = ` query GetMessages($conversationId: String!) {
  getMessages(conversationId: $conversationId) {
    content
    conversationId
    createdAt
    id
    read
    sender {
      username
      role
      email
      id
      avatar
    }
    senderId
  }
}`;
    const resp = await apiConfig.post('', { query: q, variables: { conversationId, take } }, { withCredentials: true });
    if (resp.data?.errors) throw new Error(resp.data.errors[0].message);
    return resp.data.data.getMessages;
  },

  // query getMyConversations()
  getMyConversations: async (): Promise<Conversation[]> => {
    const q = `query GetMyConversations {
  getMyConversations {
    createdAt
    id
    isGroup
    messages {
      content
      senderId
      sender {
        avatar
        email
        username
        role
      }
      read
      conversationId
      createdAt
      id
      updatedAt
    }
  }
}`;
    try {
    const resp = await apiConfig.post('', { query: q }, { withCredentials: true });
    if (resp.data?.errors) throw new Error(resp.data.errors[0].message);
    return resp.data.data.getMyConversations ?? [];
  } catch (err: any) {
    console.warn('getMyConversations error', err?.message ?? err);
    // nếu lỗi do token thiếu -> trả [] để UI không crash
    return [];
  }
  },

  // optional: create conversation (server GraphQL or REST needed)
   createConversation: async (userIds: string[], title?: string): Promise<Conversation> => {
    const q = `
      mutation CreateConversation($userIds: [String!]!) {
  createConversation(userIds: $userIds) {
    createdAt
    id
    isGroup
    messages {
      content
      read
      id
      conversationId
      sender {
        avatar
        email
        username
        phoneNumber
        id
        role
      }
      senderId
      createdAt
    }
    participants {
      conversationId
      id
      joinedAt
      user {
        avatar
        role
        username
        email
        id
      }
      userId
    }
    title
  }
}
    `;
    const resp = await apiConfig.post('', { query: q, variables: { userIds, title } }, { withCredentials: true });
    if (resp.data?.errors) throw new Error(resp.data.errors[0].message);
    return resp.data.data.createConversation;
  }

}