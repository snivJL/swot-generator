import { cx } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface EnhancedThinkingMessageProps {
  currentToolCall?: string;
  message?: string;
  progress?: number;
  stepType?: string;
  status?: string;
  variant?: 'full' | 'inline';
  showAvatar?: boolean;
  className?: string;
}

export const EnhancedThinkingMessage = ({
  currentToolCall,
  message,
  progress,
  stepType,
  status,
  variant = 'full',
  showAvatar,
  className,
}: EnhancedThinkingMessageProps) => {
  const role = 'assistant';

  // Get display message with fallback logic
  const displayMessage = message || getDefaultMessage(currentToolCall);

  // Determine if we should show progress bar
  const showProgress =
    typeof progress === 'number' && progress >= 0 && progress <= 100;

  // Get step-specific styling
  const stepColor = getStepColor(stepType);

  const containerClasses = cx(
    variant === 'full' && 'w-full mx-auto max-w-3xl px-4 group/message',
    variant === 'inline' &&
      'border border-border/50 bg-muted/20 rounded-lg p-3',
    className,
  );

  const rowClasses = cx(
    'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
    { 'group-data-[role=user]/message:bg-muted': variant === 'full' },
  );

  const shouldShowAvatar = showAvatar ?? variant === 'full';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className={containerClasses}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
      data-role={role}
      role="status"
      aria-live="polite"
    >
      <div className={rowClasses}>
        {/* Enhanced avatar with tool indication */}
        {shouldShowAvatar && (
          <div className="relative size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <Image
              src="/logo-sm.svg"
              alt="kornelia logo"
              width={60}
              height={60}
              className="rounded-full"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 py-2 flex-1">
          {/* Main thinking message */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={displayMessage} // Re-animate when message changes
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground font-medium"
              >
                {displayMessage}
              </motion.span>
            </AnimatePresence>

            {/* Animated dots */}
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: stepColor }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-muted rounded-full h-1.5 overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: stepColor }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </motion.div>
          )}

          {/* Step type indicator and status */}
          {(stepType || status || currentToolCall) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: stepColor }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {stepType && (
                  <span className="text-xs text-muted-foreground/70 capitalize">
                    {stepType.replace(/-/g, ' ')}
                  </span>
                )}
                {currentToolCall && (
                  <span className="text-xs text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded-md border border-border/30">
                    {getToolDisplayName(currentToolCall)}
                  </span>
                )}
                {status && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded border border-border/30">
                    {status}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to get default message based on tool
function getDefaultMessage(currentToolCall?: string): string {
  switch (currentToolCall) {
    case 'createMemo':
      return 'Creating memo';
    case 'createSwot':
      return 'Creating SWOT analysis';
    case 'formatMemo':
      return 'Formatting memo';
    case 'generateQuestions':
      return 'Generating questions';
    case 'addResource':
      return 'Adding information';
    default:
      return 'Analyzing your request';
  }
}

// Helper function to get step-specific colors
function getStepColor(stepType?: string): string {
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
      return '#171717'; // default dark
  }
}

// Helper function to get user-friendly tool names
export function getToolDisplayName(toolName: string): string {
  switch (toolName) {
    case 'createMemo':
      return 'Memo Creator';
    case 'createSwot':
      return 'SWOT Analyzer';
    case 'formatMemo':
      return 'Formatter';
    case 'generateQuestions':
      return 'Question Generator';
    case 'addResource':
      return 'Resource Manager';
    default:
      return toolName;
  }
}
