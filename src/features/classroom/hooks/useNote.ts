import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/configs';
import { noteService } from '../services/note.service';
import { Notes, CreateNoteInput, UpdateNoteInput } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = 'notes';

export function useNotes(enrollmentId: string | null) {
  return useQuery<Notes[]>({
    queryKey: [QUERY_KEY, enrollmentId ?? null],
    queryFn: () => noteService.getNotesByEnrollment(enrollmentId),
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });
}

export function useCreateNote(enrollmentId: string | null) {
  return useMutation({
    mutationFn: (input: CreateNoteInput) => noteService.createNote(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, enrollmentId ?? null] });
      
      const previous = queryClient.getQueryData<Notes[]>([QUERY_KEY, enrollmentId]) ?? [];
      
      const optimisticNote: Notes = {
        id: `temp-${Date.now()}`,
        ...input,
        enrollmentId: enrollmentId ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Notes[]>(
        [QUERY_KEY, enrollmentId],
        (old = []) => [optimisticNote, ...old]
      );
      
      return { previous, optimisticId: optimisticNote.id };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, enrollmentId], context.previous);
      }
      toast.error('Failed to create note');
      console.error('Create note error:', error);
    },
    onSuccess: (data, _variables, context) => {
      queryClient.setQueryData<Notes[]>(
        [QUERY_KEY, enrollmentId],
        (old = []) => old.map((note) => 
          note.id === context?.optimisticId ? data : note
        )
      );
      toast.success('Note created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, enrollmentId] });
    },
  });
}

export function useUpdateNote(enrollmentId: string | null) {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      noteService.updateNote(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, enrollmentId ?? null] });
      
      const previous = queryClient.getQueryData<Notes[]>([QUERY_KEY, enrollmentId]) ?? [];
      
      queryClient.setQueryData<Notes[]>(
        [QUERY_KEY, enrollmentId],
        (old = []) => old.map((note) =>
          note.id === id
            ? { ...note, ...input, updatedAt: new Date().toISOString() }
            : note
        )
      );
      
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, enrollmentId], context.previous);
      }
      toast.error('Failed to update note');
      console.error('Update note error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, enrollmentId] });
    },
  });
}

export function useDeleteNote(enrollmentId: string | null) {
  return useMutation({
    mutationFn: (id: string) => noteService.deleteNote(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, enrollmentId ?? null] });
      
      const previous = queryClient.getQueryData<Notes[]>([QUERY_KEY, enrollmentId]) ?? [];
      
      queryClient.setQueryData<Notes[]>(
        [QUERY_KEY, enrollmentId],
        (old = []) => old.filter((note) => note.id !== id)
      );
      
      return { previous, deletedId: id };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, enrollmentId], context.previous);
      }
      toast.error('Failed to delete note');
      console.error('Delete note error:', error);
    },
    onSuccess: () => {
      toast.success('Note deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, enrollmentId] });
    },
  });
}