import { cx } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";

export const ThinkingMessage = ({
  currentToolCall,
}: {
  currentToolCall?: string;
}) => {
  const role = "assistant";
  const message =
    currentToolCall === "createMemo"
      ? "Creating Memo"
      : currentToolCall === "createSwot"
      ? "Creating SWOT"
      : currentToolCall === "formatMemo"
      ? "Formatting Memo"
      : currentToolCall === "generateQuestions"
      ? "Generating questions"
      : currentToolCall === "addResource"
      ? "Adding information"
      : "Thinking";

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
      data-role={role}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          }
        )}
      >
        {/* Minimal avatar */}
        <div
          className="size-8 flex items-center rounded-full justify-center shrink-0"
          style={{ backgroundColor: "#171717" }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="flex items-center gap-2 py-2">
          <AnimatePresence mode="wait">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {message}
            </motion.span>
          </AnimatePresence>

          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "#171717" }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
