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

## Using live Gmail

By default the app uses **mock data**. To use your real Gmail inbox:

1. **Google Cloud Console**: Create a project, enable the Gmail API, and create OAuth 2.0 credentials (Desktop app or Web application). Note your Client ID and Client Secret.

2. **Refresh token**: Obtain a refresh token with scope `https://www.googleapis.com/auth/gmail.readonly` (e.g. use [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) with “Use your own OAuth credentials”, authorize, then exchange the authorization code for tokens and copy the refresh token).

3. **Env**: Copy `.env.example` to `.env` and set:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`

Restart the dev server. The app will use Gmail when all three are set; otherwise it uses mock data.

## Stack

- Next.js 14 (App Router), React, Tailwind
- **Providers**: Mock (default) or Gmail API via OAuth2 refresh token.
- Keyword-based semantic clustering (token overlap + union-find); no API key required for mock.
