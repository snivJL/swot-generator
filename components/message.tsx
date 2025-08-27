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

const ThinkingIndicator = ({
  thinkingInfo,
}: { thinkingInfo: ThinkingInfo }) => {
  if (!thinkingInfo.isThinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="border border-border/50 bg-muted/20 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div
            className="size-1 bg-foreground/40 rounded-full animate-pulse"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="size-1 bg-foreground/40 rounded-full animate-pulse"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="size-1 bg-foreground/40 rounded-full animate-pulse"
            style={{ animationDelay: '300ms' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm text-foreground/80 font-medium leading-tight">
            {thinkingInfo.message}
          </span>

          {thinkingInfo.currentToolCall && (
            <div className="mt-1">
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/30">
                {thinkingInfo.currentToolCall}
              </span>
            </div>
          )}
        </div>
      </div>

      {thinkingInfo.progress !== undefined && thinkingInfo.progress > 0 && (
        <div className="mt-3">
          <div className="w-full bg-muted/50 rounded-full h-1 overflow-hidden">
            <motion.div
              className="bg-foreground/20 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, thinkingInfo.progress)}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
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
