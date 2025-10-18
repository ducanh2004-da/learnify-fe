import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
} from 'react';

// third-party
import { Canvas } from '@react-three/fiber';
import { useProgress, PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';
import { Icon } from '@iconify/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';

// project aliases / local
import { youtubeLink } from '@/mocks/youtubeLink';
import { quiz } from '@/data/quiz';
import { conversationService } from '@/features/classroom/services/conversation.service';
import { messageService } from '@/features/classroom/services';
import {
  MessageBox,
  ConversationBox,
  ClassroomLoading,
  useClassroomStore,
  useTeacherSpeech,
  checkAzureSpeechSDK,
} from '@/features/classroom';
import ConversationItem from '@/features/classroom/components/ConversationItem';
import { useAuthStore } from '@/stores';
import { queryClient } from '@/configs';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib';
import { sectionService } from '@/features/classroom/services';

// Note Window component (adjust import path if your project structure differs)
import NoteWindow from '@/features/classroom/components/NoteWindow';

// lazy scene
const Scene = lazy(() => import('@/features/classroom/components/Scene'));

// small stubs (keep because original file used them)
const Input = React.forwardRef<HTMLInputElement, any>((props, ref) => (
  <input ref={ref} {...props} />
));
const ConversationSkeleton = () => <div className="h-12 bg-slate-100 rounded" />;
// If your real mutations return `isPending` instead of `isPending`, keep both checks below
const updateConversationMutation: any = { isPending: false };
const deleteConversationMutation: any = { isPending: false };

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

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

function mapServerMsgToLocal(m: any): Message {
  const id = m.id ?? m._id ?? `${Date.now()}-${Math.random()}`;
  const sender = (m.senderType ?? m.type ?? '').toString().toLowerCase();
  const role: Role = sender === 'user' || sender === 'client' ? 'user' : 'assistant';
  const text = (m.content ?? m.message ?? m.response ?? '').toString();

  let ts = Date.now();
  if (m.timestamp != null) {
    const num = Number(m.timestamp);
    if (!Number.isNaN(num) && String(m.timestamp).length >= 10) {
      ts = num < 1e12 ? num * 1000 : num;
    } else {
      const parsed = Date.parse(String(m.timestamp));
      if (!Number.isNaN(parsed)) ts = parsed;
    }
  }
  return { id, role, text, ts };
}

function normalizeText(s?: string) {
  if (!s) return '';
  let t = s.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+([,\.!?:;])/g, '$1');
  return t;
}

