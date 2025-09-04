import { z } from 'zod';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(2000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1).max(2000),
          contentType: z.enum(['application/pdf']),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning']),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(2000),
  contentType: z.enum(['application/pdf']),
});

export const patchAttachmentsBodySchema = z.object({
  chatId: z.string().uuid(),
  attachments: z.array(attachmentSchema),
});

export type PatchAttachmentsBody = z.infer<typeof patchAttachmentsBodySchema>;
