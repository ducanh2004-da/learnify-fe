// Chat.tsx
import { useState, ChangeEvent } from 'react';
import { Icon } from '@iconify/react';
import { useDebounceValue } from 'usehooks-ts';

import { Input } from '@/components/ui/input';
import { MainDropdown } from '@/components';
import UserList from './../../features/chat/components/UserList';
import { useChatStore } from '@/stores/chat.store';
import ChatWindow from './../../features/chat/components/ChatWindow';

export default function ChatPage() {
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [debouncedSearchTerm] = useDebounceValue(searchInputValue, 500);

  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const openChat = useChatStore((s) => s.openChat);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  const handleSelectUser = (u: any) => {
    setSelectedUserId(u.id ?? null);
    // TODO: mở conversation, connect websocket, fetch messages, ...
    openChat(u?.id, u?.username);
  };

  const handleClearFilters = () => {
    setSearchInputValue('');
  };

  return (
    <div className="w-full px-24 py-10">
      <h1 className="element-animation text-[2.5rem] font-bold mb-3.5">Connect with your friend</h1>

      <section className="w-full mb-8">
        <div className="flex flex-col space-y-6 mb-8 border-b-[.125rem] border-gray-300 pb-9">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="element-animation relative w-[26.5rem]">
                <Input
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  placeholder="Search friends..."
                  className="w-full h-[3.785rem] pl-12 pr-10 text-[1.25rem] border border-slate-200 rounded-full focus:outline-none focus:border-primary/50 transition-colors"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                  <Icon icon="ph:magnifying-glass" className="text-2xl" />
                </div>
                {searchInputValue !== debouncedSearchTerm && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Icon icon="ph:clock-light" className="text-xl" />
                  </div>
                )}
              </div>
            </div>

            <MainDropdown
              value={itemsPerPage}
              options={[10, 20, 50, 100]}
              onChange={setItemsPerPage}
              placeholder="Show items"
              minWidth="140px"
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left column: user list */}
          <div className="w-full lg:w-96">
            {/* UserList tự fetch dữ liệu. Truyền search + itemsPerPage + callback chọn user */}
            <UserList
              searchTerm={debouncedSearchTerm}
              itemsPerPage={itemsPerPage}
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
              showSearch={false}
            />
          </div>

          {/* Right column: placeholder chat panel */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 min-h-[28rem]">
            {selectedUserId ? (
              <div>
                <ChatWindow />
                {/* TODO: render chat window here */}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <Icon icon="ph:chat-teardrop-dots-light" className="text-[4.5rem] mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Select a friend to start chatting</h3>
                <p>Choose a user from the left to open the conversation.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 rounded-full bg-primary text-white px-6 py-2 text-base border border-primary font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
