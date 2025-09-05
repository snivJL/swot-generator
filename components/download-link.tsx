import { Download, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface DownloadLinkProps {
  url: string;
  title: string;
  type: 'memo' | 'swot';
  className?: string;
}
const MotionCard = motion.create(Card);

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};
export function DownloadLink({
  url,
  title,
  type,
  className,
}: DownloadLinkProps) {
  const getIcon = () => {
    switch (type) {
      case 'memo':
        return <FileText className="size-5" />;
      case 'swot':
        return <BarChart3 className="size-5" />;
      default:
        return <Download className="size-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'memo':
        return 'Memo';
      case 'swot':
        return 'SWOT Analysis';
      default:
        return 'Document';
    }
  };

  const getBgGradient = () => {
    switch (type) {
      case 'memo':
        return 'from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100';
      case 'swot':
        return 'from-gray-50 to-neutral-50 border-gray-200 hover:from-gray-100 hover:to-neutral-100 hover:border-gray-300';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200 hover:from-gray-100 hover:to-slate-100';
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'memo':
        return 'text-blue-700 hover:text-blue-800';
      case 'swot':
        return 'text-gray-800 hover:text-gray-900';
      default:
        return 'text-gray-700 hover:text-gray-800';
    }
  };

  return (
    <AnimatePresence>
      <MotionCard
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'p-4 cursor-pointer group bg-gradient-to-br border-2',
          getBgGradient(),
          className,
        )}
      >
        <a
          href={url}
          download
          className="block no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg transition-colors',
                type === 'memo'
                  ? 'bg-blue-100 group-hover:bg-blue-200'
                  : 'bg-gray-100 group-hover:bg-gray-200',
              )}
            >
              <div className={getAccentColor()}>{getIcon()}</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'text-xs font-medium uppercase tracking-wide',
                    getAccentColor(),
                  )}
                >
                  {getTypeLabel()}
                </span>
                <div className="size-1 rounded-full bg-gray-400" />
                <span className="text-xs text-gray-600">Ready to download</span>
              </div>
              <h4 className="font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                {title}
              </h4>
            </div>

            <div
              className={cn(
                'p-2 rounded-full transition-all duration-200 group-hover:scale-110 shadow-sm',
                type === 'memo'
                  ? 'bg-blue-500 group-hover:bg-blue-600'
                  : 'bg-[#171717] group-hover:bg-black',
              )}
            >
              <Download className="size-4 text-white" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200/50">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-center gap-2 font-medium transition-all duration-200',
                getAccentColor(),
                'group-hover:bg-white/50',
              )}
            >
              <Download className="size-4" />
              Download {getTypeLabel()}
            </Button>
          </div>
        </a>
      </MotionCard>
    </AnimatePresence>
  );
}
