# Conversation-Level Email Threading

A class project that groups emails by **topic** (semantic clustering) instead of by subject-line threads, so that e.g. a recruiter’s “take this coding test” email and the separate HackerRank invite appear in the same conversation.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the **Threads** / **Conversations** toggle to switch views.

## Features

- **Thread view**: Classic inbox by subject-line threads.
- **Conversation view**: Semantic clusters by topic; one conversation can span multiple threads and labels.
- **Conversation detail**: All messages in chronological order with “From thread” and “Labels” so you know where each message lives. Optional **Edit title** and **Open in Gmail** (placeholder).

## API

- `GET /api/threads` – list threads
- `GET /api/messages?threadId=…&labelId=…&conversationId=…` – list messages
- `GET /api/conversations` – list conversations (semantic clusters)
- `GET /api/conversations/:id` – one conversation with messages
- `POST /api/sync` – re-fetch and re-run clustering
- `PATCH /api/conversations/:id` – set conversation title (body: `{ "title": "…" }`)

## Stack

- Next.js 14 (App Router), React, Tailwind
- Mock email provider with seed data (recruiter + HackerRank scenario); provider abstraction allows swapping in Gmail later.
- Keyword-based semantic clustering (token overlap + union-find); no API key required.
