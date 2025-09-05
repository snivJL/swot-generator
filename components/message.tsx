'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { DownloadLink } from './download-link';
import Image from 'next/image';
import { getToolDisplayName } from './thinking-message';

interface GeneratedQuestion {
  content: string;
  type: 'custom' | 'template';
  index: number;
}

interface ToolProgress {
  toolName: string;
  progress?: number;
  message: string;
  type?: string;
}

interface ThinkingInfo {
  currentToolCall?: string;
  message: string;
  progress?: number;
  stepType?: string;
  isThinking: boolean;
  status?: string;
}

// Map step types to a consistent color used for accents/progress
function getStepAccent(stepType?: string): string {
  switch (stepType) {
    case 'tool-call':
      return '#3b82f6'; // blue
    case 'tool-execution':
      return '#f59e0b'; // amber
    case 'tool-result':
      return '#10b981'; // emerald
    case 'generate':
      return '#8b5cf6'; // violet
    case 'processing':
      return '#6366f1'; // indigo
    case 'completion':
      return '#10b981'; // emerald
    default:
      return 'rgba(0,0,0,0.6)';
  }
}

// Format step type for display
function formatStep(stepType?: string): string | undefined {
  if (!stepType) return undefined;
  return stepType.replace(/-/g, ' ');
}

const ThinkingIndicator = ({
  thinkingInfo,
}: { thinkingInfo: ThinkingInfo }) => {
  if (!thinkingInfo.isThinking) return null;

  const accent = getStepAccent(thinkingInfo.stepType);
  const stepLabel = formatStep(thinkingInfo.stepType);
  const progress =
    typeof thinkingInfo.progress === 'number'
      ? Math.max(0, Math.min(100, thinkingInfo.progress))
      : undefined;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="border border-border/50 bg-muted/20 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        {/* Animated dots with step accent */}
        <div className="flex items-center gap-1 pt-1">
          <div
            className="size-1 rounded-full animate-pulse"
            style={{ animationDelay: '0ms', backgroundColor: accent }}
          />
          <div
            className="size-1 rounded-full animate-pulse"
            style={{ animationDelay: '150ms', backgroundColor: accent }}
          />
          <div
            className="size-1 rounded-full animate-pulse"
            style={{ animationDelay: '300ms', backgroundColor: accent }}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Primary message */}
          <span className="text-sm text-foreground/80 font-medium leading-tight">
            {thinkingInfo.message || 'Thinking...'}
          </span>

          {/* Meta row: step label + tool name + status */}
          {(stepLabel || thinkingInfo.currentToolCall || thinkingInfo.status) && (
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {stepLabel && (
                <span className="text-xs text-muted-foreground/80 capitalize">
                  {stepLabel}
                </span>
              )}

              {thinkingInfo.currentToolCall && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/30">
                  {getToolDisplayName(thinkingInfo.currentToolCall)}
                </span>
              )}

              {thinkingInfo.status && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded border border-border/30">
                  {thinkingInfo.status}
                </span>
              )}
            </div>
          )}

          {/* Progress bar with percentage */}
          {typeof progress === 'number' && progress > 0 && (
            <div className="mt-3">
              <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ backgroundColor: accent }}
                />
              </div>
              <div className="mt-1 flex justify-end">
                <span className="text-[10px] text-muted-foreground/70">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
  generatedQuestions,
  thinkingInfo,
  toolProgress,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  generatedQuestions?: Array<GeneratedQuestion>;
  thinkingInfo?: ThinkingInfo;
  toolProgress?: Record<string, ToolProgress>;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  console.log(thinkingInfo);
  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border/50 bg-background shadow-sm">
              <Image
                src="/logo-sm.svg"
                alt="kornelia logo"
                width={60}
                height={60}
                className="rounded-full"
              />
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.role === 'assistant' && thinkingInfo && (
              <ThinkingIndicator thinkingInfo={thinkingInfo} />
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              size="sm"
                              className="px-2 h-8 rounded-full text-muted-foreground/60 opacity-0 group-hover/message:opacity-100 hover:text-muted-foreground transition-all duration-200"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-sm border border-primary/10':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId}>
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'createSwot' ? (
                        <DownloadLink
                          url={result.url}
                          title={result.title}
                          type="swot"
                          className="my-2"
                        />
                      ) : toolName === 'createMemo' ? (
                        <DownloadLink
                          url={result.url}
                          title={result.title}
                          type="memo"
                          className="my-2"
                        />
                      ) : toolName === 'formatMemo' ? null : null}
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (!equal(prevProps.generatedQuestions, nextProps.generatedQuestions))
      return false;
    if (!equal(prevProps.thinkingInfo, nextProps.thinkingInfo)) return false;
    if (!equal(prevProps.toolProgress, nextProps.toolProgress)) return false;

    return true;
  },
);
