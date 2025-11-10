// ClassRoom.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState, lazy } from 'react';

// third-party
import { useProgress } from '@react-three/drei';
import { Icon } from '@iconify/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useParams } from 'react-router-dom';

// project aliases / local
import { youtubeLink } from '@/mocks/youtubeLink';
import { quiz } from '@/data/quiz';
import { conversationService } from '@/features/classroom/services/conversation.service';
import { messageService } from '@/features/classroom/services';
import {
  MessageBox,
  useClassroomStore,
  useTeacherSpeech,
  checkAzureSpeechSDK,
} from '@/features/classroom';
import { useAuthStore } from '@/stores';
import { queryClient } from '@/configs';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import QuizDialog from '@/features/classroom/components/QuizDialog';
import { cn } from '@/lib';
import { sectionService } from '@/features/classroom/services';

// lazy scene
const Scene = lazy(() => import('@/features/classroom/components/Scene'));

// child panels
import ConversationsPanel from '@/features/classroom/components/ConversationsPanel';
import ReferencesPanel from '@/features/classroom/components/ReferencesPanel';
import NotePanel from '@/features/classroom/components/NotePanel';
import ScenePanel from '@/features/classroom/components/ScenePanel';

// -------------------- Types --------------------
type Role = 'user' | 'assistant' | string;
type OptionKey = 'a' | 'b' | 'c' | 'd';

interface Message {
  id: number | string;
  role: Role;
  text: string;
  ts?: number;
}

interface Conversation {
  id: string;
  name?: string;
  [k: string]: any;
}

// -------------------- Constants & Helpers --------------------
const STREAM_BASE_DELAY = 60; // ms

function normalizeText(s?: string) {
  if (!s) return '';
  let t = s.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+([,\.!?:;])/g, '$1');
  return t;
}

function tokenize(text: string) {
  if (!text) return [] as string[];
  return text.match(/\S+\s*/g) || [text];
}

