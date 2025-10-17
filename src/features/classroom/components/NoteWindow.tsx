import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Download, UploadCloud, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { Notes, NoteDraft, CreateNoteInput } from '../types';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNote';
import { useAutosave } from '../hooks/useAutosave';

// Constants
const ENROLLMENT_ID = '5904fbff-f79f-4c61-b860-7e449fc5fcf7';
const AUTOSAVE_DELAY = 600;

// Utility functions
function generateExportFilename(): string {
  return `notes-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateContent(content: string, maxLength = 60): string {
  return content.replace(/\n/g, ' ').slice(0, maxLength);
}

export default function NoteWindow() {
  // Data fetching
  const { data: notes = [], isLoading, isError } = useNotes(ENROLLMENT_ID);
  const createNoteMutation = useCreateNote(ENROLLMENT_ID);
  const updateNoteMutation = useUpdateNote(ENROLLMENT_ID);
  const deleteNoteMutation = useDeleteNote(ENROLLMENT_ID);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [draft, setDraft] = useState<NoteDraft | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Computed values
  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId]
  );

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  // Auto-select first note when notes load
  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  // Sync draft when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setDraft({ title: selectedNote.title, content: selectedNote.content });
    } else {
      setDraft(null);
    }
  }, [selectedNote]);

  // Autosave configuration
  const autosave = useAutosave({
    onSave: () => {
      if (selectedNote && draft) {
        const hasChanges =
          draft.title !== selectedNote.title || draft.content !== selectedNote.content;
        
        if (hasChanges) {
          updateNoteMutation.mutate({
            id: selectedNote.id,
            input: { title: draft.title, content: draft.content },
          });
        }
      }
    },
    delay: AUTOSAVE_DELAY,
    enabled: !!selectedNote && !!draft,
  });

  // Actions
  const handleCreateNote = useCallback(() => {
    const input: CreateNoteInput = {
      title: 'New Note',
      content: '',
      enrollmentId: ENROLLMENT_ID,
    };
    
    createNoteMutation.mutate(input, {
      onSuccess: (newNote) => {
        setSelectedId(newNote.id);
      },
    });
  }, [createNoteMutation]);

  const handleDeleteNote = useCallback(
    (id: string) => {
      if (!window.confirm('Are you sure you want to delete this note?')) {
        return;
      }

      deleteNoteMutation.mutate(id, {
        onSuccess: () => {
          if (selectedId === id) {
            const remainingNotes = notes.filter((n) => n.id !== id);
            setSelectedId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
          }
        },
      });
    },
    [deleteNoteMutation, selectedId, notes]
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setDraft((prev) => (prev ? { ...prev, title: value } : { title: value, content: '' }));
      autosave.trigger();
    },
    [autosave]
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setDraft((prev) => (prev ? { ...prev, content: value } : { title: '', content: value }));
      autosave.trigger();
    },
    [autosave]
  );

  const handleSaveNow = useCallback(() => {
    autosave.flush();
  }, [autosave]);

  // Export/Import functionality
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateExportFilename();
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Notes exported successfully');
  }, [notes]);

  const handleImport = useCallback(
    (file: File | null) => {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as Notes[];
          
          if (!Array.isArray(parsed)) {
            throw new Error('Invalid file format');
          }

          for (const note of parsed) {
            const input: CreateNoteInput = {
              title: note.title || 'Imported Note',
              content: note.content || '',
              enrollmentId: ENROLLMENT_ID,
            };
            createNoteMutation.mutate(input);
          }
          
          toast.success(`Importing ${parsed.length} note(s)...`);
        } catch (error) {
          toast.error('Invalid JSON file');
          console.error('Import error:', error);
        }
      };
      reader.readAsText(file);
    },
    [createNoteMutation]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      } else if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote, handleExport]);

  // Render
  return (
    <div className="w-full h-full flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNote}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-3 py-1.5 rounded-lg shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            aria-label="Create new note"
          >
            <Plus size={16} />
            <span className="font-medium">New</span>
          </button>

          <button
            onClick={handleSaveNow}
            disabled={!selectedNote}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Save note now"
            title="Save note now"
          >
            <span className="font-medium">Save</span>
          </button>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-gray-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
              aria-label="Search notes"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            title="Export all notes"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700 transition"
            aria-label="Export notes"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import notes from file"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700 transition"
            aria-label="Import notes"
          >
            <UploadCloud size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-3 h-[520px]">
        {/* Notes list */}
        <aside className="w-[32%] bg-white/80 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-3 overflow-auto">
          {isLoading ? (
            <div className="text-center text-slate-400 py-8">Loading notes...</div>
          ) : isError ? (
            <div className="text-center text-red-400 py-8">Failed to load notes</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              {searchQuery ? 'No notes found' : 'No notes yet — create one!'}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredNotes.map((note) => (
                <li key={note.id}>
                  <motion.div
                    layout
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(note.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(note.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-gray-700 transition ${
                      selectedId === note.id
                        ? 'ring-2 ring-indigo-200 dark:ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : ''
                    }`}
                    aria-pressed={selectedId === note.id}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {note.title || (
                          <span className="italic text-slate-400">Untitled</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-1">
                        {truncateContent(note.content) || 'Empty note'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(note.id);
                        }}
                        title="Edit note"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-gray-600 transition"
                        aria-label="Edit note"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        title="Delete note"
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition"
                        aria-label="Delete note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white/80 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-4 flex flex-col h-full">
            {selectedNote ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <input
                    value={draft?.title ?? ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Note title"
                    className="flex-1 bg-transparent placeholder-slate-400 focus:outline-none font-semibold text-lg"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPreviewMode((prev) => !prev)}
                      title="Toggle preview mode"
                      className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700 transition"
                      aria-pressed={isPreviewMode}
                      aria-label="Toggle preview"
                    >
                      <Edit3 size={16} />
                    </button>
                    <div className="text-xs text-slate-400">
                      {new Date(selectedNote.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto mb-3">
                  {!isPreviewMode ? (
                    <textarea
                      value={draft?.content ?? ''}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Write your note here..."
                      className="w-full h-full resize-none bg-transparent focus:outline-none text-sm leading-6 whitespace-pre-wrap"
                    />
                  ) : (
                    <div className="prose max-w-none dark:prose-invert text-sm whitespace-pre-wrap">
                      {(draft?.content ?? '')
                        .split('\n\n')
                        .map((paragraph, i) => (
                          <p key={i} className="mb-3">
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-gray-700">
                  <div className="text-xs text-slate-400">
                    Words: {draft ? countWords(draft.content) : 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExport}
                      className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:brightness-95 transition text-xs"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-md border border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 transition text-xs"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Select a note to view or edit
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-400">
        Notes saved automatically.{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-700">
          Ctrl/Cmd+N
        </kbd>{' '}
        New note,{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-700">
          Ctrl/Cmd+S
        </kbd>{' '}
        Export
      </div>
    </div>
  );
}