import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface GeneratedQuestion {
  content: string;
  type: 'custom' | 'template';
  index: number;
}

interface QuestionsDisplayProps {
  result: {
    questionsFromTemplate: string[];
    generatedQuestions: string[];
    metadata?: {
      category: string;
      totalQuestions: number;
      processingTime: number;
    };
  };
  generatedQuestions?: Array<GeneratedQuestion>;
}

export function QuestionsDisplay({
  result,
  generatedQuestions,
}: QuestionsDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = async (text: string, index: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const allQuestions = [
    ...result.generatedQuestions.map((q, i) => ({
      content: q,
      type: 'custom' as const,
      index: i,
    })),
    ...result.questionsFromTemplate.map((q, i) => ({
      content: q,
      type: 'template' as const,
      index: i + result.generatedQuestions.length,
    })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg
              className="size-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Due Diligence Questions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {result.metadata?.category && (
                <>
                  {result.metadata.category.replace(/([A-Z])/g, ' $1').trim()} •
                </>
              )}
              {allQuestions.length} questions generated
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allText = allQuestions
              .map((q) => `• ${q.content}`)
              .join('\n');
            handleCopy(allText, 'all');
          }}
          className="text-xs"
        >
          {copiedIndex === 'all' ? (
            <CheckCircle className="size-3 mr-1" />
          ) : (
            <Copy className="size-3 mr-1" />
          )}
          Copy All
        </Button>
      </div>

      {/* Custom Questions Section */}
      {result.generatedQuestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <div className="size-2 bg-blue-500 rounded-full" />
            Custom Questions ({result.generatedQuestions.length})
          </h4>
          <div className="space-y-3">
            {result.generatedQuestions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {question}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(question, `custom-${index}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  >
                    {copiedIndex === `custom-${index}` ? (
                      <CheckCircle className="size-3 text-green-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Template Questions Section */}
      {result.questionsFromTemplate.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <div className="size-2 bg-gray-500 rounded-full" />
            Template Questions ({result.questionsFromTemplate.length})
          </h4>
          <div className="space-y-3">
            {result.questionsFromTemplate.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: (result.generatedQuestions.length + index) * 0.1,
                }}
                className="group bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {question}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(question, `template-${index}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  >
                    {copiedIndex === `template-${index}` ? (
                      <CheckCircle className="size-3 text-green-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      {result.metadata && (
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Category:{' '}
              {result.metadata.category.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span>
              Generated at{' '}
              {new Date(result.metadata.processingTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
