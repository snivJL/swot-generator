'use client';

import type React from 'react';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function Badge({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
      {children}
    </span>
  );
}

function clampPct(p?: number) {
  if (typeof p !== 'number' || Number.isNaN(p)) return undefined;
  return Math.max(0, Math.min(100, Math.round(p)));
}

function prettyStep(step?: string) {
  if (!step) return undefined;
  return step
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const EnhancedThinkingMessage = ({
  currentToolCall,
  message,
  progress,
  stepType,
}: {
  currentToolCall?: string;
  message?: string;
  progress?: number;
  stepType?: string;
}) => {
  const pct = clampPct(progress);
  const stepLabel = useMemo(() => prettyStep(stepType), [stepType]);
  const heading = currentToolCall ? `Running ${currentToolCall}` : message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full mx-auto max-w-3xl px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-4">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <Image
            src="/logo-sm.svg"
            alt="assistant avatar"
            width={60}
            height={60}
            className="rounded-full"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Spinner className="size-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-foreground text-sm">
                {heading}
              </span>
            </div>
            {stepLabel && <Badge>{stepLabel}</Badge>}
          </div>

          {message && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-foreground/90 leading-relaxed">
                {message}
              </p>
            </div>
          )}

          <div className="mb-4">
            {typeof pct === 'number' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-medium">Progress</span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                </div>
                <span>Processing your request…</span>
              </div>
            )}
          </div>

          {(currentToolCall || stepLabel || typeof pct === 'number') && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
              <div className="space-y-1">
                {currentToolCall && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>
                      Tool:{' '}
                      <span className="font-medium text-foreground/70">
                        {currentToolCall}
                      </span>
                    </span>
                  </div>
                )}
                {stepLabel && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>
                      Step:{' '}
                      <span className="font-medium text-foreground/70">
                        {stepLabel}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  <span>
                    {typeof pct === 'number'
                      ? `Working through task — ${pct}% complete`
                      : 'Preparing response…'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
