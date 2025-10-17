export interface Notes {
  id: string;
  title: string;
  content: string;
  enrollmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  enrollmentId: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

export interface NoteDraft {
  title: string;
  content: string;
}

export type NoteId = string;