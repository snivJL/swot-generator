'use client';

import type React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { memo, useState } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Attachment } from 'ai';
import equal from 'fast-deep-equal';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { BarChart3, Search, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestedAction {
  question: string;
  action: string;
}

interface ActionCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  actions: SuggestedAction[];
}

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  attachments: Array<Attachment>;
  mode?: 'initial' | 'drawer';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const actionCategories: ActionCategory[] = [
  {
    id: 'overview',
    name: 'Overview',
    icon: Search,
    color: 'from-blue-500 to-cyan-500',
    actions: [
      {
        question: 'Explain the business model in simple terms',
        action: 'Explain the business model in simple terms.',
      },
      {
        question: 'Describe the founding team and their relevant experience',
        action: 'Describe the founding team and their relevant experience.',
      },
      {
        question: 'Summarize key financials, including ARR, growth rate, EBIT',
        action: 'Summarize key financials, including ARR, growth rate, EBIT.',
      },
      {
        question: 'Conduct a SWOT analysis',
        action: 'Conduct a SWOT analysis?',
      },
    ],
  },
  {
    id: 'commercial',
    name: 'Commercial & Ops',
    icon: BarChart3,
    color: 'from-green-500 to-teal-500',
    actions: [
      {
        question: 'Summarize the customer base and any concentration issues',
        action: 'Summarize the customer base and any concentration issues.',
      },
      {
        question: 'What does the sales and distribution model look like?',
        action: 'What does the sales and distribution model look like?',
      },
      {
        question: 'What initiatives has management outlined for growth?',
        action: 'What initiatives has management outlined for growth?',
      },
      {
        question:
          "Summarize the company's organizational structure and key roles",
        action:
          "Summarize the company's organizational structure and key roles.",
      },
    ],
  },
  {
    id: 'financial',
    name: 'Due diligence',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    actions: [
      {
        question:
          'Write a list of Financial & Unit Economics due diligence questions',
        action:
          'Write a list of Financial & Unit Economics due diligence questions',
      },
      {
        question:
          'Write a list of Market, Customers & Growth due diligence questions',
        action:
          'Write a list of Market, Customers & Growth due diligence questions',
      },
      {
        question:
          'Write a list of Operations, Technology & People due diligence questions',
        action:
          'Write a list of Operations, Technology & People due diligence questions',
      },
      {
        question:
          'Write a list of Legal, Compliance & Governance due diligence questions',
        action:
          'Write a list of Legal, Compliance & Governance due diligence questions',
      },
    ],
  },
  {
    id: 'exit',
    name: 'Exit & Investment',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
    actions: [
      {
        question: 'List the key investment highlights mentioned',
        action: 'List the key investment highlights mentioned.',
      },
      {
        question:
          'Summarize how the company differentiates itself from competitors',
        action:
          'Summarize how the company differentiates itself from competitors.',
      },
      {
        question:
          'What rationale is given for a future buyer to be interested?',
        action: 'What rationale is given for a future buyer to be interested.',
      },
      {
        question: 'List any comparable companies or transactions mentioned',
        action: 'List any comparable companies or transactions mentioned.',
      },
    ],
  },
];

function PureSuggestedActions({
  chatId,
  append,
  attachments,
  mode = 'initial',
  isOpen,
  onOpenChange,
}: SuggestedActionsProps) {
  const [activeTab, setActiveTab] = useState(actionCategories[0].id);

  const handleActionClick = async (action: string) => {
    window.history.replaceState({}, '', `/chat/${chatId}`);
    append({
      role: 'user',
      content: action,
      experimental_attachments: attachments,
    });

    if (mode === 'drawer' && onOpenChange) {
      onOpenChange(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const actionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const renderContent = ({ mode }: { mode?: 'initial' | 'drawer' }) => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {actionCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{category.name}</span>
              <span className="sm:hidden">{category.name.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence>
          {actionCategories.map((category) => (
            <TabsContent
              key={category.id}
              value={category.id}
              className="mt-0 mx-6"
            >
              {activeTab === category.id && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={cn('grid gap-3', {
                    'lg:grid-cols-2': mode === 'drawer',
                  })}
                >
                  {category.actions.map((suggestedAction, actionIndex) => (
                    <motion.div
                      key={`${category.id}-${actionIndex}`}
                      variants={actionVariants}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleActionClick(suggestedAction.action)
                        }
                        className="relative group text-left border rounded-xl px-4 py-4 text-sm w-full h-auto justify-start items-start hover:border-primary/20 hover:bg-gradient-to-br hover:from-background hover:to-muted/50 transition-all duration-300 min-h-[40px]"
                      >
                        <div className="flex items-start w-full">
                          <div className="flex-1">
                            <span className="font-medium block leading-relaxed text-foreground">
                              {suggestedAction.question}
                            </span>
                          </div>
                        </div>

                        <motion.div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-5`}
                          initial={false}
                          transition={{ duration: 0.3 }}
                        />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </div>
  );

  if (mode === 'drawer') {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Suggested Actions
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {renderContent({ mode })}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div
      data-testid="suggested-actions"
      className="w-full max-w-5xl mx-auto p-6"
    >
      {renderContent({ mode })}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.mode !== nextProps.mode) return false;
    if (prevProps.isOpen !== nextProps.isOpen) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    return true;
  },
);
