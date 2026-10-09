# Voice worker (LiveKit Agents + OpenAI Realtime)

A standalone LiveKit Agents worker that runs the ~2-minute discovery conversation
(spec §11–14), then emits a structured **Learning Brief** and triggers simulation
generation on the backend.

## How it fits

```
Browser ──join room (name = sessionId)──► LiveKit Cloud ◄──── this worker
                                                              │
                        submit_learning_brief tool  ──────────┤
                                                              ▼
                              POST /api/sessions/:id/learning-brief
                              POST /api/sessions/:id/generate   (backend)
```

- The room name **is** the session id (set by the backend token endpoint), so the
  worker knows which session to attach the brief to via `ctx.room.name`.
- The worker never writes files or generates code — it only produces the brief and
  calls the backend, keeping responsibilities separated (spec §11).

## Requirements

Set these in the repo-root `.env` (see `.env.example`):

```
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
OPENAI_API_KEY=
BACKEND_URL=http://127.0.0.1:3001
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
```

## Run

```bash
cd voice
npm run dev     # development worker, connects to LiveKit and waits for jobs
```

Then start a session in the web app; when the browser joins the room, LiveKit
dispatches a job to this worker and the conversation begins.

> Needs real LiveKit + OpenAI credentials to run. Without them the web app falls
> back to the typed Learning Brief form, which drives the identical generation
> pipeline.
