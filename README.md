SWOT Generator – AI Chat Demo
================================

An AI-powered chat app that helps analyze an uploaded document and generate actionable outputs like SWOT analyses and due‑diligence prompts. Built with Next.js App Router and Vercel AI SDK.

Features
--------

- Suggested prompts drawer with categories (Overview, Due‑diligence, Commercial, Exit).
- Single attachment workflow (one file per conversation) stored via Vercel Blob.
- One‑click prompts; free‑text input is disabled for the demo to showcase curated flows.
- Smooth UI with shadcn/ui, framer‑motion, and lucide icons.
- Serverless APIs for chat, file upload, and artifacts.

Tech Stack
---------

- Next.js 15 (App Router), TypeScript, React 19 RC
- Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`)
- Storage: Vercel Blob; Database: Vercel Postgres + Drizzle ORM
- Auth: NextAuth
- UI: Tailwind CSS + shadcn/ui, framer‑motion, lucide‑react

Getting Started
---------------

Prerequisites
~~~~~~~~~~~~~

- Node.js 18+ and pnpm (repo uses `pnpm@9`)
- An OpenAI API key (or configure a provider in `lib/ai/providers.ts`)
- Vercel Blob token (for uploads)
- A Postgres database (Vercel Postgres recommended)

1) Install dependencies
~~~~~~~~~~~~~~~~~~~~~~~

- `pnpm install`

2) Configure environment
~~~~~~~~~~~~~~~~~~~~~~~~

- Copy `.env.example` to `.env.local` and set these keys:
  - `OPENAI_API_KEY` – your OpenAI key
  - `BLOB_READ_WRITE_TOKEN` – Vercel Blob RW token
  - `DATABASE_URL` – Postgres connection string
  - Optional: `DATABASE_URL_UNPOOLED` for non‑pooled connections
- Never commit your secrets. The example file shows expected variables.

3) Database
~~~~~~~~~~~

- Generate/check migrations (Drizzle):
  - `pnpm db:generate` (generate SQL from schema)
  - `pnpm db:migrate` (apply migrations)
  - `pnpm db:studio` (optional UI)

4) Run the app
~~~~~~~~~~~~~~~

- `pnpm dev` then open `http://localhost:3000`

How It Works
------------

- Upload one document per chat using the paperclip button. The input accepts a single file; additional uploads are disabled once attached.
- Open the prompts drawer via the “Prompts” button.
- Choose a suggested prompt (e.g., “Conduct a SWOT analysis”). The app sends your prompt and attachment to the server.
- The server uses the configured model in `lib/ai/providers.ts` and returns structured responses.

Important Constraints
---------------------

- Single attachment per conversation is enforced in the UI and upload handler.
- Many prompts are demo‑gated until a file is attached (see `components/suggested-actions.tsx`).
- Free‑text typing is intentionally disabled in this demo.

Key Files
---------

- `components/multimodal-input.tsx` – chat input, attachments, and “Prompts” trigger.
- `components/suggested-actions.tsx` – categorized prompt library + drawer UI.
- `app/(chat)/api/files/upload/route.ts` – file upload API via Vercel Blob.
- `app/(chat)/api/chat/route.ts` – chat streaming API endpoint.
- `lib/ai/providers.ts` – model routing/configuration.
- `lib/db/*` – Drizzle ORM schema and queries.

Testing
-------

- Playwright tests available: `pnpm test`
- Some tests require a running app and valid env variables.

Deployment
----------

- Easiest path is Vercel:
  - Set environment variables in the Vercel dashboard.
  - Connect Vercel Blob and Vercel Postgres.
  - Deploy. The serverless routes under `app/(chat)/api/*` will be hosted automatically.

Roadmap Ideas
-------------

- Multi‑file ingestion with summarization and referencing.
- More artifact types (slides, memos) and export formats.
- User‑editable prompt templates and sharing.

Contributing
------------

- Create a feature branch, open a PR to `main`.
- Keep changes minimal and focused; follow existing code style.

---

Note: This demo intentionally limits input options to highlight guided workflows. You can re‑enable free text and multi‑attachment flows by adjusting the guards in `components/multimodal-input.tsx` and `components/suggested-actions.tsx`.

