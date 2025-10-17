interface Message {
  id: string
  content: string | null
  senderType: string
  conversationId: string
  timestamp: string
}

export type { Message }