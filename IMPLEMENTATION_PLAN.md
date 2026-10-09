# Implementation Plan — AI Interactive Learning Demonstrator

> Minimum-time path to a convincing working demo.
> Stack decision: **OpenAI-only** (Realtime API for voice + Agents SDK for generation). No Deepgram/ElevenLabs.
> Guiding rule (spec §54): get the critical path working before building anything pretty.

---

## 0. The critical path (what actually matters)

```
🎙 Voice (~2 min)  →  🧠 Learning Brief (JSON)  →  ⚙ Generation agent (files)
   →  ✅ Validation  →  📄 Static server  →  🖼 Sandboxed iframe  →  🧪 Interact
```

The Learning Brief is **just JSON**. That decouples voice (fragile, external) from the
rest. So we build **voice-last** and always keep a "type the brief" fallback. A LiveKit
outage must never be able to kill the demo.

### Why OpenAI-only is the fast choice
- **OpenAI Realtime API** = STT + LLM + TTS in one model. One websocket, one key.
- Realtime supports **tool/function calling** → the agent emits the Learning Brief as a
  structured `submit_learning_brief({...})` call. No natural-language parsing (spec §14, §498).
- **OpenAI Agents SDK** handles the generation agent + file tools.
- Only secret needed server-side: `OPENAI_API_KEY` (+ LiveKit keys for the room token).

---

## 1. Tech stack (locked)

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + TypeScript + Tailwind + Framer Motion |
| Backend | Node + TypeScript + **Fastify** (lighter, good static-file + TS story) |
| Voice | LiveKit room + LiveKit Agents (Python or Node worker) running **OpenAI Realtime** |
| Generation | **OpenAI Agents SDK** (Node/TS) with custom file tools |
| Storage | Filesystem only, `sessions/<id>/` |
| Validation | File checks + regex security scan (skip Playwright for v1, spec §39) |

> **Voice worker language note:** LiveKit Agents is most mature in **Python**. If you want
> a single-language repo, the Node Agents SDK works too but is less battle-tested. Decide at
> Phase 5. The rest of the backend stays Node/TS regardless — the worker is a separate process.

---

## 2. Repo layout

```
AIminiProject/
├── apps/
│   ├── web/                 # React + Vite frontend
│   │   └── src/
│   │       ├── pages/       # Home, Session, History
│   │       ├── components/  # VoicePanel, SimulationViewer, GenerationProgress, Toast
│   │       ├── hooks/       # useSession, useGenerationStatus (polling), useLiveKit
│   │       ├── lib/         # api client
│   │       └── types/
│   └── server/              # Fastify backend
│       └── src/
│           ├── routes/      # sessions.ts, generate.ts, simulations.ts
│           ├── sessions/    # session manager (fs CRUD + session.json)
│           ├── agents/      # generation agent + system prompt
│           ├── artifacts/   # path-safe file tools (THE security boundary)
│           ├── validation/  # file + regex checks + self-correct loop
│           └── server.ts
├── voice/                   # LiveKit Agents worker (Python or Node)
├── sessions/                # runtime data (gitignored)
├── .env.example
└── package.json             # npm workspaces
```

---

## 3. Data contracts (freeze these first — everything depends on them)

**`session.json`** (spec §9)
```json
{ "id": "session_8f2c91", "createdAt": "ISO", "status": "created",
  "subject": null, "topic": null,
  "simulation": { "status": "pending", "entryPoint": "simulation/index.html" } }
```
Statuses: `created | conversation | understanding | generating | validating | ready | error`

**`learning-brief.json`** (spec §10) — the hand-off contract:
```json
{ "subject": "Physics", "topic": "Newton's Second Law", "studentLevel": "beginner",
  "studentAlreadyUnderstands": ["force","mass"],
  "confusion": "...", "learningGoal": "...",
  "preferredDemonstration": "Interactive visual physics simulation",
  "requiredInteractions": ["change force","change mass","observe acceleration"] }
```

**Generation status** (polled, spec §37):
```json
{ "status": "generating", "step": "creating_files", "message": "Building interactive simulation..." }
```
Steps: `understanding | planning | creating_files | validating | fixing | ready | error`

---

## 4. REST API (spec §35)

```
POST /api/sessions                      -> { sessionId }
GET  /api/sessions                      -> history (scan sessions/, sort createdAt DESC)
GET  /api/sessions/:id                  -> session.json
POST /api/sessions/:id/learning-brief   -> store brief
POST /api/sessions/:id/generate         -> 202, kicks off async generation
GET  /api/sessions/:id/status           -> generation status (frontend polls 1–2s)
GET  /api/sessions/:id/simulation       -> { ready, url }
POST /api/livekit/token                 -> short-lived room token (Phase 5)
GET  /simulations/:id/*                 -> static files from sessions/:id/simulation/
```

---

## 5. Phased build order

Each phase ends in something **demoable/testable**. Do not advance until green.

### Phase 1 — Scaffold + data contracts  ·  ~0.5 day
- npm workspaces, Vite app, Fastify server, Tailwind, `.env.example`, `.gitignore` (sessions/).
- Implement `sessions/` CRUD: `POST/GET /api/sessions`, `GET /api/sessions/:id`.
- **Test:** curl creates a session, folder + `session.json` appear.

