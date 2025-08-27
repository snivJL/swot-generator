'use client';

import useSWR from 'swr';
import { useRef, useEffect, useCallback } from 'react';

type ScrollFlag = ScrollBehavior | false;

export function useScrollToBottom(isStreaming?: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: isAtBottom = false, mutate: setIsAtBottom } = useSWR(
    'messages:is-at-bottom',
    null,
    {
      fallbackData: false,
    },
  );

  const { data: scrollBehavior = false, mutate: setScrollBehavior } =
    useSWR<ScrollFlag>('messages:should-scroll', null, { fallbackData: false });

  useEffect(() => {
    if (!endRef.current) return;

    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Clear any pending timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setIsAtBottom(true);
        } else {
          const delay = isStreaming ? 800 : 200;

          // Clear existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            if (observerRef.current) {
              const currentEntries = observerRef.current.takeRecords();
              const latestEntry = currentEntries[0] || entry;
              if (!latestEntry.isIntersecting) {
                setIsAtBottom(false);
              }
            }
            timeoutRef.current = null;
          }, delay);
        }
      },
      {
        root: containerRef.current,
        rootMargin: isStreaming ? '0px 0px 200px 0px' : '0px 0px 100px 0px',
        threshold: [0, 0.1, 0.5],
      },
    );

    observerRef.current.observe(endRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [setIsAtBottom, isStreaming]);

  useEffect(() => {
    if (scrollBehavior) {
      endRef.current?.scrollIntoView({ behavior: scrollBehavior });
      setScrollBehavior(false);
    }
  }, [setScrollBehavior, scrollBehavior]);

  const scrollToBottom = useCallback(
    (scrollBehavior: ScrollBehavior = 'smooth') => {
      setScrollBehavior(scrollBehavior);
    },
    [setScrollBehavior],
  );

  function onViewportEnter() {
    // This is now handled by the intersection observer
  }

  function onViewportLeave() {
    // This is now handled by the intersection observer
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
