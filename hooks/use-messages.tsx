'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { UseChatHelpers } from '@ai-sdk/react';

export function useMessages({
  chatId,
  status,
  messages,
}: {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: any[];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);
  const lastMessageContentRef = useRef<string>('');

  useEffect(() => {
    if (chatId) {
      scrollToBottom('instant');
      setHasSentMessage(false);
    }
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (status === 'submitted') {
      setHasSentMessage(true);
    }
  }, [status]);

  useEffect(() => {
    if (
      messages.length > 0 &&
      isAtBottom &&
      (status === 'streaming' || hasSentMessage)
    ) {
      scrollToBottom('smooth');
    }
  }, [messages.length, isAtBottom, status, hasSentMessage, scrollToBottom]);

  useEffect(() => {
    if (status === 'streaming' && isAtBottom) {
      scrollToBottom('smooth');
    }
  }, [status, isAtBottom, scrollToBottom]);

  useEffect(() => {
    if (status === 'streaming' && messages.length > 0 && isAtBottom) {
      const lastMessage = messages[messages.length - 1];
      const currentContent = lastMessage?.content || '';

      // Only scroll if content has actually changed and we're streaming
      if (
        currentContent !== lastMessageContentRef.current &&
        currentContent.length > 0
      ) {
        lastMessageContentRef.current = currentContent;
        // Use a small delay to ensure DOM has updated
        setTimeout(() => {
          scrollToBottom('smooth');
        }, 10);
      }
    }
  }, [messages, status, isAtBottom, scrollToBottom]);

  useEffect(() => {
    lastMessageContentRef.current = '';
  }, [chatId]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
