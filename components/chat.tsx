'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { StreamEvent } from '@/lib/ai/stream-events';

// Types for enhanced thinking state
interface ThinkingState {
  isThinking: boolean;
  message: string;
  stepType?: string;
  toolName?: string;
  status?: string;
}

export interface ToolProgress {
  toolName: string;
  progress?: number;
  message: string;
  type?: string;
}

interface GeneratedQuestion {
  content: string;
  type: 'custom' | 'template';
  index: number;
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
  initialAttachments = [],
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
  initialAttachments?: Array<Attachment>;
}) {
  const { mutate } = useSWRConfig();
  const [toolCall, setToolCall] = useState<string>();

  // Enhanced thinking state
  const [thinkingState, setThinkingState] = useState<ThinkingState>({
    isThinking: false,
    message: '',
  });

  const [toolProgress, setToolProgress] = useState<
    Record<string, ToolProgress>
  >({});
  const [generatedQuestions, setGeneratedQuestions] = useState<
    Array<GeneratedQuestion>
  >([]);

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: visibilityType,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      // Reset thinking state when finished
      setThinkingState({ isThinking: false, message: '' });
      setToolProgress({});
      setGeneratedQuestions([]);
    },
    onToolCall({ toolCall }) {
      setToolCall(toolCall.toolName);
      setThinkingState((prev) => ({
        ...prev,
        isThinking: true,
        toolName: toolCall.toolName,
        status: 'update',
      }));
    },
    onError: (error) => {
      // Always surface a toast. Prefer ChatSDKError messaging when available,
      // otherwise show a clear fallback (e.g., timeout/aborted stream).
      if (error instanceof ChatSDKError) {
        toast({ type: 'error', description: error.message });
      } else {
        toast({
          type: 'error',
          description: 'Request failed. Please try again.',
        });
      }
      stop();
      // Reset thinking state on error
      setThinkingState({ isThinking: false, message: '' });
    },
  });

  // Immediately set an optimistic thinking state on submit to avoid any visual gap
  useEffect(() => {
    if (status === 'submitted') {
      // Submitting a message will create the chat server-side
      setHasServerChat(true);
      const hasAttachedDocument = messages.some(
        (m) =>
          m.role === 'user' && (m.experimental_attachments?.length ?? 0) > 0,
      );

      setThinkingState((prev) => {
        // If server already set thinking or we already set an initial one, keep it
        if (prev.isThinking && prev.message) return prev;
        return {
          isThinking: true,
          message: hasAttachedDocument
            ? messages.length > 1
              ? 'Getting relevant information from your document'
              : 'Scanning your document'
            : 'Analyzing your request',
          stepType: 'processing',
          status: 'start',
          toolName: prev.toolName,
        };
      });
    }
  }, [status, messages]);

  // Handle data stream updates using the data array and useEffect
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Process the latest data part
    const latestData = data[data.length - 1];

    if (!latestData || typeof latestData !== 'object') return;

    console.log('Received data part:', latestData);

    // Type guard to ensure we have the expected structure
    const dataPart = latestData as StreamEvent;

    switch (dataPart.type) {
      case 'thinking-start':
        setThinkingState({
          isThinking: true,
          message: dataPart.content || 'Starting analysis',
          status: 'start',
        });
        break;
      case 'thinking-update':
        setThinkingState({
          isThinking: true,
          message: dataPart.content || 'Processing',
          status: 'update',
        });
        break;
      case 'thinking-end':
        setThinkingState((prev) => ({
          ...prev,
          isThinking: false,
          message: dataPart.content || 'Complete',
          status: 'end',
        }));
        break;

      case 'tool-progress': {
        const toolName = dataPart.toolName;
        const message =
          typeof dataPart.content === 'string'
            ? dataPart.content
            : 'Processing';
        setThinkingState((prev) => ({
          ...prev,
          isThinking: true,
          toolName: toolName ?? prev.toolName,
          message,
          status: 'update',
        }));
        if (toolName) {
          setToolProgress((prev) => ({
            ...prev,
            [toolName]: {
              toolName,
              progress:
                typeof dataPart.progress === 'number' ? dataPart.progress : 0,
              message,
              type: 'tool-progress',
            },
          }));
        }
        break;
      }

      case 'question-generated': {
        const idx =
          typeof dataPart.questionIndex === 'number'
            ? dataPart.questionIndex
            : undefined;
        const qContent = dataPart.content as any;
        const contentStr =
          typeof qContent === 'string'
            ? qContent
            : (qContent?.question ?? JSON.stringify(qContent));
        setGeneratedQuestions((prev) => [
          ...prev,
          {
            content: contentStr,
            type: dataPart.questionType || 'custom',
            index: idx ?? prev.length,
          },
        ]);
        break;
      }

      case 'completion-meta':
        try {
          const meta = JSON.parse(
            typeof dataPart.content === 'string' ? dataPart.content : '{}',
          );
          console.log('Completion metadata:', meta);
        } catch (e) {
          console.warn('Failed to parse completion metadata:', e);
        }
        break;

      case 'error':
        toast({
          type: 'error',
          description: dataPart.data?.message || 'An error occurred',
        });
        setThinkingState({ isThinking: false, message: '' });
        break;

      default:
        // Handle any other data stream types
        console.log('Unhandled stream data type:', dataPart.type, dataPart);
    }
  }, [data]); // Watch for changes to the data array

  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  // Gate server syncing until the chat exists on the server
  const [hasServerChat, setHasServerChat] = useState<boolean>(
    Boolean((initialMessages?.length ?? 0) > 0 || (initialAttachments?.length ?? 0) > 0),
  );
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Initialize attachments from server-provided chat value, then localStorage, then last user message
  useEffect(() => {
    try {
      if (initialAttachments?.length) {
        setAttachments(initialAttachments);
        return;
      }
      const key = `chat:${id}:attachments`;
      const stored =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setAttachments(parsed as Array<Attachment>);
          return;
        }
      }

      // Fallback: derive from the most recent user message that had attachments
      const lastUserWithAttachments = [...initialMessages]
        .reverse()
        .find(
          (m) =>
            m.role === 'user' && (m.experimental_attachments?.length ?? 0) > 0,
        );
      if (lastUserWithAttachments?.experimental_attachments?.length) {
        setAttachments(
          (lastUserWithAttachments.experimental_attachments as Array<Attachment>) ??
            [],
        );
      }
    } catch (e) {
      // noop; if parsing fails, keep default empty attachments
      console.warn('Failed to restore attachments from storage:', e);
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist attachments per chat so they survive refresh and re-open
  useEffect(() => {
    try {
      const key = `chat:${id}:attachments`;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(attachments ?? []));
      }
    } catch (e) {
      console.warn('Failed to persist attachments to storage:', e);
    }
  }, [attachments, id]);

  // Persist attachments to server per chat id
  useEffect(() => {
    // Skip syncing until the chat exists on the server
    if (!hasServerChat) return;

    const controller = new AbortController();
    async function sync() {
      try {
        const res = await fetch(`/api/chat`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: id, attachments }),
          signal: controller.signal,
        });
        if (!res.ok) {
          // Suppress expected 404s (e.g., brand new chats not yet persisted elsewhere)
          if (res.status !== 404) {
            toast({
              type: 'error',
              description: 'Failed to sync attachments. Changes may not persist.',
            });
          }
        }
      } catch (e) {
        // Ignore abort errors and surface others in console
        if ((e as any)?.name !== 'AbortError') {
          console.warn('Failed to sync chat attachments:', e);
        }
      }
    }
    // Debounce slightly to avoid rapid updates
    const t = setTimeout(sync, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [attachments, id, hasServerChat]);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  const currentToolCall = useMemo(() => {
    const tools = messages
      .at(-1)
      ?.parts.filter((part) => part.type === 'tool-invocation');

    if (
      tools?.[0]?.toolInvocation &&
      toolCall === tools[0]?.toolInvocation.toolName
    ) {
      return tools[0].toolInvocation.toolName;
    } else {
      return undefined;
    }
  }, [toolCall, messages]);

  // Enhanced thinking message that includes progress info
  const enhancedThinkingInfo = useMemo(() => {
    if (!thinkingState.isThinking && !currentToolCall) return undefined;

    // Get progress for current tool if available
    const currentProgress = thinkingState.toolName
      ? toolProgress[thinkingState.toolName]
      : undefined;

    return {
      currentToolCall: thinkingState.toolName || currentToolCall,
      message: thinkingState.message,
      progress: currentProgress?.progress,
      stepType: thinkingState.stepType,
      isThinking: thinkingState.isThinking || status === 'submitted',
      status: thinkingState.status,
    };
  }, [thinkingState, currentToolCall, toolProgress, status]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          attachments={attachments}
          setAttachments={setAttachments}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          enhancedThinkingInfo={enhancedThinkingInfo}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>
    </>
  );
}
