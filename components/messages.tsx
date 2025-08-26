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

export interface EnhancedThinkingInfo {
  currentToolCall?: string;
  message: string;
  progress?: number;
  stepType?: string;
  isThinking: boolean;
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
  });

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => {
        const isLoadingMessage =
          status === 'streaming' && messages.length - 1 === index;

        return (
          <>
            <PreviewMessage
              key={message.id}
              chatId={chatId}
              message={message}
              status={status}
              isLoading={isLoadingMessage}
              showThinking={isLoadingMessage}
              vote={
                votes
                  ? votes.find((vote) => vote.messageId === message.id)
                  : undefined
              }
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              requiresScrollPadding={
                hasSentMessage && index === messages.length - 1
              }
              enhancedThinkingInfo={enhancedThinkingInfo}
              generatedQuestions={generatedQuestions}
            />
          </>
        );
      })}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
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
  if (!equal(prevProps.generatedQuestions, nextProps.generatedQuestions))
    return false;

  return true;
});
