// src/stores/chat.store.ts
import { create } from "zustand";
import { chatService } from "@/features/chat/services/chat.service";
import { useAuthStore } from "./auth.store";
import { toast } from "sonner";
import { Conversation } from "@/features/chat/types/chat.type";

type ChatStore = {
  activeConversation: Conversation | null;
  open: boolean;
  setActiveConversation: (conv: Conversation | null) => void;
  openChat: (userId: string, username?: string) => Promise<void>;
  closeChat: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  activeConversation: null,
  open: false,

  setActiveConversation: (conv) => set({ activeConversation: conv }),

  openChat: async (userId: string, username?: string) => {
  try {
    // ✅ Không gọi hook ở đây. Dùng getState() để lấy dữ liệu auth một cách an toàn.
    const authUser = useAuthStore.getState().user;
    const currentUserId = authUser?.id;
    if (!currentUserId) {
      toast.error("Bạn chưa đăng nhập");
      return;
    }

    const conv = await chatService.createConversation(
      [currentUserId, userId],
      username
    );
    if (!conv) {
      toast.error("Không thể tạo cuộc trò chuyện");
      return;
    }
    set({ activeConversation: conv, open: true });
  } catch (err: any) {
    console.error("openChatWithUser error", err);
    toast.error(err?.message || "Lỗi khi mở chat");
  }
},

  closeChat: () => set({ open: false, activeConversation: null }),
}));
