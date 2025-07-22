"use client";

import type { Attachment } from "ai";
import { FileText, ImageIcon, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";

interface AttachmentDisplayProps {
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  className?: string;
}

function getFileIcon(contentType?: string) {
  if (!contentType) return <File className="h-4 w-4" />;

  if (contentType.startsWith("image/")) {
    return <ImageIcon className="h-4 w-4" />;
  }

  if (
    contentType.includes("text") ||
    contentType.includes("pdf") ||
    contentType.includes("document")
  ) {
    return <FileText className="h-4 w-4" />;
  }

  return <File className="h-4 w-4" />;
}

function getFileTypeLabel(contentType?: string) {
  if (!contentType) return "File";

  if (contentType.startsWith("image/")) return "Image";
  if (contentType.includes("pdf")) return "PDF";
  if (contentType.includes("text")) return "Text";
  if (contentType.includes("document")) return "Document";

  return "File";
}

export function AttachmentDisplay({
  attachments,
  setAttachments,
  className,
}: AttachmentDisplayProps) {
  if (attachments.length === 0) return null;

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const clearAllAttachments = () => {
    setAttachments([]);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center gap-2 animate-in slide-in-from-top-2 duration-300",
          className
        )}
      >
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              Chatting with
            </span>
          </div>

          <div className="flex items-center gap-1 max-w-[200px] md:max-w-[300px]">
            {attachments.slice(0, 2).map((attachment, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 bg-background rounded-md px-2 py-1 border border-border/30 hover:border-border/60 transition-colors">
                    {getFileIcon(attachment.contentType)}
                    <span className="text-sm font-medium truncate max-w-[80px] md:max-w-[120px]">
                      {attachment.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5 h-auto"
                    >
                      {getFileTypeLabel(attachment.contentType)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachment(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center bg-white">
                    <div className="font-medium">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {getFileTypeLabel(attachment.contentType)}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}

            {attachments.length > 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    +{attachments.length - 2} more
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 bg-white">
                    {attachments.slice(2).map((attachment, index) => (
                      <div key={index} className="text-sm">
                        {attachment.name}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={clearAllAttachments}
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-white">
            Clear all attachments
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
