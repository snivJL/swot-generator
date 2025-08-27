import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import { createSwot } from '@/lib/ai/tools/create-swot';
import { generateQuestions } from '@/lib/ai/tools/generate-questions';
import { dueDiligenceQuestions } from '@/lib/ai/tools/format-memo';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;
  console.log('Api Called');
  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }
  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody;
    console.log('Checking auth');
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });
      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }
    console.log('Getting messages...');
    const previousMessages = await getMessagesByChatId({ id });

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });
    console.log('Saving messages...');
    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });
    console.log('Creating data stream...');

    const stream = createDataStream({
      execute: (dataStream) => {
        // Send initial thinking state
        const hasAttachedDocument = messages.some(
          (message) =>
            message.role === 'user' && message.experimental_attachments?.length,
        );
        dataStream.writeData({
          type: 'thinking-start',
          content: hasAttachedDocument
            ? messages.length > 1
              ? `Getting relevant information from your document...`
              : 'Scanning your document...'
            : 'Analyzing your request...',
        });

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools: [
            'createSwot',
            'generateQuestions',
            // 'createMemo',
            'dueDiligenceQuestions',
          ],
          experimental_transform: smoothStream({
            chunking: 'word',
            delayInMs: 20,
          }),
          experimental_generateMessageId: generateUUID,
          tools: {
            createSwot: createSwot({ dataStream }),
            generateQuestions: generateQuestions({ dataStream }),
            // createMemo: createMemo({ dataStream }),
            dueDiligenceQuestions: dueDiligenceQuestions({ dataStream }),
          },

          onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
            // console.groupCollapsed(
            //   '%c✨ Step Finished',
            //   'color: #0A6AE7; font-weight: bold; font-size: 12px;',
            // );
            // console.log('%cText:', 'font-weight: bold;', text);

            // Send immediate feedback when tool calls are detected
            // if (Array.isArray(toolCalls) && toolCalls.length) {
            //   console.groupCollapsed('🔧 Tool Calls');
            //   toolCalls.forEach((call, i) => {
            //     console.groupCollapsed(`Call ${i} – ${call.toolName}`);
            //     console.log('%cType:', 'font-weight:bold;', call.type);
            //     console.log(
            //       '%ctoolCallId:',
            //       'font-weight:bold;',
            //       call.toolCallId,
            //     );
            //     console.log('Args (JSON):', JSON.stringify(call.args, null, 2));

            //     // Send tool starting feedback when we detect the call
            //     // const toolFeedback = getToolFeedback(call.toolName);
            //     // dataStream.writeData({
            //     //   type: 'thinking-update',
            //     //   content: toolFeedback.starting,
            //     //   stepType: 'tool-call',
            //     //   toolName: call.toolName,
            //     // });

            //     console.groupEnd();
            //   });
            //   console.groupEnd();
            // }

            // // Tool results feedback
            // if (Array.isArray(toolResults) && toolResults.length) {
            //   console.groupCollapsed('📥 Tool Results');
            //   toolResults.forEach((res, i) => {
            //     console.groupCollapsed(`Result ${i} – ${res.toolName}`);
            //     console.log('%cType:', 'font-weight:bold;', res.type);
            //     console.log(
            //       '%ctoolCallId:',
            //       'font-weight:bold;',
            //       res.toolCallId,
            //     );
            //     console.log('%cArgs:', 'font-weight:bold;', res.args);
            //     console.dir(res.result, { depth: null });

            //     // Send completion feedback
            //     const toolFeedback = getToolFeedback(res.toolName);
            //     dataStream.writeData({
            //       type: 'thinking-update',
            //       content: toolFeedback.completed,
            //       stepType: 'tool-result',
            //       toolName: res.toolName,
            //     });

            //     console.groupEnd();
            //   });
            //   console.groupEnd();
            // }

            if (finishReason === 'stop') {
              dataStream.writeData({
                type: 'thinking-update',
                content: 'Finalizing response...',
                stepType: 'completion',
              });
            } else if (finishReason === 'tool-calls') {
              // dataStream.writeData({
              //   type: 'thinking-update',
              //   content: 'Processing tool results...',
              //   stepType: 'processing',
              // });
            } else if (text?.trim()) {
              dataStream.writeData({
                type: 'thinking-update',
                content: 'Generating response...',
                stepType: 'generate',
              });
            }
          },

          onFinish: async ({ response, usage, finishReason }) => {
            dataStream.writeData({
              type: 'thinking-end',
              content: 'Analysis complete',
            });

            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });

                // Send final completion data
                dataStream.writeData({
                  type: 'completion-meta',
                  content: JSON.stringify({
                    usage,
                    finishReason,
                    stepCount: response.messages.length,
                  }),
                });
              } catch (error) {
                console.error('Failed to save chat:', error);
                dataStream.writeData({
                  type: 'error',
                  content: 'Failed to save conversation',
                });
              }
            }
          },

          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('Stream error:', error);
        return 'Oops, an error occurred while processing your request!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    console.error('Unexpected error:', error);
    return new ChatSDKError('offline:api').toResponse();
  }
}

// Helper function to provide contextual feedback for different tools
function getToolFeedback(toolName: string) {
  const feedbackMap: Record<
    string,
    { starting: string; executing: string; completed: string }
  > = {
    createSwot: {
      starting: 'Preparing SWOT analysis...',
      executing:
        'Analyzing strengths, weaknesses, opportunities, and threats...',
      completed: 'SWOT analysis complete',
    },
    generateQuestions: {
      starting: 'Preparing due diligence questions...',
      executing: 'Generating relevant questions for your analysis...',
      completed: 'Questions generated successfully',
    },
    default: {
      starting: 'Initializing tool...',
      executing: 'Processing with tool...',
      completed: 'Tool execution complete',
    },
  };

  return feedbackMap[toolName] || feedbackMap.default;
}

// Keep existing GET and DELETE methods unchanged
export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
