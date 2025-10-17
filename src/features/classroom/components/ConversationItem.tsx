import { Icon } from '@iconify/react'
import { cn, formatDate } from '@/lib'
import { Conversation } from '../types'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  isUpdateLoading?: boolean
  isDeleteLoading?: boolean
  onClick: (conversation: Conversation) => void
  onUpdate?: (conversation: Conversation, newName: string) => void
  onDelete?: (conversation: Conversation) => void
}

const ConversationItem = ({ 
  conversation, 
  isSelected, 
  isUpdateLoading = false,
  isDeleteLoading = false,
  onClick,
  onDelete,
  onUpdate  
}: ConversationItemProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false)
  const [newName, setNewName] = useState<string>(conversation.name)
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNewName(conversation.name)
    setShowEditDialog(true)
  }
  
  const handleConfirmDelete = () => {
    onDelete?.(conversation)
  }
  
  const handleConfirmUpdate = () => {
    if (newName.trim() && newName.trim() !== conversation.name) {
      onUpdate?.(conversation, newName.trim())
    }
    setShowEditDialog(false)
  }
  
  return (
    <>
      <div 
        id={`conversation-${conversation.id}`}
        onClick={() => onClick(conversation)}
        className={cn(
          'p-4 mt-1 rounded-lg bg-black/40 hover:bg-black/50 cursor-pointer text-white transition-colors drop-shadow-lg',
          'border border-white/20 hover:border-white/20 group',
          isSelected && 'bg-black/20 border-black/30'
        )}
      >
        <div className="flex items-start justify-between gap-3.5">
          <div className="flex-1 overflow-hidden">
            <h3 className="text-[1.4rem] font-medium text-white truncate -mb-[.05rem] drop-shadow-lg">
              {conversation.name}
            </h3>
            <p className="text-[1.1rem] text-white/70 drop-shadow-lg">
              {formatDate(conversation.updatedAt)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {onUpdate && (
              <Button 
                onClick={handleEditClick}
                disabled={isUpdateLoading}
                className={cn(
                  'flex items-center justify-center !p-0 size-7 bg-white/10 hover:bg-white/30 rounded-full drop-shadow-lg transition-colors',
                  (isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
                )}
              >
                <Icon icon="lucide:edit" className="text-[0.9rem] text-white" />
              </Button>
            )}
            
            {onDelete && (
              <Button 
                onClick={handleDeleteClick}
                disabled={isDeleteLoading}
                className={cn(
                  'flex items-center justify-center !p-0 size-7 bg-white/10 hover:bg-white/30 rounded-full drop-shadow-lg transition-colors',
                  (isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
                )}
              >
                <Icon icon="lucide:trash-2" className="text-[0.9rem] text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white/20 backdrop-blur-[16px] border border-white/20 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[1.6rem] font-semibold text-white drop-shadow-lg">
              Delete Conversation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 text-[1.25rem] drop-shadow-lg">
              Are you sure you want to delete the conversation <span className="font-medium text-white uppercase">{conversation.name}</span> ? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-4">
            <AlertDialogCancel 
              className="flex-1 h-14 bg-white/10 hover:bg-white/20 rounded-full text-white hover:text-white border-white/20 text-[1.3rem] drop-shadow-lg"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="flex-1 h-14 bg-black hover:bg-black/80 rounded-full text-white text-[1.3rem] drop-shadow-lg"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white/20 backdrop-blur-[16px] border border-white/20 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[1.6rem] font-semibold text-white drop-shadow-lg">
              Edit Conversation
            </DialogTitle>
            <DialogDescription className="text-white/80 text-[1.25rem] drop-shadow-lg">
              Enter a new name for your conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter conversation name"
              className="drop-shadow-lg h-15 !text-[1.25rem] text-white bg-black/30 border-black/40 focus:border-white/40 placeholder:text-white/50 rounded-full px-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isUpdateLoading && newName.trim() && newName.trim() !== conversation.name) {
                  handleConfirmUpdate()
                }
              }}
            />
          </div>
          
          <DialogFooter className="mt-4 gap-4">
            <Button 
              variant="outline"
              className="flex-1 h-14 bg-white/10 hover:bg-white/20 rounded-full text-white hover:text-white border-white/20 text-[1.3rem] drop-shadow-lg"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              className={cn(
                'flex-1 h-14 bg-primary/80 hover:bg-primary rounded-full text-white text-[1.3rem] drop-shadow-lg transition-all duration-(--duration-main)',
                (!newName.trim() || newName.trim() === conversation.name || isUpdateLoading) && 'opacity-70 pointer-events-none'
              )}
              onClick={handleConfirmUpdate}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ConversationItem