function mergeMessagesById(existing: Message[], incoming: Message[]): Message[] {
  const map = new Map<string, Message>();

  const keyFor = (msg: Message) => {
    const n = normalizeText(msg.text);
    return n || `id:${String(msg.id)}`;
  };

  const setWithPriority = (msg: Message) => {
    const key = keyFor(msg);
    const prev = map.get(key);
    if (!prev) { map.set(key, msg); return; }

    const prevIsTemp = String(prev.id).startsWith('temp:');
    const curIsTemp = String(msg.id).startsWith('temp:');

    if (prevIsTemp && !curIsTemp) { map.set(key, msg); return; }
    if (!prevIsTemp && curIsTemp) { return; }

    if ((msg.ts ?? 0) >= (prev.ts ?? 0)) map.set(key, msg);
  };

  for (const m of existing) setWithPriority(m);
  for (const m of incoming) setWithPriority(m);

  const arr = Array.from(map.values());
  arr.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  return arr;
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
  const newConversationInputRef = useRef<HTMLInputElement | null>(null);

  // control teacher speech
  const { stop: stopAzure, error: azureError, speak, isSpeaking } = useTeacherSpeech();

  const [sdkError, setSdkError] = useState<string | null>(null);
  const [sdkLoading, setSdkLoading] = useState<boolean>(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [zoomConversationBox, setZoomConversationBox] = useState<boolean>(true);
  const [zoomReferenceBox, setZoomReferenceBox] = useState<boolean>(true);
  const [zoomNoteBox, setZoomNoteBox] = useState<boolean>(true);
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

  // Azure SDK check
  useEffect(() => {
    const { isAvailable, error } = checkAzureSpeechSDK();
    setSdkLoading(false);
    if (!isAvailable && error) {
      console.warn('Azure Speech SDK check failed:', error);
      setSdkError(error);
    }
  }, []);

  useEffect(() => {
    if (azureError) setSdkError(azureError);
    else setSdkError(null);
  }, [azureError]);

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
    if (fetchAbortRef.current) {
      try { fetchAbortRef.current.abort(); } catch { }
    }
  }, []);

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

      toast.success('Bắt đầu bài học.');
    } catch (err) {
      console.error('handleStartLesson error', err);
      toast.error('Không thể bắt đầu bài học.');
    }
  }, [lessonId, fetchSectionsMutation, speak, setBoxesVisibility]);

  function renderAssistantMessage(m: Message) {
    const text = m.text ?? '';
    const { imgUrl, restText } = extractFirstMarkdownImage(text);
    if (imgUrl) {
      // if extracted img url points to a jpg generated from pdf preview, we show the <img />.
      // If it points to an actual PDF (rare), we fallback to embed iframe/object below.
      const isPdfImg = /\.pdf(\?|$)/i.test(imgUrl);
      if (!isPdfImg) {
        return (
          <div>
            <img src={imgUrl} alt="slide" className="max-w-full rounded-lg mb-3 border" style={{ maxHeight: '60vh' }} />
            {restText ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {restText}
              </ReactMarkdown>
            ) : null}
          </div>
        );
      } else {
        // if the "image" is actually a PDF link, attempt inline object/iframe rendering
        return (
          <div>
            <div className="mb-3 border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
              <iframe src={imgUrl} title="slide-pdf" style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
            {restText ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {restText}
              </ReactMarkdown>
            ) : null}
          </div>
        );
      }
    }

    // no image: render full markdown
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {text}
      </ReactMarkdown>
    );
  }

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

                <BootstrapDialog onClose={handleCloseQuiz} aria-labelledby="customized-dialog-title" open={open}>
                  <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">Quiz</DialogTitle>
                  <IconButton aria-label="close" onClick={handleCloseQuiz} sx={(theme) => ({ position: 'absolute', right: 8, top: 8, color: theme.palette.grey[500] })}>
                    Close
                  </IconButton>
                  <DialogContent dividers>
                    <Typography className="max-w-3xl w-2xl" gutterBottom>
                      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
                        <h3 className="text-xl font-semibold mb-4">{q.header}</h3>
                        <div className="grid gap-3">
                          {(Object.keys(q.options) as OptionKey[]).map((k) => {
                            const selected = answers[index] === k;
                            return (
                              <button
                                key={k}
                                onClick={() => handleSelect(k)}
                                className={`text-left p-3 border rounded-lg flex items-center justify-between hover:shadow cursor-pointer ${selected ? 'bg-primary/10 border-primary' : 'bg-white'}`}
                                aria-pressed={selected}
                              >
                                <span>{q.options[k]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Typography>
                  </DialogContent>
                  <DialogActions className="flex max-w-3xl">
                    <Button autoFocus onClick={handleNext} disabled={index === quiz.length - 1} className={`px-4 py-2 rounded ${index === quiz.length ? 'bg-slate-100 text-slate-400' : 'bg-black border text-white'}`}>Next</Button>
                    <Button onClick={handlePrev} disabled={index === 0} className={`px-4 py-2 rounded ${index === 0 ? 'bg-slate-100 text-slate-400' : 'bg-black border text-white'}`}>Prev</Button>
                  </DialogActions>
                </BootstrapDialog>

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
                  <div className="mt-2 text-base mb-6">Choose Conversation to get started</div>

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

                        <Button
                          variant="outline"
                          onClick={() => {
                            // optional: preview first slide only, or other action
                           
                          }}
                        >
                          Preview
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
                      <div className={`px-5 py-3 rounded-3xl break-words whitespace-pre-wrap text-base leading-7 ${isUser ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none' : 'bg-white border shadow-sm rounded-bl-none'}`} style={{ boxShadow: isUser ? '0 10px 30px rgba(59,130,246,0.15)' : undefined }} aria-live={isUser ? undefined : 'polite'}>
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
              <MessageBox ref={messageBoxRef} visible={boxesVisibility.message} onVisibilityChange={(v: boolean) => setBoxesVisibility((p) => ({ ...p, message: v }))} selectedConversationId={selectedConversationId} />
              <Button className="ml-330 mb-6 p-7" onClick={handleStop}>Stop</Button>
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-8 space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow border transform-gpu transition-transform duration-200 ease-in-out hover:scale-105">
              <div className="zoom-btn fixed top-3 right-4 flex flex-col gap-3 z-50">
                <Button
                  onClick={() => setZoomConversationBox((p) => !p)}
                  variant="outline"
                  className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg"
                >
                  <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
                </Button>
              </div>
              <div className={`${zoomConversationBox ? 'h-[20px]' : 'h-[180px]'} transition-all duration-300 ease-in-out`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base text-slate-700">Learning Progress:</p>

                  <div className="flex-1 ml-4">
                    <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>

                {/* CONVERSATION */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold">My Conversations</div>
                  </div>
                </div>

                <ul className={`mt-3 space-y-3 text-sm overflow-y-auto max-h-25 ${zoomConversationBox ? 'hidden' : ''}`}>
                  {Array.isArray(conversations) && conversations.length > 0 ? (
                    conversations.map((item: any) => (
                      <ConversationItem key={item.id} conversation={item} isSelected={selectedConversationId === item.id} isUpdateLoading={updatingConversationId === item.id} isDeleteLoading={deletingConversationId === item.id} onClick={handleSelectConversation} onUpdate={handleUpdateConversation} onDelete={handleDeleteConversation} />
                    ))
                  ) : (
                    <li className="text-slate-400">No conversation</li>
                  )}
                </ul>

                {/* CREATE FORM AREA */}
                {showCreateForm ? (
                  <div className="flex-1 flex flex-col">
                    <div className="mt-auto mb-4.5">
                      <Input
                        ref={newConversationInputRef}
                        value={newConversationName}
                        onChange={(e: any) => setNewConversationName(e.target.value)}
                        placeholder="Enter conversation name"
                        className={cn('drop-shadow-lg h-15 !text-[1.25rem] text-white bg-black/10 border-white/20 focus:border-white/40 placeholder:text-white/50 rounded-full px-6',
                          (createConversationMutation as any).isPending && 'pointer-events-none')}
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
                        className={cn('flex-1 h-16 bg-primary/80 cursor-pointer hover:bg-primary rounded-full text-white text-[1.3rem] drop-shadow-lg transition-all', (!newConversationName.trim() || isCreatingConversation) && 'opacity-70')}
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
                    ) : updateConversationMutation.isPending || deleteConversationMutation.isPending ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="size-14 drop-shadow-lg">
                            <svg viewBox="25 25 50 50" className="loading__svg">
                              <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
                            </svg>
                          </div>
                          <p className="text-white text-[1.25rem] font-medium drop-shadow-lg">{updateConversationMutation.isPending ? 'Updating...' : 'Deleting...'}</p>
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
            </div>

            {/* REFERENCES */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow border transform-gpu transition-transform duration-200 ease-in-out hover:scale-105">
              <div className="zoom-btn fixed top-3 right-4 flex flex-col gap-3 z-50">
                <Button
                  onClick={() => setZoomReferenceBox((p) => !p)}
                  variant="outline"
                  className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg"
                >
                  <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
                </Button>
              </div>
              <div className={`${zoomReferenceBox ? 'h-[20px]' : 'h-[120px]'} overflow-y-auto transition-all duration-300 ease-in-out`}>
                <h3 className="text-2xl font-bold text-primary mb-2">References</h3>
                <ul className="flex flex-col gap-4 w-full">
                  {youtubeLink.map((link, idx) => (
                    <li key={idx}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-2xl font-semibold text-blue-700 dark:text-blue-300 hover:underline hover:text-blue-500 transition-colors">
                        <Icon icon="logos:youtube-icon" className="text-2xl" />
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* NOTE (integrated NoteWindow) */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-5 shadow border transform-gpu transition-transform duration-200 ease-in-out hover:scale-105">
              <div className="zoom-btn fixed top-3 right-4 flex flex-col gap-3 z-50">
                <Button
                  onClick={() => setZoomNoteBox((p) => !p)}
                  variant="outline"
                  className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg"
                >
                  <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
                </Button>
              </div>
              <div className={`${zoomNoteBox ? 'h-[20px]' : 'h-[250px]'} overflow-y-auto transition-all duration-300 ease-in-out`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-semibold">Notes</h3>
                  <div className="text-sm text-gray-500">Quick personal notes</div>
                </div>

                <div className="max-h-[300px]">
                  <NoteWindow />

                </div>
              </div>
            </div>

            {/* SCENE 3D */}
            <div className="size-full" style={{ backfaceVisibility: 'hidden', width: '100%', height: '300px' }}>
              <Canvas camera={{ position: [0, 1.2, 3], fov: 50 }} dpr={[1, 1.5]} onCreated={(state) => { state.gl.setClearColor('#000000', 0); state.invalidate(); }}>
                <PerformanceMonitor>
                  <AdaptiveDpr pixelated />
                  <Suspense fallback={null}><Scene /></Suspense>
                </PerformanceMonitor>
              </Canvas>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
