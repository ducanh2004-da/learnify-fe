import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import ConversationItem from '@/features/classroom/components/ConversationItem';

interface Props {
  zoomConversationBox: boolean;
  setZoomConversationBox: (v: boolean) => void;
  conversations: any[];
  isError?: boolean;
  isPendingData?: boolean;
  isRefetching?: boolean;
  showCreateForm: boolean;
  newConversationName: string;
  newConversationInputRef: React.RefObject<HTMLInputElement | null>;
  isCreatingConversation: boolean;
  toggleCreateForm: () => void;
  setNewConversationName: (v: string) => void;
  handleCreateConversation: () => void;
  updatingConversationId?: string | null;
  deletingConversationId?: string | null;
  handleSelectConversation: (c: any) => void;
  selectedConversationId?: string | null;
  handleUpdateConversation: (c?: any) => void;
  handleDeleteConversation: (c?: any) => void;
}

const ConversationSkeleton = () => <div className="h-12 bg-slate-100 rounded" />;

export default function ConversationsPanel(props: Props) {
  const {
    zoomConversationBox,
    setZoomConversationBox,
    conversations,
    isError,
    isPendingData,
    isRefetching,
    showCreateForm,
    newConversationName,
    newConversationInputRef,
    isCreatingConversation,
    toggleCreateForm,
    setNewConversationName,
    handleCreateConversation,
    updatingConversationId,
    deletingConversationId,
    handleSelectConversation,
    selectedConversationId,
    handleUpdateConversation,
    handleDeleteConversation,
  } = props;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="zoom-btn fixed top-3 right-4 flex flex-col gap-3 z-50">
          <Button
            onClick={() => setZoomConversationBox(!zoomConversationBox)}
            variant="outline"
            className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg"
          >
            <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
          </Button>
        </div>
        <div>
          <div className="text-2xl font-semibold">My Conversations</div>
        </div>
      </div>

      <ul className={`mt-3 space-y-3 text-sm overflow-y-auto max-h-25 ${zoomConversationBox ? 'hidden' : ''}`}>
        {Array.isArray(conversations) && conversations.length > 0 ? (
          conversations.map((item: any) => (
            <ConversationItem
              key={item.id}
              conversation={item}
              isSelected={selectedConversationId === item.id}
              isUpdateLoading={updatingConversationId === item.id}
              isDeleteLoading={deletingConversationId === item.id}
              onClick={handleSelectConversation}
              onUpdate={handleUpdateConversation}
              onDelete={handleDeleteConversation}
            />
          ))
        ) : (
          <li className="text-slate-400">No conversation</li>
        )}
      </ul>

      {showCreateForm ? (
        <div className="flex-1 flex flex-col">
          <div className="mt-auto mb-4.5">
            <input
              ref={newConversationInputRef}
              value={newConversationName}
              onChange={(e) => setNewConversationName(e.target.value)}
              placeholder="Enter conversation name"
              className={`drop-shadow-lg h-15 !text-[1.25rem] text-white bg-black/10 border-white/20 focus:border-white/40 placeholder:text-white/50 rounded-full px-6 ${isCreatingConversation ? 'pointer-events-none' : ''}`}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter' && !isCreatingConversation) handleCreateConversation();
                else if (e.key === 'Escape' && !isCreatingConversation) toggleCreateForm();
              }}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-16 bg-yellow-400 hover:bg-yellow/20 rounded-full text-white hover:text-white text-[1.3rem] drop-shadow-lg" onClick={toggleCreateForm} disabled={isCreatingConversation}>Cancel</Button>

            <Button
              variant="default"
              className={`flex-1 h-16 bg-primary/80 cursor-pointer hover:bg-primary rounded-full text-white text-[1.3rem] drop-shadow-lg transition-all ${(!newConversationName.trim() || isCreatingConversation) && 'opacity-70'}`}
              onClick={() => void handleCreateConversation()}
              disabled={!newConversationName.trim() || isCreatingConversation}
            >
              {isCreatingConversation ? (
                <div className="flex items-center justify-center gap-3">
                  <svg viewBox="25 25 50 50" className="size-5">
                    <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
                  </svg>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-3 conversation__list relative">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-full text-white/80">
              <Icon icon="lucide:alert-circle" className="text-[2rem] mb-2 drop-shadow-lg" />
              <p className="text-center drop-shadow-lg">Cannot load conversation list</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 bg-black/10 hover:bg-black/20 text-white hover:text-white rounded-full drop-shadow-lg">Try again</Button>
            </div>
          ) : conversations?.length === 0 && !isPendingData ? (
            <div className="flex flex-col items-center justify-center h-full text-black/80">
              <Icon icon="lucide:message-square" className="text-[2rem] mb-2 drop-shadow-lg" />
              <p className="text-center text-black/80 drop-shadow-lg">No conversations yet.</p>
              <p className="text-center text-sm mb-3 text-black/80 drop-shadow-lg">Create a new conversation to start chatting!</p>
              <Button variant="outline" className={`bg-black/50 hover:bg-black/20 text-white hover:text-white rounded-full drop-shadow-lg ${zoomConversationBox ? 'hidden' : ''}`} onClick={toggleCreateForm}>Create new</Button>
            </div>
          ) : updatingConversationId || deletingConversationId ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="size-14 drop-shadow-lg">
                  <svg viewBox="25 25 50 50" className="loading__svg">
                    <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
                  </svg>
                </div>
                <p className="text-white text-[1.25rem] font-medium drop-shadow-lg">{updatingConversationId ? 'Updating...' : 'Deleting...'}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {isPendingData ? (
                Array(isRefetching ? conversations?.length || 3 : 3).fill(0).map((_, i) => <ConversationSkeleton key={`skeleton-${i}`} />)
              ) : null}
            </div>
          )}
        </div>
      )}

      {!showCreateForm && conversations && conversations.length > 0 && (
        <div className="mt-4">
          <Button variant="default" className={`w-full bg-black/50 hover:bg-black/20 text-white rounded-full h-16 text-[1.3rem] !p-0 drop-shadow-lg ${zoomConversationBox ? 'hidden' : ''}`} onClick={toggleCreateForm}>Create new <Icon icon="lucide:plus" className="!size-[1.4rem]" /></Button>
        </div>
      )}
    </div>
  );
}
