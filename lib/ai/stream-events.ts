// Shared stream event types used between server and client

export type ThinkingStartEvent = {
  type: 'thinking-start';
  content: string;
};

export type ThinkingUpdateEvent = {
  type: 'thinking-update';
  content: string;
  stepType?: string;
  toolName?: string;
};

export type ThinkingEndEvent = {
  type: 'thinking-end';
  content: string;
};

export type ToolProgressEvent = {
  type: 'tool-progress';
  content: string; // human-readable progress message
  toolName: string;
  progress?: number; // 0-100
};

export type QuestionGeneratedEvent = {
  type: 'question-generated';
  content:
    | string
    | {
        question: string;
        category: string;
        reasoning?: string;
      };
  questionIndex: number;
  questionType?: 'custom' | 'template';
};

export type CompletionMetaEvent = {
  type: 'completion-meta';
  content: string; // stringified JSON
};

export type ErrorEvent = {
  type: 'error';
  data: { message: string };
};

export type AppendMessageEvent = {
  type: 'append-message';
  message: string; // stringified message
};

export type SimpleInfoEvent =
  | { type: 'id'; content: string }
  | { type: 'title'; content: string }
  | { type: 'clear'; content: string }
  | { type: 'finish'; content: string }
  | { type: 'questions-meta'; content: string };

export type StreamEvent =
  | ThinkingStartEvent
  | ThinkingUpdateEvent
  | ThinkingEndEvent
  | ToolProgressEvent
  | QuestionGeneratedEvent
  | CompletionMetaEvent
  | ErrorEvent
  | AppendMessageEvent
  | SimpleInfoEvent;