function formatTime(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getPreviewImageUrl(url: string) {
  if (!url) return '';
  try {
    // attempt Cloudinary raw -> image transformation
    if (/\/raw\/upload\//i.test(url) && /\.pdf(\?|$)/i.test(url)) {
      return url.replace('/raw/upload/', '/image/upload/').replace(/\.pdf(\?.*)?$/i, '.jpg');
    }
    // fallback: if url ends with .pdf, try to replace extension to jpg (may or may not work)
    if (/\.pdf(\?|$)/i.test(url)) {
      return url.replace(/\.pdf(\?.*)?$/i, '.jpg');
    }
    return url;
  } catch (e) {
    return url;
  }
}

/** Extract first markdown image from a message and return { imgUrl, restText } */
function extractFirstMarkdownImage(text: string) {
  if (!text) return { imgUrl: null as string | null, restText: text };
  const m = text.match(/!\[.*?\]\((.*?)\)/);
  if (m && m[1]) {
    const imgUrl = m[1];
    const rest = text.replace(m[0], '').trim();
    return { imgUrl, restText: rest };
  }
  return { imgUrl: null as string | null, restText: text };
}

/**
 * Collapse consecutive duplicate paragraphs/sentences to avoid repeated text rendering.
 * - Removes consecutive identical paragraphs (split by 2+ newlines)
 * - Then removes consecutive identical sentences inside each paragraph
 */
function collapseRepeatedText(raw: string) {
  if (!raw) return raw;
  let text = String(raw).trim();

  // quick exit for very short text
  if (text.length < 50) return text;

  // 1) collapse consecutive duplicate paragraphs (separated by 2+ newlines)
  const paragraphs = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  const collapsedParas: string[] = [];
  for (const p of paragraphs) {
    if (collapsedParas.length === 0 || p !== collapsedParas[collapsedParas.length - 1]) {
      collapsedParas.push(p);
    }
  }
  text = collapsedParas.join('\n\n');

  // 2) collapse consecutive duplicate sentences inside each paragraph
  const parasAfterSentenceDedupe = text.split('\n\n').map((para) => {
    // split into sentences (keep punctuation)
    const sentences = para.split(/(?<=[.?!])\s+/);
    const out: string[] = [];
    for (const s of sentences) {
      const sTrim = s.trim();
      if (!sTrim) continue;
      // if same as previous sentence exactly, skip
      if (out.length === 0 || out[out.length - 1] !== sTrim) {
        out.push(sTrim);
      }
    }
    return out.join(' ');
  });

  // 3) fallback: if whole text is repeated concatenation of a piece, reduce to single piece
  let final = parasAfterSentenceDedupe.join('\n\n').trim();
  try {
    for (let n = 2; n <= 6; n++) {
      if (final.length % n !== 0) continue;
      const pieceLen = Math.floor(final.length / n);
      const piece = final.slice(0, pieceLen).trim();
      if (!piece) continue;
      let repeated = '';
      for (let i = 0; i < n; i++) repeated += piece;
      if (repeated === final) {
        final = piece;
        break;
      }
    }
  } catch (e) {
    // ignore
  }

  return final;
}

/**
 * Remove leading spaces/tabs on each line (useful when server sends lots of leading indentation)
 */
function trimLeadingSpacesPerLine(s?: string) {
  if (!s) return s ?? '';
  return String(s).replace(/^[ \t]+/gm, '');
}

// -------------------- Component --------------------
export default function ClassRoomPage() {
  // stores / progress
  const authUser = useAuthStore((s) => s.user);
  const { active, progress } = useProgress();
  const setInitialLoad = useClassroomStore((s) => s.setInitialLoad);
  const isThinking = useClassroomStore((s) => s.isThinking);
  const stopAll = useClassroomStore((s) => s.stopAll);
  const isLessonStarted = useClassroomStore((s) => s.isLessonStarted);
  const isExplanationVisible = useClassroomStore((s) => s.isExplanationVisible);

  // UI state
  const [newConversationName, setNewConversationName] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const newConversationInputRef = useRef<HTMLInputElement>(null);

  // control teacher speech
  const { stop: stopAzure, error: azureError, speak, isSpeaking } = useTeacherSpeech();

  // SDK status is handled inside feature hooks/components; we don't keep local sdk state here
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [zoomConversationBox, setZoomConversationBox] = useState<boolean>(true);
  const [zoomReferenceBox, setZoomReferenceBox] = useState<boolean>(true);
  const [zoomNoteBox, setZoomNoteBox] = useState<boolean>(true);
  const [isEndLesson, setEndLesson] = useState<boolean>(false);

  // new states/refs for controlling input
  const [isDisplayingSlide, setIsDisplayingSlide] = useState<boolean>(false);
  const displayingSlideIdRef = useRef<string | null>(null);
  const displayingSlideTimeoutRef = useRef<number | null>(null);
  const [userStopped, setUserStopped] = useState<boolean>(false);

  const pendingRefetchAfterStreamingRef = useRef<boolean>(false);
  // track isSpeaking in a ref to avoid stale closure when awaiting
  const isSpeakingRef = useRef<boolean>(false);
  useEffect(() => {
    isSpeakingRef.current = !!isSpeaking;
  }, [isSpeaking]);

  const { lessonId } = useParams<{ lessonId: string }>();

  // state để biết user đã bấm start
  const [lessonStartedByUser, setLessonStartedByUser] = useState<boolean>(false);

  const [boxesVisibility, setBoxesVisibility] = useState<{ message: boolean; conversation: boolean }>(() => ({
    message: isLessonStarted,
    conversation: isLessonStarted,
  }));

  // modal / quiz
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, OptionKey | undefined>>({});
  const q = useMemo(() => quiz[index], [index]);

  const handleSelect = useCallback((key: OptionKey) => {
    setAnswers((p) => ({ ...p, [index]: key }));
  }, [index]);

  const handlePrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const handleNext = useCallback(() => setIndex((i) => (i < quiz.length - 1 ? i + 1 : i)), []);
  const handleClickOpenQuiz = useCallback(() => setOpen(true), []);
  const handleCloseQuiz = useCallback(() => setOpen(false), []);

  // -------------------- Queries / Mutations --------------------
  const {
    data: conversations = [],
    isPending: isPendingData,
    isError,
    isFetching: isRefetching,
  } = useQuery<Conversation[], Error>({
    queryKey: ['myConversations', authUser?.id],
    queryFn: conversationService.getMyConversations,
    enabled: !!authUser?.id,
    staleTime: 1000 * 60 * 2,
  });

  const createConversationMutation = useMutation<Conversation, Error, string>({
    mutationFn: async (name: string) => {
      if (!authUser?.id) throw new Error('User not authenticated');
      return await conversationService.createConversation(name, authUser.id || '');
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['myConversations', authUser?.id] });
      setNewConversationName('');
      setShowCreateForm(false);
      toast.success(`Conversation "${newConversation?.name ?? 'New'}" created successfully`, { duration: 2000 });
    },
    onError: (error: any) => {
      toast.error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 3000,
      });
    },
  });

  const isCreatingConversation = Boolean((createConversationMutation as any).isPending || createConversationMutation.isPending);

  // Selected conversation
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [updatingConversationId, setUpdatingConversationId] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversationId((prev) => (prev === conversation.id ? null : conversation.id));
  }, []);

  const handleUpdateConversation = useCallback(async (c?: any) => {
    if (!c) return;
    setUpdatingConversationId(c.id);
    try {
      queryClient.invalidateQueries({ queryKey: ['myConversations', authUser?.id] });
      toast.success('Updated');
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    } finally {
      setUpdatingConversationId(null);
    }
  }, [authUser?.id]);

  const handleDeleteConversation = useCallback(async (c?: any) => {
    if (!c) return;
    setDeletingConversationId(c.id);
    try {
      queryClient.invalidateQueries({ queryKey: ['myConversations', authUser?.id] });
      setSelectedConversationId((prev) => (prev === c.id ? null : prev));
      toast.success('Deleted');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    } finally {
      setDeletingConversationId(null);
    }
  }, [authUser?.id]);

  // -------------------- Messages history --------------------
  const {
    data: historyMessages,
    isFetching: isFetchingHistory,
    refetch: refetchHistory,
  } = useQuery<any[], Error>({
    queryKey: ['myMessage', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      return await messageService.messagesByConversation(selectedConversationId);
    },
    enabled: !!selectedConversationId,
    staleTime: 1000 * 60,
  });

  // -------------------- Sections fetch via useMutation --------------------
  // We'll call this mutation when user clicks Start lesson
  const fetchSectionsMutation = useMutation<any, Error, string>({
    mutationFn: async (id: string) => {
      if (!id) throw new Error('Missing lessonId');
      return await sectionService.getSectionByLesson(id);
    },
    onError: (err) => {
      console.error('fetchSectionsMutation error', err);
      toast.error('Không thể tải nội dung bài học.');
    },
  });

  // chat refs / state
  const messageBoxRef = useRef<any>(null);
  const conversationBoxRef = useRef<any>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  // streaming state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const controllerRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const fetchAbortRef = useRef<AbortController | null>(null);

  const streamingMessageIdRef = useRef<number | string | null>(null);
  const streamingQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  // map incoming history -> local messages
  useEffect(() => {
    if (!historyMessages || !Array.isArray(historyMessages)) return;
    try {
      const mapped = (historyMessages as any[]).map((m) => {
        const id = m.id ?? m._id ?? `${Date.now()}-${Math.random()}`;
        const sender = (m.senderType ?? m.type ?? '').toString().toLowerCase();
        const role: Role = sender === 'user' || sender === 'client' ? 'user' : 'assistant';
        const text = (m.content ?? m.message ?? m.response ?? '').toString();
        const ts = Date.now();
        return { id, role, text, ts };
      }).sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
      setMessages(mapped);
      setTimeout(() => {
        const el = chatWindowRef.current;
        if (!el) return;
        try { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }
        catch { el.scrollTop = el.scrollHeight; }
      }, 80);
    } catch (err) {
      console.error('Mapping history failed', err);
    }
  }, [historyMessages]);

  // when switching conversation: cancel streaming & clear queue
  useEffect(() => {
    controllerRef.current.cancelled = true;
    streamingQueueRef.current = [];
    const t = setTimeout(() => {
      controllerRef.current.cancelled = false;
      if (selectedConversationId) void refetchHistory?.();
      else setMessages([]);
    }, 80);
    return () => clearTimeout(t);
  }, [selectedConversationId, refetchHistory]);

  // initial progress effect
  useEffect(() => {
    if (progress === 100 && !active && !initialLoadComplete) {
      setInitialLoadComplete(true);
      const t = setTimeout(() => setInitialLoad(true), 500);
      return () => clearTimeout(t);
    }
  }, [progress, active, initialLoadComplete, setInitialLoad]);

  // Azure SDK check — log only here; detailed state is maintained in feature hooks
  useEffect(() => {
    const { isAvailable, error } = checkAzureSpeechSDK();
    if (!isAvailable && error) {
      console.warn('Azure Speech SDK check failed:', error);
    }
  }, []);

  // handle lesson start / explanation visibility
  useEffect(() => {
    if (isLessonStarted && !isExplanationVisible) {
      setBoxesVisibility({ message: false, conversation: false });
    } else if (isLessonStarted && isExplanationVisible) {
      messageBoxRef.current?.show?.();
      conversationBoxRef.current?.show?.();
      setBoxesVisibility({ message: true, conversation: true });
    }
  }, [isLessonStarted, isExplanationVisible]);

  const handleGoBack = useCallback(() => {
    try { stopAzure(); } catch { }
    stopAll();
    window.location.href = '/courses';
  }, [stopAzure, stopAll]);

  const handleMessageBoxVisibilityChange = useCallback((visible: boolean) => {
    setBoxesVisibility((p) => ({ ...p, message: visible }));
  }, []);

  const handleConversationBoxVisibilityChange = useCallback((visible: boolean) => {
    setBoxesVisibility((p) => ({ ...p, conversation: visible }));
  }, []);

  // ---------- STREAMING QUEUE IMPLEMENTATION ----------
  const appendTokenToStreamingMessage = useCallback((token: string) => {
    if (!token) return;
    if (!streamingMessageIdRef.current) {
      const streamId = `temp:${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      streamingMessageIdRef.current = streamId;
      setMessages((prev) => [...prev, { id: streamId, role: 'assistant', text: token, ts: Date.now() }]);
      return;
    }

    const id = streamingMessageIdRef.current;
    setMessages((prev) => prev.map((m) => (String(m.id) === String(id) ? { ...m, text: `${m.text ?? ''}${token}` } : m)));
  }, []);

  const processStreamingQueue = useCallback(async (opts?: { baseDelay?: number }) => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;
    setIsStreaming(true);
    controllerRef.current.cancelled = false;
    try {
      while (streamingQueueRef.current.length > 0 && !controllerRef.current.cancelled) {
        const token = streamingQueueRef.current.shift();
        if (!token) continue;
        appendTokenToStreamingMessage(token);

        const base = opts?.baseDelay ?? STREAM_BASE_DELAY;
        const computed = Math.min(220, base + Math.max(0, token.trim().length) * 8);

        await new Promise<void>((resolve) => {
          const t = window.setTimeout(() => resolve(), computed);
          const iv = window.setInterval(() => {
            if (controllerRef.current.cancelled) {
              window.clearTimeout(t);
              window.clearInterval(iv);
              resolve();
            }
          }, 30);
        });
      }
    } finally {
      isProcessingQueueRef.current = false;
      setIsStreaming(false);
      streamingMessageIdRef.current = null;
      setTimeout(() => setStatusText(''), 200);

      if (pendingRefetchAfterStreamingRef.current) {
        pendingRefetchAfterStreamingRef.current = false;
        setTimeout(() => {
          try {
            void refetchHistory?.();
          } catch (err) {
            console.error('refetchHistory failed after streaming', err);
          }
        }, 300);
      }
    }
  }, [appendTokenToStreamingMessage, refetchHistory]);

  const enqueueText = useCallback((text: string) => {
    if (!text) return;
    const toks = tokenize(text);
    if (toks.length === 0) return;
    streamingQueueRef.current.push(...toks);
    void processStreamingQueue({ baseDelay: STREAM_BASE_DELAY });
  }, [processStreamingQueue]);

  // window events to receive messages from other parts of app
  useEffect(() => {
    const onUser = (e: any) => {
      const { id, text, ts } = e.detail ?? {};
      setMessages((prev) => [...prev, { id: id ?? Date.now() + Math.random(), role: 'user', text: text ?? '', ts: ts ?? Date.now() }]);
    };

    const onChunk = (e: any) => {
      const { text } = e.detail ?? {};
      if (text == null) return;
      enqueueText(text);
    };

    const onFinal = (e: any) => {
      const { text } = e.detail ?? {};
      if (text) enqueueText(text);

      if (selectedConversationId) {
        pendingRefetchAfterStreamingRef.current = true;
      }
    };

    const onStatus = (e: any) => {
      const detail = (e as CustomEvent<{ agent?: string }>).detail || {};
      setStatusText(`Agent: ${detail.agent ?? 'unknown'}`);
    };

    window.addEventListener('ai-chat:user_message', onUser as EventListener);
    window.addEventListener('ai-chat:assistant_chunk', onChunk as EventListener);
    window.addEventListener('ai-chat:assistant_message', onFinal as EventListener);
    window.addEventListener('ai-chat:assistant_done', onFinal as EventListener);
    window.addEventListener('ai-chat:assistant_status', onStatus as EventListener);

    return () => {
      window.removeEventListener('ai-chat:user_message', onUser as EventListener);
      window.removeEventListener('ai-chat:assistant_chunk', onChunk as EventListener);
      window.removeEventListener('ai-chat:assistant_message', onFinal as EventListener);
      window.removeEventListener('ai-chat:assistant_done', onFinal as EventListener);
      window.removeEventListener('ai-chat:assistant_status', onStatus as EventListener);
    };
  }, [enqueueText, refetchHistory, selectedConversationId]);

  const handleStop = useCallback(() => {
    controllerRef.current.cancelled = true;
    setIsStreaming(false);
    setStatusText('Đã dừng');
    streamingQueueRef.current = [];
    setUserStopped(true); // important: user forced stop -> enable input

    if (fetchAbortRef.current) {
      try { fetchAbortRef.current.abort(); } catch { }
    }

    // stop TTS if running
    try { stopAzure(); } catch { }

    // clear slide-wait state & any timers
  displayingSlideIdRef.current = null;
  setIsDisplayingSlide(false);
  if (displayingSlideTimeoutRef.current) {
    window.clearTimeout(displayingSlideTimeoutRef.current);
    displayingSlideTimeoutRef.current = null;
  }

  // remove slide messages from chat so slide image/iframe disappears immediately.
  // Criteria: messages with id starting with 'section:' OR messages that contain markdown image.
  setMessages((prev) =>
    prev.filter((m) => {
      try {
        const idStr = String(m.id ?? '');
        if (idStr.startsWith('section:')) return false;
        const txt = String(m.text ?? '');
        if (/\!\[.*?\]\(.*?\)/.test(txt)) return false; // strip markdown images
        // optional: also remove plain pdf links (common for slides)
        if (/\.pdf(\?|$)/i.test(txt)) return false;
        return true;
      } catch {
        return true;
      }
    })
  );

  // mark lesson ended (user stopped)
  setEndLesson(true);
  }, [stopAzure]);

  // always scroll to bottom when messages change or streaming state changes
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;
    try { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }
    catch { el.scrollTop = el.scrollHeight; }
  }, [messages.length, isStreaming]);

  // MessageBox refs & create conversation handlers
  const handleCreateConversation = useCallback(() => {
    if (!newConversationName.trim()) return;
    createConversationMutation.mutate(newConversationName.trim());
  }, [createConversationMutation, newConversationName]);

  const toggleCreateForm = useCallback(() => {
    setShowCreateForm((prev) => {
      const next = !prev;
      if (!next) setNewConversationName('');
      if (next) setTimeout(() => newConversationInputRef.current?.focus(), 100);
      return next;
    });
  }, []);

  // -------------------- Start lesson handler (uses fetchSectionsMutation) --------------------
  const handleStartLesson = useCallback(async () => {
    try {
      setUserStopped(false);
      console.log("Conversation:", selectedConversationId);
      if (!lessonId) {
        toast.error('Không tìm thấy lesson');
        return;
      }

      setLessonStartedByUser(true);
      setBoxesVisibility({ message: true, conversation: true });

      // fetch sections via mutation (mutateAsync)
      const resp = await fetchSectionsMutation.mutateAsync(lessonId);

      // normalize response to array
      let sections: any[] = [];
      if (!resp) sections = [];
      else if (Array.isArray(resp)) sections = resp;
      else if (typeof resp === 'object') sections = [resp];

      if (!sections || sections.length === 0) {
        toast.error('Không tìm thấy nội dung mục trong bài học');
        return;
      }

      // sort by order if available
      sections.sort((a: any, b: any) => (Number(a?.order ?? 0) - Number(b?.order ?? 0)));

      // iterate sections sequentially
      for (const sec of sections) {
        const url = sec?.urlPdf ?? '';
        const rawContent = sec?.content ?? '';
        const content = normalizeText(String(rawContent));

        // detect pdf and attempt to create image preview
        const isPdf = typeof url === 'string' && /\.pdf(\?|$)/i.test(url);
        const previewUrl = url ? getPreviewImageUrl(url) : '';

        // prepare message text:
        // - We'll not rely only on markdown link for PDFs (that causes "open in new tab" behaviour)
        // - Instead we put a markdown image (if preview) or let the render code embed iframe as fallback
        const imageMd = (url && previewUrl) ? `![slide](${previewUrl})\n\n` : (url ? `[📄 Slide](${url})\n\n` : '');
        const msgText = `${imageMd}`;
        const sectionMsgId = `section:${sec.id ?? String(Math.random())}`;

        // If there's a preview image / PDF, mark as displaying slide
        if (previewUrl || isPdf) {
          displayingSlideIdRef.current = sectionMsgId;
          setIsDisplayingSlide(true);
          // fallback: clear after 8s so we don't block forever if image fails to fire onLoad
          if (displayingSlideTimeoutRef.current) window.clearTimeout(displayingSlideTimeoutRef.current);
          displayingSlideTimeoutRef.current = window.setTimeout(() => {
            if (displayingSlideIdRef.current === sectionMsgId) {
              displayingSlideIdRef.current = null;
              setIsDisplayingSlide(false);
              displayingSlideTimeoutRef.current = null;
            }
          }, 8000);
        }

        // push to messages (hiển thị ngay)
        setMessages((prev) => [
          ...prev,
          { id: `section:${sec.id ?? String(Math.random())}`, role: 'assistant', text: msgText, ts: Date.now() },
        ]);

        // speak content (await to ensure sequential reading)
        if (speak && content) {
          try {
            await speak(content);
            // some TTS implementations may resolve before actual audio ends; poll isSpeakingRef just to be safe
            const maxWaitMs = 120000; // 2min safety
            const pollInterval = 150;
            const start = Date.now();
            while (isSpeakingRef.current && Date.now() - start < maxWaitMs) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise((r) => setTimeout(r, pollInterval));
            }
          } catch (e) {
            console.warn('TTS speak failed for section', sec.id, e);
          }
        }

        // WAIT 1..3 seconds before next section so user sees slide & has a brief pause
        const pauseMs = 1000 + Math.floor(Math.random() * 2000); // 1000..3000
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, pauseMs));
      }

      setEndLesson(true);
      toast.success('Kết thúc bài học.');
    } catch (err) {
      console.error('handleStartLesson error', err);
      toast.error('Không thể bắt đầu bài học.');
    }
  }, [lessonId, fetchSectionsMutation, speak, setBoxesVisibility]);

  function renderAssistantMessage(m: Message) {
    const text = m.text ?? '';
    const { imgUrl, restText } = extractFirstMarkdownImage(text);

    // Clean duplicate repetitions & trim leading spaces only in text area (keep image handling intact)
    const cleanedRestText = restText ? trimLeadingSpacesPerLine(collapseRepeatedText(restText)) : restText;
    const cleanedFullText = !imgUrl ? trimLeadingSpacesPerLine(collapseRepeatedText(text)) : null;

    if (imgUrl) {
      // if extracted img url points to a jpg generated from pdf preview, we show the <img />.
      // If it points to an actual PDF (rare), we fallback to embed iframe/object below.
      const isPdfImg = /\.pdf(\?|$)/i.test(imgUrl);
      if (!isPdfImg) {
        return (
          <div>
            <img
              src={imgUrl}
              alt="slide"
              className="max-w-full rounded-lg mb-3 border"
              style={{ maxHeight: '60vh' }}
              onLoad={() => {
                try {
                  if (String(m.id) === String(displayingSlideIdRef.current)) {
                    displayingSlideIdRef.current = null;
                    setIsDisplayingSlide(false);
                    if (displayingSlideTimeoutRef.current) {
                      window.clearTimeout(displayingSlideTimeoutRef.current);
                      displayingSlideTimeoutRef.current = null;
                    }
                  }
                } catch (e) { /* ignore */ }
              }}
            />
            {cleanedRestText ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {cleanedRestText}
              </ReactMarkdown>
            ) : null}
          </div>
        );
      } else {
        // if the "image" is actually a PDF link, attempt inline object/iframe rendering
        return (
          <div>
            <div className="mb-3 border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
              <iframe
                src={imgUrl}
                title="slide-pdf"
                style={{ width: '100%', height: '100%', border: 'none' }}
                onLoad={() => {
                  try {
                    if (String(m.id) === String(displayingSlideIdRef.current)) {
                      displayingSlideIdRef.current = null;
                      setIsDisplayingSlide(false);
                      if (displayingSlideTimeoutRef.current) {
                        window.clearTimeout(displayingSlideTimeoutRef.current);
                        displayingSlideTimeoutRef.current = null;
                      }
                    }
                  } catch (e) { }
                }}
              />
            </div>
            {cleanedRestText ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {cleanedRestText}
              </ReactMarkdown>
            ) : null}
          </div>
        );
      }
    }

    // no image: render cleaned full markdown
    const finalTextToRender = cleanedFullText ?? text;
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {finalTextToRender}
      </ReactMarkdown>
    );
  }

  const inputDisabled = useMemo(() => {
    // if lesson not started -> allow
    if (!isLessonStarted) return false;
    // if user deliberately pressed Stop -> allow
    if (userStopped) return false;
    // otherwise disable when streaming / TTS speaking / slide displaying
    return isStreaming || !!isSpeakingRef.current || isDisplayingSlide;
  }, [isLessonStarted, userStopped, isStreaming, isDisplayingSlide]);

  // -------------------- Render --------------------
  return (
    <div className="bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-8 text-base">
      <div className="max-w-full mx-auto grid grid-cols-12 gap-8">
        {/* LEFT: Chat Card */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-2 border-b">
              <div className="flex items-center gap-5">
                <Tooltip content="Back to Courses" contentClassName="text-[1.25rem] text-black z-[60]" position="right">
                  <Button
                    onClick={handleGoBack}
                    variant="outline"
                    className={cn(
                      'rounded-full bg-black/20 backdrop-blur-[16px] border-white/30 hover:bg-black/30 text-white !p-0 hover:text-white size-12 drop-shadow-lg',
                      isThinking && 'pointer-events-none opacity-70'
                    )}
                  >
                    <Icon icon="lucide:arrow-left" className="!size-[1.5rem] drop-shadow-lg" />
                  </Button>
                </Tooltip>
              </div>

              <div className="flex items-center gap-4 w-[20%]">
                <Button onClick={handleClickOpenQuiz} className="w-[60%] text-sm bg-black/50 hover:bg-black/20">Take the quiz</Button>

                <QuizDialog
                  open={open}
                  onClose={handleCloseQuiz}
                  q={q}
                  index={index}
                  answers={answers}
                  onSelect={(k) => handleSelect(k as OptionKey)}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  quizLength={quiz.length}
                />

                <div className="text-sm text-slate-600" aria-live="polite">{isStreaming ? 'Answering...' : statusText || 'Ready'}</div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white border flex items-center justify-center text-sm text-slate-600 shadow">Tutor</div>
                </div>
              </div>
            </div>

            {/* Chat window */}
            <div ref={chatWindowRef} id="chat-window" className="p-8 h-[65vh] lg:h-[70vh] overflow-y-auto space-y-6 bg-gradient-to-b from-white to-slate-50" role="log" aria-live="polite">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-8">
                  <div className="text-2xl font-medium mb-4">Welcome! Ready to start the lesson?</div>
                  <div className="mt-2 text-base mb-6">{selectedConversationId ? (<>CLick Start lesson button to start lecturer</>) : (<>Choose Conversation to get started</>)}</div>

                  {!lessonStartedByUser ? (
                    selectedConversationId ? (
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          onClick={() => void handleStartLesson?.()}
                          className="px-6 py-3 rounded-full bg-primary text-white text-lg"
                          disabled={Boolean(fetchSectionsMutation?.isPending) || !selectedConversationId}
                        >
                          {fetchSectionsMutation?.isPending ? 'Loading...' : 'Start lesson'}
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-slate-500">
                        Please select a conversation to enable start lecturing.
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-slate-500">Lesson started — slides will appear in chat.</div>
                  )}
                </div>
              )}

              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={String(m.id)} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="mr-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-lg font-semibold shadow">T</div>
                      </div>
                    )}

                    <div className="max-w-[85%]">
                      <div
                        className={`px-5 py-3 rounded-3xl break-words whitespace-pre-line text-base leading-7 ${isUser ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none' : 'bg-white border shadow-sm rounded-bl-none'}`}
                        style={{
                          boxShadow: isUser ? '0 10px 30px rgba(59,130,246,0.15)' : undefined,
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-line'
                        }}
                        aria-live={isUser ? undefined : 'polite'}
                      >
                        {isUser ? m.text : renderAssistantMessage(m)}
                      </div>
                      <div className={`mt-2 text-sm ${isUser ? 'text-right text-slate-400' : 'text-slate-500'}`}>{formatTime(m.ts)}</div>
                    </div>

                    {isUser && (
                      <div className="ml-4 flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium shadow-sm text-sm">You</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isStreaming && (
                <div className="flex items-start gap-4">
                  <div className="mr-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400 flex items-center justify-center text-white font-semibold shadow">T</div>
                  </div>
                  <div className="bg-white border px-5 py-3 rounded-3xl rounded-bl-none shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-base text-slate-600">Thinking...</span>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-slate-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-slate-500/60 delay-75" />
                        <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-slate-500/40 delay-150" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="mt-50">
              <MessageBox ref={messageBoxRef} visible={boxesVisibility.message} onVisibilityChange={(v: boolean) => setBoxesVisibility((p) => ({ ...p, message: v }))} selectedConversationId={selectedConversationId} inputDisabled={inputDisabled} isEndLesson={isEndLesson} />
              <Button className="ml-330 mb-6 p-7" onClick={handleStop}>Stop Lecturer</Button>
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-8 space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow border transform-gpu transition-transform duration-200 ease-in-out hover:scale-105">
              <div className={`${zoomConversationBox ? 'h-[20px]' : 'h-[180px]'} transition-all duration-300 ease-in-out`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base text-slate-700">Learning Progress:</p>

                  <div className="flex-1 ml-4">
                    <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>

                <ConversationsPanel
                  zoomConversationBox={zoomConversationBox}
                  setZoomConversationBox={setZoomConversationBox}
                  conversations={conversations}
                  isError={isError}
                  isPendingData={isPendingData}
                  isRefetching={isRefetching}
                  showCreateForm={showCreateForm}
                  newConversationName={newConversationName}
                  newConversationInputRef={newConversationInputRef}
                  isCreatingConversation={isCreatingConversation}
                  toggleCreateForm={toggleCreateForm}
                  setNewConversationName={setNewConversationName}
                  handleCreateConversation={handleCreateConversation}
                  updatingConversationId={updatingConversationId}
                  deletingConversationId={deletingConversationId}
                  handleSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversationId}
                  handleUpdateConversation={handleUpdateConversation}
                  handleDeleteConversation={handleDeleteConversation}
                />
              </div>
            </div>

            {/* REFERENCES */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow border transform-gpu transition-transform duration-200 ease-in-out hover:scale-105">
              <ReferencesPanel zoomReferenceBox={zoomReferenceBox} setZoomReferenceBox={setZoomReferenceBox} youtubeLink={youtubeLink} />
            </div>

            {/* NOTE (integrated NoteWindow) */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow border transform-gpu transition-transform duration-200 ease-in-out hover:scale-105">
              <NotePanel zoomNoteBox={zoomNoteBox} setZoomNoteBox={setZoomNoteBox} />
            </div>

            {/* SCENE 3D */}
            <div className="size-full" style={{ backfaceVisibility: 'hidden', width: '100%', height: '300px' }}>
              <ScenePanel SceneComponent={Scene} />
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
