import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { cn, useGSAP } from '@/lib'
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/configs'
import { conversationService } from '../services'
import { Conversation } from '../types'
import { useAnimatedBox } from '../hooks'
import { useAuthStore } from '@/stores'
import { useClassroomStore } from '../stores'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import ConversationItem from './ConversationItem'
import ConversationSkeleton from './ConversationSkeleton'

export interface ConversationBoxHandle {
  show: () => void
  hide: () => void
  toggle: () => void
}

interface ConversationBoxProps {
  visible?: boolean
  onVisibilityChange?: (visible: boolean) => void
}

const ConversationBox = forwardRef<ConversationBoxHandle, ConversationBoxProps>(({ 
  visible = true,
  onVisibilityChange
}, ref) => {
  const { user: authUser } = useAuthStore()
  const { selectedConversationId, setSelectedConversationId, isLessonStarted, isExplanationVisible } = useClassroomStore()
  
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
  const [newConversationName, setNewConversationName] = useState<string>('')
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null)
  const [updatingConversationId, setUpdatingConversationId] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const conversationBoxRef = useRef<HTMLDivElement>(null)
  const collapseButtonRef = useRef<HTMLButtonElement>(null)
  const collapseButtonContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const expandIconRef = useRef<HTMLDivElement>(null)
  const newConversationInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    data: conversations, 
    isLoading, 
    isError,
    isFetching 
  } = useQuery({
    queryKey: ['myConversations', authUser?.id],
    queryFn: conversationService.getMyConversations,
    enabled: !!authUser?.id
  })
  
  const createConversationMutation = useMutation({
    mutationFn: (name: string) => conversationService.createConversation(name, authUser?.id || ''),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['myConversations', authUser?.id] })
      // setSelectedConversationId(newConversation.id)
      setNewConversationName('')
      setShowCreateForm(false)
      
      toast.success(`Conversation "${newConversation.name}" created successfully`, {
        duration: 2000
      })
    },
    onError: (error) => {
      toast.error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 3000
      })
    }
  })
  
  const updateConversationMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => conversationService.updateConversation(id, name),
    onSuccess: (updatedConversation) => {
      queryClient.invalidateQueries({ queryKey: ['myConversations', authUser?.id] })
      
      toast.success(`Conversation renamed to "${updatedConversation.name}" successfully`, {
        duration: 2000
      })
      setUpdatingConversationId(null)
    },
    onError: (error) => {
      toast.error(`Failed to update conversation: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 3000
      })
      setUpdatingConversationId(null)
    }
  })
  
  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => conversationService.deleteConversation(id),
    onSuccess: (deletedConversation) => {
      queryClient.invalidateQueries({ queryKey: ['myConversations', authUser?.id] })
      
      if (selectedConversationId === deletedConversation.id) {
        setSelectedConversationId(null)
      }
      
      toast.success(`Conversation "${deletedConversation.name}" deleted successfully`, {
        duration: 2000
      })
      setDeletingConversationId(null)
    },
    onError: (error) => {
      toast.error(`Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 3000
      })
      setDeletingConversationId(null)
    }
  })
  
  const { 
    isVisible,
    isAnimating,
    showBox: showConversationBox,
    hideBox: hideConversationBox,
    toggleBox: toggleConversationBox,
    setupVisibleState,
    setupHiddenState
  } = useAnimatedBox(
    {
      containerRef,
      boxRef: conversationBoxRef,
      expandIconRef,
      collapseButtonContainerRef,
      contentRef,
      titleRef,
      subtitleRef
    },
    {
      expandedWidth: '30rem',
      expandedHeight: '40rem',
      collapsedSize: '3.5rem',
      expandedBorderRadius: '1.25rem',
      collapsedBorderRadius: '50%'
    },
    visible,
    onVisibilityChange
  )
  
  useGSAP(() => {
    if (isVisible) {
      setupVisibleState()
    } else {
      setupHiddenState()
    }
    
    if (visible !== isVisible && !isAnimating) {
      if (visible) showConversationBox()
      else hideConversationBox()
    }
  }, { scope: containerRef, dependencies: [isVisible, visible, isAnimating] })

  useImperativeHandle(ref, () => ({
    show: showConversationBox,
    hide: hideConversationBox,
    toggle: toggleConversationBox
  }))

  const handleSelectConversation = (conversation: Conversation) => {
    if (selectedConversationId === conversation.id) {
      setSelectedConversationId(null)
      return
    }
    
    setSelectedConversationId(conversation.id)
  }
  
  const handleCreateConversation = () => {
    if (!newConversationName.trim()) {
      return
    }
    
    createConversationMutation.mutate(newConversationName.trim())
  }
  
  const handleUpdateConversation = (conversation: Conversation, newName: string) => {
    if (conversation.id && newName.trim() !== conversation.name) {
      setUpdatingConversationId(conversation.id)
      updateConversationMutation.mutate({ id: conversation.id, name: newName.trim() })
    }
  }
  
  const handleDeleteConversation = (conversation: Conversation) => {
    if (conversation.id) {
      setDeletingConversationId(conversation.id)
      deleteConversationMutation.mutate(conversation.id)
    }
  }
  
  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm)
    
    if (!showCreateForm) {
      setTimeout(() => {
        newConversationInputRef.current?.focus()
      }, 100)
    } else {
      setNewConversationName('')
    }
  }
  
  const isRefetching = isFetching && !isLoading && !deleteConversationMutation.isPending
  const isLoadingData = isLoading || isRefetching
  const isMutating = createConversationMutation.isPending || 
    deleteConversationMutation.isPending || 
    updateConversationMutation.isPending
  
  useEffect(() => {
    if (isLessonStarted && !isExplanationVisible) {
      if (isVisible) {
        hideConversationBox()
      }
    }
  }, [isLessonStarted, isVisible, hideConversationBox, isExplanationVisible])
  
  return (
    <div ref={containerRef} className="absolute top-1/2 -translate-y-1/2 right-[1.65rem] flex items-center justify-center z-50">
      <div 
        ref={conversationBoxRef}
        className={cn(
          'bg-white/20 backdrop-blur-[16px] border border-white/20',
          'flex items-center justify-center overflow-visible relative'
        )}
      >
        <div 
          ref={collapseButtonContainerRef} 
          className="absolute -left-[1.2rem] top-1/2 -translate-y-1/2 z-20"
        >
          <Tooltip
            content="Minimize box"
            contentClassName="text-[1.25rem] z-[60]"
            position="left"
          >
            <Button
              ref={collapseButtonRef}
              onClick={toggleConversationBox}
              variant="outline"
              className="rounded-full bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30 text-black hover:text-black !p-0 size-9 drop-shadow-lg"
              disabled={isMutating}
            >
              <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
            </Button>
          </Tooltip>
        </div>
        
        <div 
          ref={expandIconRef}
          className={cn(
            'flex items-center justify-center size-full relative',
            isExplanationVisible ? 'cursor-pointer' : 'pointer-events-none'
          )}
          onClick={isExplanationVisible ? showConversationBox : undefined}
        >
          <Icon icon="mdi:conversation-plus-outline" className="text-[1.75rem] text-black drop-shadow-lg" />
          
          <Tooltip 
            content="View conversations"
            className="absolute inset-0 z-[51]"
            contentClassName="text-[1.25rem] z-[60]"
            position="left"
          />
        </div>
        
        <div 
          ref={contentRef} 
          className="size-full flex flex-col justify-between px-[1.6rem] py-[1.4rem]"
        >
          <div className="flex flex-col mb-4">
            <p 
              ref={titleRef}
              className="text-[1.8rem] font-semibold text-black drop-shadow-lg -mb-[.05rem]"
            >
              Your Conversations
            </p>
            <p 
              ref={subtitleRef}
              className="text-[1.2rem] text-black/80 font-normal drop-shadow-lg"
            >
              {isRefetching
                ? 'Updating conversations...'
                : isLoading
                  ? 'Loading conversations...'
                  : showCreateForm 
                    ? 'Enter a name for your conversation'
                    : 'Select a conversation to continue'}
            </p>
          </div>
          
          {showCreateForm ? (
            <div className="flex-1 flex flex-col">
              <div className="mt-auto mb-4.5">
                <Input
                  ref={newConversationInputRef}
                  value={newConversationName}
                  onChange={(e) => setNewConversationName(e.target.value)}
                  placeholder="Enter conversation name"
                  className={cn(
                    'drop-shadow-lg h-15 !text-[1.25rem] text-black bg-white/10 border-white/20 focus:border-white/40 placeholder:text-black/50 rounded-full px-6',
                    createConversationMutation.isPending && 'pointer-events-none'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !createConversationMutation.isPending) {
                      handleCreateConversation()
                    } else if (e.key === 'Escape' && !createConversationMutation.isPending) {
                      toggleCreateForm()
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1 h-16 bg-white/10 hover:bg-white/20 rounded-full text-black hover:text-black border-white/20 text-[1.3rem] drop-shadow-lg"
                  onClick={toggleCreateForm}
                  disabled={createConversationMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default"
                  className={`flex-1 h-16 bg-primary/80 hover:bg-primary rounded-full text-black text-[1.3rem] drop-shadow-lg transition-all duration-(--duration-main) ${(!newConversationName || createConversationMutation.isPending) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  onClick={handleCreateConversation}
                  disabled={!newConversationName.trim() || createConversationMutation.isPending}
                >
                  {createConversationMutation.isPending ? (
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
                <div className="flex flex-col items-center justify-center h-full text-black/80">
                  <Icon icon="lucide:alert-circle" className="text-[2rem] mb-2 drop-shadow-lg" />
                  <p className="text-center drop-shadow-lg">Cannot load conversation list</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline" 
                    className="mt-4 bg-white/10 hover:bg-white/20 text-black hover:text-black rounded-full drop-shadow-lg"
                  >
                    Try again
                  </Button>
                </div>
              ) : conversations?.length === 0 && !isLoadingData ? (
                <div className="flex flex-col items-center justify-center h-full text-black-400">
                  <Icon icon="lucide:message-square" className="text-[2rem] mb-2 drop-shadow-lg" />
                  <p className="text-center drop-shadow-lg text-black-400">No conversations yet.</p>
                  <p className="text-center text-sm mb-3 drop-shadow-lg text-black-400">Create a new conversation to start chatting!</p>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 hover:bg-white/20 text-black hover:text-black rounded-full drop-shadow-lg"
                    onClick={toggleCreateForm}
                  >
                    Create new
                  </Button>
                </div>
              ) : updateConversationMutation.isPending || deleteConversationMutation.isPending ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-14 drop-shadow-lg">
                      <svg viewBox="25 25 50 50" className="loading__svg">
                        <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
                      </svg>
                    </div>
                    <p className="text-black text-[1.25rem] font-medium drop-shadow-lg">
                      {updateConversationMutation.isPending ? 'Updating...' : 'Deleting...'}
                    </p>
                  </div>
                </div>
              ): (
                <div className="flex flex-col gap-4">
                  {isLoadingData ? (
                    Array(isRefetching ? conversations?.length || 3 : 3).fill(0).map((_, index) => (
                      <ConversationSkeleton key={`skeleton-${index}`} />
                    ))
                  ) : (
                    conversations?.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        isUpdateLoading={updatingConversationId === conversation.id}
                        isDeleteLoading={deletingConversationId === conversation.id}
                        onClick={handleSelectConversation}
                        onUpdate={handleUpdateConversation}
                        onDelete={handleDeleteConversation}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          {!showCreateForm && conversations && conversations.length > 0 && (
            <div className="mt-4">
              <Button 
                variant="default"
                className={cn(
                  'w-full bg-primary/80 hover:bg-primary text-black rounded-full h-16 text-[1.3rem] !p-0 drop-shadow-lg',
                  isMutating && 'opacity-70 pointer-events-none'
                )}
                onClick={toggleCreateForm}
              >
                Create new
                <Icon icon="lucide:plus" className="!size-[1.4rem]" /> 
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ConversationBox.displayName = 'ConversationBox'

export default ConversationBox