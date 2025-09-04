'use client';

import type { UIMessage } from 'ai';
import { PreviewMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
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

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isLastAssistantMessage =
          message.role === 'assistant' && isLastMessage;
        const isStreamingToThisMessage =
          status === 'streaming' && isLastMessage;

        // Only show thinking info on the last assistant message when streaming
        const shouldShowThinking =
          isLastAssistantMessage &&
          (isStreamingToThisMessage || enhancedThinkingInfo?.isThinking);

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
            thinkingInfo={shouldShowThinking ? enhancedThinkingInfo : undefined}
            requiresScrollPadding={hasSentMessage && isLastMessage}
            generatedQuestions={generatedQuestions}
            toolProgress={toolProgress}
          />
        );
      })}

      {(status === 'submitted' || enhancedThinkingInfo?.isThinking) &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && (
          <div className="w-full mx-auto max-w-3xl px-4">
            <EnhancedThinkingMessage
              currentToolCall={enhancedThinkingInfo?.currentToolCall}
              message={enhancedThinkingInfo?.message}
              progress={enhancedThinkingInfo?.progress}
              stepType={enhancedThinkingInfo?.stepType}
            />
          </div>
        )}

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
