// src/types/chat.types.ts
import { User } from "@/types/user.type";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
  sender?: User; 
};

export type ConversationParticipant = {
  id: string;
  conversationId: string;
  userId: string;
  user?: User;
  joinedAt?: string;
};

export type Conversation = {
  id: string;
  title?: string | null;
  isGroup: boolean;
  participants: ConversationParticipant[];
  messages?: Message[]; // optional preloaded messages
  createdAt: string;
  updatedAt: string;
  // optional UI helpers:
  lastMessage?: Message | null;
  unreadCount?: number;
};
