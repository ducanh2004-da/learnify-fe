import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import { useChatSocket } from '@/hooks/useChatSocket';

export default function ChatWindow() {
  const { activeConversation, open, closeChat } = useChatStore();
  const auth = useAuthStore();
  const convId = activeConversation?.id ?? null;

  const { messages, sendMessage, connected, loading } = useChatSocket({
    conversationId: convId,
  });

  const [text, setText] = useState('');
  const currentUserId = auth.user?.id ?? auth.userDetails?.id;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    sendMessage(trimmed);
    setText('');
  };

  if (!open || !activeConversation) return null;

  const getTitle = () => {
    if (activeConversation.title) return activeConversation.title;

    const otherUsers = activeConversation.participants
      ?.filter((p) => p.userId !== currentUserId)
      .map((p) => p.user?.username)
      .filter(Boolean);

    return otherUsers.join(', ') || 'Chat';
  };

  return (
    // NOTE: not fixed — this container will fill the parent right-column
    <div className="w-full h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header (sticky) */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="font-semibold text-lg">{getTitle()}</div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'}`}
            />
            <span>{connected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* You can add more header actions here */}
          <button
            onClick={() => closeChat()}
            className="text-white hover:text-gray-200 transition-colors text-xl"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages area (flex-1) */}
      <div ref={scrollRef} id="chat-scroll" className="p-4 flex-1 overflow-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Đang tải tin nhắn...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-center">
              <div className="text-2xl mb-2">💬</div>
              <div>Chưa có tin nhắn nào</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((m) => {
              const mine = m.senderId === currentUserId;
              const isTemp = m.id?.startsWith('temp-');

              return (
                <div key={m.id} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`
                      ${mine ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}
                      rounded-lg px-3 py-2 max-w-[70%] shadow-sm
                      ${isTemp ? 'opacity-50' : ''}
                    `}
                  >
                    {!mine && (
                      <div className="text-xs font-semibold text-indigo-600 mb-1">
                        {m.sender?.username || 'Unknown'}
                      </div>
                    )}
                    <div className="break-words whitespace-pre-wrap">{m.content}</div>
                    <div className={`text-xs mt-1 text-right ${mine ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {isTemp && ' ⏳'}
                      {/* Optional: if failed flag exists, show indicator */}
                      {(m as any).failed && (
                        <span className="text-amber-600 ml-2"> (Thất bại)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input (sticky bottom behavior inside layout) */}
      <div className="px-4 py-3 border-t bg-white">
        {!connected && (
          <div className="mb-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            ⚠️ Đang kết nối...
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            placeholder={connected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
