// MessageBox.tsx
import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { cn, gsap, useGSAP } from '@/lib';
import { useClassroomStore } from '../stores';
import { messageService } from '../services';
import { useTeacherSpeech, useAnimatedBox, useVoiceRecognition } from '../hooks';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { GENERAL_MODE } from '../constants';
import { useAuthStore } from '@/stores';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

export interface MessageBoxHandle {
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

interface MessageBoxProps {
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  selectedConversationId?: string | null;
}

const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_BACKEND_URL || "https://learnify-be.onrender.com/graphql";

const MessageBox = forwardRef<MessageBoxHandle, MessageBoxProps>(({ onVisibilityChange, selectedConversationId }, ref) => {
  const { courseId, lessonId } = useParams();
  const authUser = useAuthStore((s) => s.user);

  const {
    speak: speakAzure,
    isReady: isAzureReady,
    isSpeaking: isAzureSpeaking,
    error: azureError,
    cleanup: cleanupAzure
  } = useTeacherSpeech();

  // If you need isAzureThinking, you may need to derive it from another property or state.
  const isAzureThinking = false; // or implement logic as needed

  const startThinking = useClassroomStore((state) => state.startThinking);
  const stopAll = useClassroomStore((state) => state.stopAll);
  const setIsThinking = useClassroomStore((state) => state.setIsThinking);
  const setIsSpeaking = useClassroomStore((state) => state.setIsSpeaking);
  const setCameraMode = useClassroomStore((state) => state.setCameraMode);
  const setTeacherMode = useClassroomStore((state) => state.setTeacherMode);
  const currentMessage = useClassroomStore((state) => state.currentMessage);
  const isLessonStarted = useClassroomStore((state) => state.isLessonStarted);
  const isExplanationVisible = useClassroomStore((state) => state.isExplanationVisible);

  const [message, setMessage] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [_, setSdkError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const collapseButtonRef = useRef<HTMLButtonElement>(null);
  const collapseButtonContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const expandIconRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  function parseSSEAggregated(aggStr: string): any[] {
    if (!aggStr) return [];
    const rawEvents = aggStr
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const events: any[] = [];
    for (const ev of rawEvents) {
      const lines = ev
        .split(/\n/)
        .map((l) => l.replace(/^data:\s?/, '').trim())
        .filter(Boolean);
      const joined = lines.join('\n');
      try {
        const obj = JSON.parse(joined);
        events.push(obj);
      } catch {
        events.push({ type: 'raw', raw: joined });
      }
    }
    return events;
  }

  const {
    isVisible,
    isAnimating,
    showBox: showMessageBox,
    hideBox: hideMessageBox,
    toggleBox: toggleMessageBox,
    setupVisibleState,
    setupHiddenState
  } = useAnimatedBox(
    {
      containerRef,
      boxRef: messageBoxRef,
      expandIconRef,
      collapseButtonContainerRef,
      contentRef,
      titleRef,
      subtitleRef,
      controlsRef
    },
    {
      expandedWidth: '53rem',
      expandedHeight: '13.5rem',
      collapsedSize: '3.5rem',
      expandedBorderRadius: '1.25rem',
      collapsedBorderRadius: '50%',
      onShowComplete: () => {
        if (inputRef.current) inputRef.current.focus();
      }
    },
    true,
    onVisibilityChange
  );

  useGSAP(
    () => {
      if (isVisible) {
        setupVisibleState();
      } else {
        setupHiddenState();
      }
    },
    { scope: containerRef, dependencies: [isVisible] }
  );

  useGSAP(
    () => {
      gsap.killTweensOf([contentContainerRef.current, titleRef.current, subtitleRef.current, controlsRef.current]);

      if (selectedConversationId) {
        const elementsToAnimate = [contentContainerRef.current, subtitleRef.current, controlsRef.current].filter(Boolean);
        gsap.set(elementsToAnimate, { opacity: 0, y: 10 });
        gsap.to(elementsToAnimate, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
          overwrite: true
        });
      } else {
        const defaultElements = [titleRef.current, subtitleRef.current, controlsRef.current].filter(Boolean);
        gsap.set(defaultElements, { opacity: 0, y: 10 });
        gsap.to(defaultElements, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
          overwrite: true
        });
      }
    },
    { scope: containerRef, dependencies: [selectedConversationId] }
  );

  useEffect(() => {
    setIsThinking(isAzureThinking);
    setIsSpeaking(isAzureSpeaking);

    if (isAzureThinking) {
      setCameraMode(GENERAL_MODE.THINKING);
      setTeacherMode(GENERAL_MODE.THINKING);
    } else if (isAzureSpeaking) {
      setCameraMode(GENERAL_MODE.SPEAKING);
      setTeacherMode(GENERAL_MODE.SPEAKING);
    } else {
      setCameraMode(GENERAL_MODE.IDLE);
      setTeacherMode(GENERAL_MODE.IDLE);
    }
  }, [isAzureThinking, isAzureSpeaking, setIsThinking, setIsSpeaking, setCameraMode, setTeacherMode]);

  useEffect(() => {
    if (!currentMessage && !isAzureThinking && !isAzureSpeaking) {
      stopAll();
    }
  }, [currentMessage, isAzureThinking, isAzureSpeaking, stopAll]);

  useEffect(() => {
    return () => {
      cleanupAzure();
      stopAll();
    };
  }, [cleanupAzure, stopAll]);

  useEffect(() => {
    if (azureError) {
      console.warn('Azure Speech Error:', azureError);
      setSdkError(azureError);
    } else {
      setSdkError(null);
    }
  }, [azureError]);

  useEffect(() => {
    if (isLessonStarted && !isExplanationVisible) {
      if (!isVisible) {
        showMessageBox();
      }
    }
  }, [isLessonStarted, isExplanationVisible, isVisible, showMessageBox]);

  useImperativeHandle(ref, () => ({
    show: showMessageBox,
    hide: () => {
      /* no-op to keep box always open */
    },
    toggle: () => {
      /* no-op */
    }
  }));

  // ------------------ messageMutation ------------------
  const messageMutation = useMutation({
    mutationFn: (content: string | null) =>
      messageService.createMessage(
        selectedConversationId ?? null,
        content,
        lessonId ?? "45027284-8bf8-4473-acef-4db34b24371d",
        null,
        authUser?.id ?? null
      ),
   onSuccess: async (result: any) => {
  // Clear input
  setMessage('');

  // Keep sessionId if provided
  if (result?.sessionId) {
    setSessionId(result.sessionId);
  }

  // aggregated response (server may put SSE-like payload into `response`)
  const agg: string = result?.response || result?.content || '';

  // Parse into events (parseSSEAggregated is defined in this file)
  let events: any[] = [];
  try {
    events = parseSSEAggregated(agg);
  } catch (err) {
    events = [];
  }

  // Filter only the types we care about
  const chunkEvents = events.filter((ev) =>
    ev && (ev.type === 'chunk' || ev.type === 'status' || ev.type === 'done' || ev.type === 'end' || ev.type === 'raw')
  );

  // Dispatch to window so ClassRoom Page can handle streaming UI:
  try {
    if (!chunkEvents.length) {
      // server returned full assistant text (no streaming chunks)
      window.dispatchEvent(
        new CustomEvent('ai-chat:assistant_message', {
          detail: { text: agg }
        })
      );
    } else {
      for (const ev of chunkEvents) {
        if (ev.type === 'chunk' && typeof ev.response === 'string') {
          window.dispatchEvent(
            new CustomEvent('ai-chat:assistant_chunk', {
              detail: { text: ev.response }
            })
          );
        } else if (ev.type === 'raw' && typeof ev.raw === 'string') {
          window.dispatchEvent(
            new CustomEvent('ai-chat:assistant_chunk', {
              detail: { text: ev.raw }
            })
          );
        } else if (ev.type === 'status') {
          window.dispatchEvent(
            new CustomEvent('ai-chat:assistant_status', {
              detail: { agent: ev.agent || null }
            })
          );
        } // done/end will be signalled after loop
      }

      // finally signal done
      window.dispatchEvent(new CustomEvent('ai-chat:assistant_done', { detail: {} }));
    }
  } catch (dispatchErr) {
    // fallback: if dispatching fails, emit final text
    window.dispatchEvent(
      new CustomEvent('ai-chat:assistant_message', {
        detail: { text: agg }
      })
    );
  }

  // ------------------ TTS (Azure) flow: assemble text and speak ------------------
  try {
    // Build finalText to speak:
    let finalText = '';

    // prefer server-provided `content` if present and non-empty
    if (result?.content && String(result.content).trim()) {
      finalText = String(result.content).trim();
    } else if (chunkEvents.length) {
      // join chunk/responses into full text
      finalText = chunkEvents
        .map((ev) => {
          if (ev.type === 'chunk' && typeof ev.response === 'string') return ev.response;
          if (ev.type === 'raw' && typeof ev.raw === 'string') return ev.raw;
          return '';
        })
        .join('');
      finalText = finalText.trim();
    } else {
      // fallback to agg
      finalText = String(agg || '').trim();
    }

    if (finalText) {
      // inform UI we're thinking / speaking
      startThinking();

      if (!isAzureReady) {
        // SDK not ready: log and skip speaking (optionally could wait/retry)
        console.warn('Azure TTS not ready - skipping speak for now');
      } else {
        const speakResult = await speakAzure(finalText) as { success: boolean; error?: string };

        if (!speakResult?.success && speakResult?.error) {
          stopAll();

          if (speakResult.error.includes('disposed')) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const retryResult = await speakAzure(finalText) as { success: boolean; error?: string };

            if (!retryResult?.success) {
              toast.error(`Lỗi khi phát âm: ${retryResult.error}`);
              stopAll();
            }
          } else {
            toast.error(`Lỗi khi phát âm: ${speakResult.error}`);
            stopAll();
          }
        }
      }
    }
  } catch (ttsErr: any) {
    stopAll();
    toast.error(ttsErr?.message || 'Không thể kích hoạt giọng nói cho AI Teacher');
  } finally {
    // rely on teacher speech hooks to update states
  }
    },
    onError: (error: any) => {
      console.error('Message mutation error:', error);
      toast.error(error?.message || 'Không thể gửi tin nhắn');
    }
  });