### Phase 2 — Artifact file tools (the security boundary)  ·  ~0.5 day
- `artifacts/` module: `listFiles / readFile / writeFile / updateFile / deleteFile`,
  all taking `(sessionId, path)`.
- **Path guard** (spec §18): resolve against `sessions/<id>/simulation/`, reject `..`,
  absolute paths, symlink escape, anything resolving outside root. Unit-test the guard
  with `../../server.ts`, `/etc/passwd`, `..\\..\\`.
- **Test:** malicious paths throw; valid writes land in the right folder.

### Phase 3 — Generation agent (THE core value)  ·  ~1 day
- OpenAI Agents SDK agent, system prompt from spec §19, wired to the Phase-2 file tools.
- `POST /generate` → return 202, run generation in background, update `session.json` status.
- Static server `GET /simulations/:id/*` with the same path-safety (correct MIME types).
- **Test with a HARDCODED Newton's Second Law brief** (spec §42). Open
  `http://localhost:PORT/simulations/<id>/` directly in a browser. Is it interactive & correct?
- ✅ **Milestone: 90% of the project's value exists here.** If generation quality is poor,
  iterate on the system prompt NOW before building more.

### Phase 4 — Validation + self-correction loop  ·  ~0.5 day
- Checks (spec §38): index.html/style.css/app.js exist; HTML references CSS+JS;
  basic JS syntax; regex-flag `fetch(`, `XMLHttpRequest`, `WebSocket`, `eval`, `new Function`,
  external `<script src=http>`.
- Loop (spec §40): validate → on error feed message back to agent → re-run → **max 3 tries**,
  then `status: error`.
- **Test:** force an error, confirm it retries and recovers / fails cleanly.

### Phase 5 — Frontend session flow + iframe  ·  ~1 day
- Home (`/`), Session (`/session/:id`), History (`/history`) — spec §26–28.
- `SimulationViewer`: `<iframe src="/simulations/:id/" sandbox="allow-scripts">` (spec §22, §25).
  **Never** `dangerouslySetInnerHTML`.
- Generation progress UI with staged messages + the success-check → fade-in reveal (spec §29, §48).
- Status polling hook (1–2s). Toasts + blocking error state (spec §31–32).
- **Temporary "Paste/Type Learning Brief" box** → drives Phase 3. This is also the
  permanent fallback for when voice breaks.
- **Test:** full flow in the browser using the typed brief. No voice yet, fully demoable.

### Phase 6 — Voice (LiveKit + OpenAI Realtime)  ·  ~1–1.5 days
- `POST /api/livekit/token` issues short-lived room token (secret stays server-side, spec §51).
- Frontend joins room, shows mic state: Listening / Thinking / Speaking (spec §47).
- LiveKit Agents **worker** running OpenAI Realtime:
  - Discovery system prompt: ~2-min conversation, find subject/topic/level/confusion/goal/
    preferred demo (spec §11–13). Wrap up early when enough info; politely steer if over time.
  - Expose a `submit_learning_brief(brief)` **tool** → worker POSTs it to
    `/api/sessions/:id/learning-brief`, then "End Conversation" triggers `/generate`.
- **Test:** talk for 2 min → brief appears → simulation generates. Full §55 definition-of-done.

### Phase 7 — Polish  ·  ~0.5 day
- History cards reopen the saved simulation (spec §33).
- Accessibility pass (spec §49): iframe title, keyboard nav, focus states, aria labels.
- Microinteractions (Framer Motion), final README with run instructions.

---

## 6. Deliberately skipped for v1 (spec says optional)
- ❌ Playwright headless validation (§39) — regex + file checks suffice; big Windows setup cost.
- ❌ `postMessage` simulation↔React state sync (§44–45) — follow-ups = fresh voice turn.
- ❌ WebSockets for generation status (§36) — polling is fine.
- ❌ Auth, DB, Redis, Docker sandbox, cloud storage (§4, §56).

---

## 7. Risk register
| Risk | Mitigation |
|------|-----------|
| Generation quality weak | Nail it in Phase 3 with hardcoded brief before anything else; iterate the system prompt |
| LiveKit/Realtime flaky | Voice-last; typed-brief fallback always present |
| Agent writes bad/unsafe files | Path guard (Ph2) + regex security scan (Ph4) + sandboxed iframe |
| OpenAI Agents SDK API churn | Pin SDK version; check current docs, don't hardcode deprecated calls (spec §184) |
| Node vs Python voice worker | Decide at Phase 5; worker is an isolated process either way |

---

## 8. Rough timeline
**~5–6 focused days** to full §55 definition-of-done.
**~2.5 days** to the demoable core (Phases 1–5, typed brief, no voice) — that's the slice
worth showing first.

## 9. Env vars (`.env.example`, spec §50)
```
OPENAI_API_KEY=            # server + voice worker only, NEVER sent to browser
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=        # NEVER sent to browser
PORT=3001
```
```

## 10. First command when we start coding
Phase 1 scaffold, then immediately Phase 3 with the hardcoded Newton brief —
prove the simulation generation before investing in UI or voice.
