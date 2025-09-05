'use client';

import type { UIMessage } from 'ai';
import { PreviewMessage } from './message';
import { Greeting } from './greeting';
import { memo, Fragment, useMemo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { EnhancedThinkingMessage } from './thinking-message';
import type { ToolProgress } from './chat';
interface EnhancedThinkingInfo {
  currentToolCall?: string;
  message: string;
  progress?: number;
  stepType?: string;
  isThinking: boolean;
  status?: string;
}

interface GeneratedQuestion {
  content: string;
  type: 'custom' | 'template';
  index: number;
}

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  enhancedThinkingInfo?: EnhancedThinkingInfo;
  generatedQuestions?: Array<GeneratedQuestion>;
  toolProgress?: Record<string, ToolProgress>;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  enhancedThinkingInfo,
  generatedQuestions,
  toolProgress,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
    messages,
  });

  // Hide the thinking panel as soon as assistant starts streaming visible text
  const assistantHasText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.role !== 'assistant') continue;
      const parts = m.parts ?? [];
      for (const p of parts as any[]) {
        if (p?.type === 'text' && typeof p?.text === 'string' && p.text.trim().length > 0) {
          return true;
        }
      }
      // Found assistant without text; stop here
      return false;
    }
    return false;
  }, [messages]);

  // Whether we should show the thinking panel
  const showThinkingPanel =
    (status === 'submitted' || !!enhancedThinkingInfo?.isThinking) &&
    !assistantHasText;

  // Anchor position: directly under the most recent user message
  const lastUserIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') return i;
    }
    return -1;
  }, [messages]);

  const before = lastUserIndex >= 0 ? messages.slice(0, lastUserIndex + 1) : messages;
  const after = lastUserIndex >= 0 ? messages.slice(lastUserIndex + 1) : [];

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {messages.length === 0 && <Greeting />}

      {/* Render all messages up to and including the last user message */}
      {before.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isLastAssistantMessage =
          message.role === 'assistant' && isLastMessage;
        const isStreamingToThisMessage =
          status === 'streaming' && isLastMessage;

        return (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={isStreamingToThisMessage}
            vote={votes?.find((vote) => vote.messageId === message.id)}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            thinkingInfo={undefined}
            requiresScrollPadding={hasSentMessage && isLastMessage}
            generatedQuestions={generatedQuestions}
            toolProgress={toolProgress}
          />
        );
      })}

      {/* Persistent thinking panel directly below the last user message */}
      {showThinkingPanel && lastUserIndex >= 0 && (
        <div className="w-full mx-auto max-w-3xl px-4" key="thinking-panel">
          <EnhancedThinkingMessage
            currentToolCall={enhancedThinkingInfo?.currentToolCall}
            message={enhancedThinkingInfo?.message}
            progress={enhancedThinkingInfo?.progress}
            stepType={enhancedThinkingInfo?.stepType}
            status={enhancedThinkingInfo?.status}
          />
        </div>
      )}

      {/* Render the rest (assistant and others) after the thinking panel */}
      {after.map((message, offset) => {
        const index = (lastUserIndex >= 0 ? lastUserIndex + 1 : 0) + offset;
        const isLastMessage = index === messages.length - 1;
        const isStreamingToThisMessage = status === 'streaming' && isLastMessage;

        // While the thinking panel is visible, hide ALL assistant messages to
        // avoid flashes from placeholders or non-user-visible parts.
        if (message.role === 'assistant' && showThinkingPanel) return null;

        return (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={isStreamingToThisMessage}
            vote={votes?.find((vote) => vote.messageId === message.id)}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            thinkingInfo={undefined}
            requiresScrollPadding={hasSentMessage && isLastMessage}
            generatedQuestions={generatedQuestions}
            toolProgress={toolProgress}
          />
        );
      })}


      {messages.length > 0 ? (
        <motion.div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
          onViewportLeave={onViewportLeave}
          onViewportEnter={onViewportEnter}
        />
      ) : null}
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (!equal(prevProps.enhancedThinkingInfo, nextProps.enhancedThinkingInfo))
    return false;
  if (!equal(prevProps.toolProgress, nextProps.toolProgress)) return false;
  if (!equal(prevProps.generatedQuestions, nextProps.generatedQuestions))
    return false;

  return true;
});