  // ------------------ handleSubmit ------------------
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();

    if (!selectedConversationId) {
      toast.error('Chưa chọn conversation');
      return;
    }

    if (!message || !message.trim()) {
      inputRef.current?.focus();
      return;
    }

    const userMessageId = Date.now() + Math.random();
    window.dispatchEvent(
      new CustomEvent('ai-chat:user_message', {
        detail: { id: userMessageId, text: message, ts: Date.now() }
      })
    );

    try {
      messageMutation.mutate(message);
    } catch (err: any) {
      console.error('Error submitting message:', err);
      toast.error(err?.message || 'Có lỗi khi gửi tin nhắn');
    }
  };

  const { isListening, startListening, stopListening } = useVoiceRecognition({
    continuous: true,
    silenceTimeout: 5000,
    onResult: (text) => {
      setMessage(text);
    },
    onError: (error) => {
      toast.error(`Lỗi nhận dạng giọng nói: ${error}`);
    }
  });

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (inputRef.current && message) {
      setTimeout(() => {
        inputRef.current?.setSelectionRange(message.length, message.length);

        if (inputRef.current && inputRef.current.scrollWidth > inputRef.current.clientWidth) {
          inputRef.current.scrollLeft = inputRef.current.scrollWidth;
        }

        if (isListening) {
          inputRef.current?.focus();
        }
      }, 0);
    }
  }, [message, isListening]);

  return (
    <div ref={containerRef} className="absolute bottom-[1.65rem] left-1/2 -translate-x-1/2 flex items-center justify-center z-50">
      <div
        ref={messageBoxRef}
        className={cn('bg-black/50 backdrop-blur-[16px] border border-black/50', 'flex items-center justify-center overflow-visible relative', !selectedConversationId && 'opacity-90')}
      >
        <div ref={collapseButtonContainerRef} className="absolute -top-[1.2rem] left-1/2 -translate-x-1/2 z-20">
          {!messageMutation.isPending ? (
            <Tooltip content="Message box is fixed open" contentClassName="text-[1.25rem] z-[60]">
              {/* <Button
                ref={collapseButtonRef}
                onClick={() => showMessageBox()}
                variant="outline"
                className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg"
              >
                <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
              </Button> */}
            </Tooltip>
          ) : (
            <Button variant="outline" className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg cursor-not-allowed opacity-70" disabled>
              <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
            </Button>
          )}
        </div>

        <div ref={expandIconRef} className={cn('flex items-center justify-center size-full relative', isExplanationVisible ? 'cursor-pointer' : 'pointer-events-none')} onClick={isExplanationVisible ? showMessageBox : undefined}>
          <Icon icon="fluent:chat-28-regular" className="!size-[1.75rem] text-white drop-shadow-lg" />
          <Tooltip content="Ask your teacher" className="absolute inset-0 z-[51]" contentClassName="text-[1.25rem] z-[60]" />
        </div>

        <div ref={contentRef} className="size-full flex flex-col justify-between px-[1.6rem] py-[1.4rem]">
          <div className="flex flex-col">
            <p ref={titleRef} className="text-[1.8rem] font-semibold text-white drop-shadow-lg -mb-[.05rem] flex items-center flex-wrap">
              {selectedConversationId ? <span ref={contentContainerRef} className="flex items-center">Ask a question about today's lesson</span> : <>Select a conversation</>}
            </p>

            <p ref={subtitleRef} className="text-[1.2rem] text-white/80 font-normal drop-shadow-lg">
              {selectedConversationId ? <>Type your question here! Be specific and clear.</> : <>Use the conversation box to select or create a conversation</>}
            </p>
          </div>

          <div ref={controlsRef} className="flex items-center gap-5">
            {selectedConversationId ? (
              <>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={cn(
                      'w-full h-12 bg-transparent border-t-0 border-l-0 border-r-0 rounded-none border-b-[.1rem] border-b-white text-white placeholder:text-white/80 !text-[1.4rem] focus:outline-none drop-shadow-lg',
                      messageMutation.isPending && 'pointer-events-none'
                    )}
                    placeholder="Ask something..."
                    onKeyDown={(e) => e.key === 'Enter' && !messageMutation.isPending && handleSubmit()}
                  />
                </div>

                <div className="flex gap-3.5">
                  <Tooltip content="Voice Chat" contentClassName="text-[1.25rem] z-[60]">
                    <Button onClick={handleVoiceInput} variant="outline" className={cn('rounded-full bg-white/10 border-white/30 hover:bg-white/20 text-white hover:text-white size-14 drop-shadow-lg !p-0', isListening && 'bg-white border-white/30 hover:bg-white/30')}>
                      <Icon icon={isListening ? 'si:mic-fill' : 'si:mic-line'} className={cn('!size-[1.4rem] drop-shadow-lg', isListening && 'text-black')} />
                    </Button>
                  </Tooltip>

                  <Button onClick={handleSubmit} variant="default" className={cn('rounded-full bg-primary/80 hover:bg-primary size-14 !p-0 drop-shadow-lg', messageMutation.isPending && 'pointer-events-none')}>
                    {messageMutation.isPending ? (
                      <svg viewBox="25 25 50 50" className="!size-[1.75rem] loading__svg">
                        <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
                      </svg>
                    ) : (
                      <Icon icon="akar-icons:send" className="!size-[1.4rem] drop-shadow-lg" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="size-full flex items-center justify-center relative pointer-events-none -mt-[4.7rem]">
                <div className="ld-ripple drop-shadow-lg">
                  <div />
                  <div />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBox.displayName = 'MessageBox';

export default MessageBox;
