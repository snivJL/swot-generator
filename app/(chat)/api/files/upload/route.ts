import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { auth } from '@/app/(auth)/auth';

// This route implements the Vercel Blob client upload flow.
// It handles two types of events:
// - blob.generate-client-token (from the browser) -> returns a client token
// - blob.upload-completed (from Vercel Blob) -> verifies signature and acknowledges
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Only enforce session auth for the client token generation step.
    if (body?.type === 'blob.generate-client-token') {
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const result = await handleUpload({
      request,
      body,
      // Enforce content-type and size limits here
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15MB
          addRandomSuffix: true,
          // cacheControlMaxAge: 60 * 60, // optionally 1 hour
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Optionally persist metadata or audit log here
        // console.log('Blob upload completed:', blob);
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
