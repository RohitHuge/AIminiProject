# AI Interactive Learning Demonstrator

## 1. Project Overview

Build a web-based AI learning demonstrator where a student can:

1. Start a voice conversation with an AI voice agent.
2. Talk about a study topic/doubt for approximately 2 minutes.
3. The voice agent understands what the student is struggling with.
4. At the end of the conversation, the system creates a structured **Learning Brief**.
5. The Learning Brief is passed to an AI coding/generation agent using the **OpenAI Agents SDK**.
6. The generation agent creates an interactive educational simulation using:
   - HTML
   - CSS
   - Vanilla JavaScript
   - SVG and/or Canvas where appropriate
7. The generated simulation is stored as files inside the current session.
8. The simulation is served by the backend.
9. The React frontend renders the generated simulation inside a sandboxed `<iframe>`.
10. The student can interact with the generated simulation.
11. The student can continue asking questions to the voice agent.
12. Previous sessions can be viewed from a simple history page.

This is a **demonstrator / mini-project**.

Do NOT over-engineer the application.

---

# 2. Core Product Idea

The system should demonstrate this pipeline:

```text
Student
   |
   | Voice conversation
   v
LiveKit Voice Agent
   |
   | ~2 minute conversation
   v
Learning Intent
   |
   v
Learning Brief
   |
   v
OpenAI Agents SDK
   |
   | Generate files
   v
Interactive HTML/CSS/JS Simulation
   |
   v
Validation
   |
   v
Sandboxed iframe
   |
   v
Student interacts with simulation
```

The key differentiator is:

> The AI should not merely answer the student's question. It should generate an interactive demonstration specifically targeted at the student's misunderstanding.

---

# 3. MVP Scope

## Must Have

### Voice

- LiveKit-based voice agent.
- Student can start a voice session.
- Student can speak naturally.
- Agent responds using voice.
- Conversation should be limited to approximately 2 minutes.
- Agent should understand:
  - Subject
  - Topic
  - Student's level
  - Existing understanding
  - Specific confusion
  - Desired learning outcome

### AI Generation

- Generate a structured Learning Brief.
- Pass Learning Brief to OpenAI Agents SDK.
- Generation agent creates:
  - `index.html`
  - `style.css`
  - `app.js`
- Generated simulation must be interactive.
- Generated simulation must be self-contained.
- Generated simulation should not require external APIs.

### Rendering

- Generated simulation must render inside React.
- Use a sandboxed `<iframe>`.
- Do NOT inject generated HTML directly into React using `dangerouslySetInnerHTML`.

### Sessions

- No authentication.
- Generate a unique session ID.
- Store session data on the filesystem.
- Show previous sessions in a History page.
- No database required for MVP.

### UI

- React frontend.
- Show voice agent state.
- Show generation progress.
- Show simulation.
- Show session history.
- Show errors using toast/error UI.
- Include loading states.
- Include polished microinteractions around final generation.

---

# 4. Explicitly Out of Scope

Do NOT implement:

- Authentication
- User accounts
- PostgreSQL
- Redis
- S3
- MinIO
- Cloudflare R2
- Multi-user permissions
- Production-grade versioning
- Git integration
- Docker sandbox per user
- npm package installation for generated projects
- Arbitrary shell execution by the AI
- General-purpose website builder
- Full Replit clone
- Production deployment pipeline
- Payments
- Analytics
- Complex admin dashboard

The goal is to create a convincing working demonstrator.

---

# 5. Recommended Technology Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion where useful

## Backend

- Node.js
- TypeScript
- Express or Fastify

Use whichever backend framework is already established in the repository.

## Voice

- LiveKit
- LiveKit Agents
- Appropriate STT/TTS provider supported by the existing LiveKit setup

## AI Generation

- OpenAI Agents SDK
- Use the currently supported OpenAI SDK/API available in the repository.
- Do not hard-code deprecated APIs.

## Generated Simulation

Only:

- HTML
- CSS
- Vanilla JavaScript
- SVG
- Canvas
- Browser APIs that do not require external dependencies

## Storage

Filesystem.

---

# 6. High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │       React Frontend    │
                         │                         │
                         │  Voice UI               │
                         │  Conversation State     │
                         │  Generation Progress    │
                         │  Simulation Viewer      │
                         │  History                │
                         └────────────┬────────────┘
                                      |
                                HTTP / WS
                                      |
                         ┌────────────▼────────────┐
                         │      Node Backend       │
                         │                         │
                         │ Session Manager         │
                         │ Artifact Manager        │
                         │ Simulation Server       │
                         └───────┬────────┬────────┘
                                 |        |
                    ┌────────────┘        └───────────────┐
                    |                                     |
          ┌─────────▼────────┐                  ┌─────────▼──────────┐
          │ LiveKit Agent    │                  │ OpenAI Agent       │
          │                  │                  │                    │
          │ Voice            │                  │ Learning Brief     │
          │ STT              │                  │ Planning           │
          │ TTS              │                  │ Code Generation    │
          │ Conversation     │                  │ Validation          │
          └──────────────────┘                  └─────────┬──────────┘
                                                         |
                                                         v
                                                ┌─────────────────┐
                                                │ Session Files   │
                                                │                 │
                                                │ session.json    │
                                                │ index.html      │
                                                │ style.css       │
                                                │ app.js          │
                                                └────────┬────────┘
                                                         |
                                                         v
                                                Sandboxed iframe
```

---

# 7. Repository Structure

Use a simple monorepo-style structure.

```text
project-root/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── types/
│   │   │   └── App.tsx
│   │   └── package.json
│   │
│   └── server/
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── agents/
│       │   ├── sessions/
│       │   ├── artifacts/
│       │   ├── validation/
│       │   ├── types/
│       │   └── server.ts
│       └── package.json
│
├── sessions/
│
├── .env
├── .env.example
├── package.json
└── README.md
```

If the existing repository already has a structure, preserve it instead of unnecessarily restructuring the project.

---

# 8. Session Filesystem

Every interaction should create a session.

Example:

```text
sessions/
└── session_8f2c91/
    │
    ├── session.json
    │
    ├── learning-brief.json
    │
    └── simulation/
        ├── index.html
        ├── style.css
        └── app.js
```

Optional:

```text
sessions/
└── session_8f2c91/
    ├── session.json
    ├── learning-brief.json
    ├── conversation.json
    └── simulation/
        ├── index.html
        ├── style.css
        └── app.js
```

Conversation storage is optional.

Do not store sensitive information.

---

# 9. Session Metadata

`session.json`

Example:

```json
{
  "id": "session_8f2c91",
  "createdAt": "2026-10-08T14:30:00.000Z",
  "status": "ready",
  "topic": "Newton's Second Law",
  "subject": "Physics",
  "simulation": {
    "status": "ready",
    "entryPoint": "simulation/index.html"
  }
}
```

Possible statuses:

```text
created
conversation
understanding
generating
validating
ready
error
```

---

# 10. Learning Brief

The voice conversation should ultimately produce a structured Learning Brief.

Example:

```json
{
  "subject": "Physics",
  "topic": "Newton's Second Law",
  "studentLevel": "beginner",
  "studentAlreadyUnderstands": [
    "force",
    "mass"
  ],
  "confusion": "The student does not understand how changing mass or force affects acceleration.",
  "learningGoal": "Understand the relationship between force, mass and acceleration.",
  "preferredDemonstration": "Interactive visual physics simulation",
  "requiredInteractions": [
    "change force",
    "change mass",
    "observe acceleration",
    "observe object movement"
  ]
}
```

The Learning Brief should be concise.

Do not pass unnecessary raw conversation history to the code generation agent.

---

# 11. Voice Agent Responsibilities

The LiveKit voice agent is NOT responsible for writing code.

Its job is:

1. Talk with the student.
2. Understand the student's problem.
3. Ask useful follow-up questions.
4. Determine what the student already knows.
5. Determine what they don't understand.
6. Determine what kind of demonstration would help.
7. End the discovery conversation around 2 minutes.
8. Produce a Learning Brief.

The voice agent should NOT spend several minutes teaching the topic.

The objective is:

> Understand the student's learning need.

---

# 12. Voice Conversation Flow

Initial interaction:

```text
AI:
"Hi! Tell me what you're struggling to understand."

Student:
"I understand velocity but acceleration confuses me."

AI:
"What part of acceleration is confusing — the formula,
the concept, or how it changes motion?"

Student:
"I don't understand how acceleration changes velocity."

AI:
"Got it. Do you learn better by seeing something move
or by working through equations?"

Student:
"Seeing something move."

AI:
"Perfect. I'll create an interactive demonstration for you."
```

At this point the conversation can end.

---

# 13. Conversation Timeout

Target:

```text
~2 minutes
```

This is not a hard kill unless necessary.

The voice agent should intelligently wrap up once enough information is available.

If sufficient information is gathered before 2 minutes, it can finish early.

If the student keeps talking, politely guide the conversation toward completion.

---

# 14. Voice Agent Output

The backend should receive structured data.

Example:

```json
{
  "type": "learning_brief",
  "data": {
    "subject": "Physics",
    "topic": "Acceleration",
    "studentLevel": "beginner",
    "confusion": "Relationship between acceleration and velocity",
    "learningGoal": "Understand acceleration as rate of change of velocity",
    "demonstration": "Interactive moving car simulation"
  }
}
```

Do not rely on parsing arbitrary natural-language output if structured output is available.

---

# 15. Generation Agent

The generation agent receives the Learning Brief.

Its role:

> Create a small, visually understandable and highly interactive educational simulation.

The generation agent should operate through filesystem tools.

---

# 16. Generation Agent Tools

Implement tools:

```text
list_files
read_file
write_file
update_file
delete_file
```

All paths must be restricted to:

```text
sessions/<sessionId>/simulation/
```

The agent must never be allowed to access arbitrary filesystem paths.

---

# 17. Filesystem Tool Contract

## list_files

Input:

```json
{
  "sessionId": "session_8f2c91"
}
```

Output:

```json
{
  "files": [
    "index.html",
    "style.css",
    "app.js"
  ]
}
```

---

## read_file

Input:

```json
{
  "sessionId": "session_8f2c91",
  "path": "app.js"
}
```

---

## write_file

Input:

```json
{
  "sessionId": "session_8f2c91",
  "path": "app.js",
  "content": "..."
}
```

---

## update_file

Input:

```json
{
  "sessionId": "session_8f2c91",
  "path": "app.js",
  "content": "..."
}
```

For MVP, `update_file` can simply overwrite the file.

Do not implement complex diff/patch logic unless needed.

---

# 18. Path Security

Never accept paths such as:

```text
../../server.ts
../../../etc/passwd
```

Resolve paths against the session simulation root.

Reject:

- `..`
- absolute paths
- paths outside session directory
- symbolic-link escapes

All generated files must remain inside:

```text
sessions/<sessionId>/simulation/
```

---

# 19. Generation Agent System Prompt

Use a strong system instruction similar to:

```text
You are an Educational Simulation Engineer.

Your job is to create a small interactive web simulation
that helps a student understand a specific concept.

You are given a Learning Brief.

Do not simply create a webpage explaining the topic.

Create an INTERACTIVE DEMONSTRATION.

The student should be able to manipulate variables,
click controls, move sliders, observe animations,
or otherwise interact with the concept.

Technical requirements:

1. Create:
   - index.html
   - style.css
   - app.js

2. Use only:
   - HTML
   - CSS
   - Vanilla JavaScript
   - SVG
   - Canvas
   - standard browser APIs

3. Do not use:
   - React
   - npm packages
   - external JavaScript libraries
   - external CSS libraries
   - external APIs
   - network requests

4. The simulation must work as a static website.

5. The simulation must work inside a sandboxed iframe.

6. Prefer visual demonstrations over large amounts of text.

7. Include interactive controls whenever appropriate.

8. Make important values update immediately when the
   student interacts.

9. Use animations where they improve understanding.

10. Keep the interface visually clean and student-friendly.

11. Make the simulation responsive.

12. Do not put secrets or API keys in generated files.

13. Do not use inline event handlers when avoidable.

14. Keep JavaScript modular and understandable.

15. Make sure index.html references style.css and app.js correctly.

After creating the files, inspect them and fix any obvious
errors before finishing.

The simulation is complete only when the files form a
self-contained working demonstration.
```

---

# 20. Simulation Design Principles

Every generated simulation should attempt to have:

### Input

Something the student can change.

Examples:

```text
Slider
Button
Toggle
Drag interaction
Dropdown
Input field
```

### Visualization

Something changes visibly.

Examples:

```text
Object movement
Graph
Diagram
Particle movement
Color change
Equation
Animation
Chart
```

### Feedback

The student immediately sees the result.

Example:

```text
Force = 50 N

Mass = 10 kg

Acceleration = 5 m/s²
```

Changing mass should immediately update the acceleration.

---

# 21. Example Simulation Types

The generation agent should choose an appropriate visualization.

## Physics

Examples:

- Newton's laws
- projectile motion
- velocity vs acceleration
- pendulum
- friction
- momentum
- electric circuits

Potential implementation:

```text
Canvas + sliders + animation
```

---

## Mathematics

Examples:

- quadratic functions
- trigonometry
- vectors
- derivatives
- probability
- geometry

Potential implementation:

```text
SVG + graph + sliders
```

---

## Chemistry

Examples:

- atom structure
- molecular bonding
- chemical reactions
- pH

Potential implementation:

```text
SVG + animated particles
```

---

## Computer Science

Examples:

- sorting algorithms
- binary search
- recursion
- linked lists
- CPU scheduling

Potential implementation:

```text
DOM + animated elements
```

---

# 22. Rendering Architecture

Do NOT render generated HTML using:

```jsx
dangerouslySetInnerHTML
```

Do NOT execute generated JavaScript directly inside the React application.

Use:

```text
React
  |
  v
iframe
  |
  v
Generated simulation
```

Example:

```jsx
<iframe
  title="Interactive Learning Simulation"
  src={simulationUrl}
  sandbox="allow-scripts"
  className="w-full h-full"
/>
```

---

# 23. Static Simulation Server

The backend should expose generated sessions.

Example:

```text
GET /simulations/:sessionId/
```

which maps to:

```text
sessions/:sessionId/simulation/index.html
```

And:

```text
GET /simulations/:sessionId/app.js
GET /simulations/:sessionId/style.css
```

The server should safely serve only files inside the session's simulation directory.

---

# 24. Simulation URL

After generation:

```text
/simulations/session_8f2c91/
```

should resolve to:

```text
sessions/
└── session_8f2c91/
    └── simulation/
        └── index.html
```

React uses:

```text
/simulations/session_8f2c91/
```

as the iframe source.

Do not expose the actual server filesystem path to the frontend.

---

# 25. iframe Security

Minimum:

```html
sandbox="allow-scripts"
```

Do NOT automatically use:

```text
allow-same-origin
allow-forms
allow-top-navigation
allow-popups
```

unless a demonstrated requirement exists.

The generated simulation should be treated as untrusted code.

The simulation should not be able to access the main React application.

---

# 26. React Application Structure

Recommended pages:

```text
/
    Home / New Session

/session/:id
    Active Session

/history
    Previous Sessions
```

---

# 27. Main Page

The landing page should be extremely simple.

```text
┌─────────────────────────────────────────────┐
│                                             │
│       AI Interactive Learning Lab           │
│                                             │
│   Talk about something you don't            │
│   understand. We'll build a demonstration.  │
│                                             │
│             [ Start Learning ]              │
│                                             │
│             [ View History ]                │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 28. Active Session UI

Recommended layout:

```text
┌──────────────────────────────────────────────────────┐
│ AI Learning Lab                                      │
├─────────────────────┬────────────────────────────────┤
│                     │                                │
│   VOICE AGENT       │       SIMULATION               │
│                     │                                │
│     🎙              │                                │
│                     │      iframe                    │
│  Listening...       │                                │
│                     │                                │
│  Conversation       │                                │
│                     │                                │
│  ----------------   │                                │
│  Student: ...       │                                │
│  AI: ...            │                                │
│                     │                                │
│ [ End Conversation ]│                                │
│                     │                                │
└─────────────────────┴────────────────────────────────┘
```

On mobile, stack these vertically.

---

# 29. Generation State UI

When the conversation finishes:

```text
Understanding your learning need...
```

Then:

```text
Designing your demonstration...
```

Then:

```text
Building interactive simulation...
```

Then:

```text
Testing the simulation...
```

Finally:

```text
✓ Your interactive demonstration is ready
```

Use animation/microinteraction for the final transition.

Example:

```text
Generating...
    ↓
Success check animation
    ↓
Simulation smoothly appears
```

Do not abruptly replace the loading screen.

---

# 30. Required Loading States

Implement explicit UI states:

```text
idle
connecting
listening
thinking
ending
understanding
generating
validating
ready
error
```

The frontend should never leave the user wondering whether something is still happening.

---

# 31. Error Handling

Every long-running operation needs an error state.

Examples:

```text
LiveKit connection failed
```

```text
Voice agent unavailable
```

```text
Learning brief generation failed
```

```text
Simulation generation failed
```

```text
Simulation validation failed
```

```text
Simulation could not be loaded
```

Show a toast for transient errors.

Show a proper error state for blocking errors.

Example:

```text
┌────────────────────────────────────┐
│ Something went wrong               │
│                                    │
│ We couldn't generate the demo.     │
│                                    │
│ [ Try Again ]                      │
└────────────────────────────────────┘
```

Do not expose stack traces to the student.

Log technical details on the backend.

---

# 32. Toast System

Use a lightweight toast implementation or the existing project's toast library.

Toast examples:

```text
"Connected to AI"
"Conversation ended"
"Simulation generation started"
"Simulation ready"
"Simulation generation failed"
```

Keep messages short.

---

# 33. History Page

Since there is no authentication, history is global/local to the application.

Backend:

```text
GET /api/sessions
```

Return:

```json
[
  {
    "id": "session_123",
    "createdAt": "2026-10-08T14:30:00Z",
    "subject": "Physics",
    "topic": "Acceleration",
    "status": "ready"
  },
  {
    "id": "session_456",
    "createdAt": "2026-10-08T15:20:00Z",
    "subject": "Mathematics",
    "topic": "Derivatives",
    "status": "ready"
  }
]
```

Display cards:

```text
Physics
Newton's Second Law

Oct 8, 2026

[Open]
```

---

# 34. Session History Storage

The backend can simply scan:

```text
sessions/
```

and read:

```text
session.json
```

No database.

Sort by:

```text
createdAt DESC
```

---

# 35. Session API

Implement:

```text
POST /api/sessions
```

Creates a session.

Response:

```json
{
  "sessionId": "session_8f2c91"
}
```

---

```text
GET /api/sessions
```

Returns history.

---

```text
GET /api/sessions/:id
```

Returns session metadata.

---

```text
POST /api/sessions/:id/learning-brief
```

Stores/updates the Learning Brief.

---

```text
POST /api/sessions/:id/generate
```

Starts generation.

---

```text
GET /api/sessions/:id/status
```

Returns generation status.

Example:

```json
{
  "status": "generating",
  "message": "Building interactive simulation..."
}
```

---

```text
GET /api/sessions/:id/simulation
```

Returns simulation metadata.

Example:

```json
{
  "ready": true,
  "url": "/simulations/session_8f2c91/"
}
```

---

# 36. Generation Should Be Asynchronous

Do NOT keep the HTTP request open while the AI generates the simulation if it can be avoided.

Instead:

```text
POST /generate
       |
       v
return immediately
       |
       v
background generation
       |
       v
status updates
```

Frontend polls:

```text
GET /api/sessions/:id/status
```

For MVP, polling every 1-2 seconds is perfectly acceptable.

Do not introduce WebSockets solely for generation status.

LiveKit already handles the voice side.

---

# 37. Generation Status

Use:

```json
{
  "status": "generating",
  "step": "writing_simulation",
  "message": "Building interactive simulation..."
}
```

Possible steps:

```text
understanding
planning
creating_files
validating
fixing
ready
error
```

---

# 38. Validation

After the agent generates files, validate:

### File existence

```text
index.html
style.css
app.js
```

### HTML

Ensure:

- HTML exists
- references CSS
- references JS

### JavaScript

Attempt basic syntax validation.

### Security

Reject or flag:

```text
<script src="http://...">
fetch("http://...")
fetch("https://...")
XMLHttpRequest
WebSocket
eval
new Function
```

For MVP, validation can be basic.

Do not pretend this is a complete security sandbox.

---

# 39. Optional Browser Validation

If practical, use Playwright in the backend.

Flow:

```text
Generate
   ↓
Launch headless browser
   ↓
Open simulation
   ↓
Check page errors
   ↓
Check console errors
   ↓
Success?
```

This is highly recommended if available because generated JavaScript can be syntactically valid but still fail at runtime.

However, do not make Playwright a hard requirement if it significantly complicates setup.

---

# 40. Agent Self-Correction

If validation finds an error:

```text
Generate
   ↓
Validate
   ↓
ERROR
   ↓
Provide error to generation agent
   ↓
Agent reads files
   ↓
Agent fixes files
   ↓
Validate again
```

Maximum:

```text
3 attempts
```

After 3 failed attempts:

```text
status = error
```

and show:

```text
"We couldn't build the demonstration. Please try again."
```

---

# 41. Simulation Interaction Quality

The generation agent should prefer simulations with:

- sliders
- buttons
- drag interactions
- animated objects
- graphs
- live values
- visual indicators
- highlighted changes
- equation updates

Avoid simulations that are mostly:

```text
paragraph
paragraph
paragraph
```

The project is specifically intended to demonstrate **AI-generated interactive learning**.

---

# 42. Example: Newton's Second Law

Learning Brief:

```json
{
  "subject": "Physics",
  "topic": "Newton's Second Law",
  "studentLevel": "beginner",
  "confusion": "Student does not understand how mass and force affect acceleration.",
  "learningGoal": "Understand F = ma through experimentation."
}
```

Expected simulation:

```text
Force
[────────●────]

Mass
[────●────────]

       ┌─────────┐
       │   BOX   │ ─────────→
       └─────────┘

Force:        40 N
Mass:         10 kg
Acceleration: 4 m/s²
```

Changing force:

```text
Force ↑
Acceleration ↑
```

Changing mass:

```text
Mass ↑
Acceleration ↓
```

The student should see the object move differently.

---

# 43. Example: Derivatives

Learning Brief:

```json
{
  "subject": "Mathematics",
  "topic": "Derivatives",
  "studentLevel": "beginner",
  "confusion": "Student understands slope but does not understand derivative as instantaneous rate of change."
}
```

Expected simulation:

```text
                 ●
              ●
           ●
        ●
     ●
  ●

        tangent line
              /
             /
            ●

x = 2.5
slope = 4.2
```

Student moves a point along the curve.

The tangent line updates.

The derivative value updates.

This is the type of interaction the generator should create.

---

# 44. Voice + Simulation Follow-Up

After simulation is ready, the student should be able to continue speaking.

Example:

Student:

> "Why did acceleration decrease when I increased mass?"

The voice agent should know:

```text
Current topic:
Newton's Second Law

Current simulation:
F = ma

Current state:
force = 40
mass = 20
acceleration = 2
```

For MVP, simulation state can optionally be sent to the parent React application using:

```javascript
window.parent.postMessage(...)
```

Example:

```javascript
window.parent.postMessage({
  type: "SIMULATION_STATE",
  state: {
    force: 40,
    mass: 20,
    acceleration: 2
  }
}, "*");
```

React can receive it.

Do NOT make this mandatory for the first implementation if it delays the core demo.

---

# 45. Optional Simulation → Parent Communication

Support a small protocol.

## Simulation to React

```json
{
  "type": "SIMULATION_STATE",
  "payload": {
    "force": 40,
    "mass": 20,
    "acceleration": 2
  }
}
```

---

## React to Simulation

```json
{
  "type": "SIMULATION_COMMAND",
  "command": "RESET"
}
```

Possible commands:

```text
RESET
PAUSE
RESUME
```

Again, this is optional for the first milestone.

---

# 46. UI Design

Use a modern AI/product style.

Recommended:

- dark or light neutral background
- rounded cards
- subtle borders
- clean typography
- clear hierarchy
- animated voice indicator
- simulation area should have maximum available space

Do not make it look like a generic chatbot.

The simulation should be the primary visual element after generation.

---

# 47. Voice UI

The voice area should show:

```text
● Listening
```

or:

```text
◉ Thinking
```

or:

```text
● Speaking
```

Use subtle animation.

Example:

```text
       ◉
     ◉ ◉ ◉
       ◉

    Listening...
```

Do not over-animate.

---

# 48. Required Microinteractions

Include microinteractions for:

### Voice connected

Small success animation.

### Generation started

Smooth transition from conversation state to generation state.

### Generation completed

Use:

```text
checkmark
+
small scale/fade animation
```

then reveal the simulation.

### Simulation loaded

Fade/scale the iframe into view.

### Errors

Toast + shake/subtle attention animation.

---

# 49. Accessibility

Basic accessibility is required.

Ensure:

- keyboard navigation works
- buttons have accessible labels
- iframe has a meaningful title
- focus states are visible
- loading states are announced where practical
- do not rely exclusively on color

---

# 50. Environment Variables

Create:

```text
.env.example
```

Possible variables:

```text
OPENAI_API_KEY=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Add only variables actually required by the implementation.

Never expose:

```text
OPENAI_API_KEY
LIVEKIT_API_SECRET
```

to the React frontend.

---

# 51. API Key Architecture

The browser must never receive the OpenAI API key.

The browser must never receive the LiveKit API secret.

The backend/agent server owns secrets.

If LiveKit requires a room token for the frontend, generate a short-lived token on the backend.

---

# 52. Recommended Implementation Order

Implement in this exact order.

## Phase 1 — Basic React UI

Build:

```text
Home
Session
History
```

with mocked states.

Do not start with AI generation.

---

## Phase 2 — Session Filesystem

Implement:

```text
POST /api/sessions
GET /api/sessions
GET /api/sessions/:id
```

Create:

```text
sessions/<id>/session.json
```

---

## Phase 3 — LiveKit

Integrate:

```text
React
  ↓
LiveKit room
  ↓
Voice Agent
```

Verify:

- microphone
- connection
- STT
- AI response
- TTS

Before continuing.

---

## Phase 4 — Learning Brief

Make the voice agent produce:

```json
LearningBrief
```

Save:

```text
learning-brief.json
```

Test this independently.

---

## Phase 5 — OpenAI Generation Agent

Implement filesystem tools:

```text
list_files
read_file
write_file
update_file
```

Then generate a simple test simulation.

---

## Phase 6 — Static Simulation Server

Make:

```text
/simulations/:sessionId/
```

serve:

```text
index.html
style.css
app.js
```

Verify manually in browser.

---

## Phase 7 — iframe Integration

React should load:

```text
/simulations/:sessionId/
```

inside:

```html
<iframe sandbox="allow-scripts">
```

---

## Phase 8 — Validation

Add:

```text
file validation
JS syntax validation
optional Playwright validation
```

---

## Phase 9 — Generation Progress

Connect backend status to:

```text
Understanding...
Planning...
Building...
Validating...
Ready
```

---

## Phase 10 — History

Show previous sessions.

Clicking a session should reopen its generated simulation.

---

# 53. First Demo Scenario

The first end-to-end test should be:

```text
Physics → Newton's Second Law
```

Conversation:

```text
Student:
"I don't understand how force and mass affect acceleration."

Agent:
"What do you already know about force and mass?"

Student:
"I know force is a push or pull and mass is how heavy
something is, but I don't understand why acceleration changes."

Agent:
"Would an interactive example where you change force and
mass help?"

Student:
"Yes."

Agent:
"Great. I'll build one."
```

Learning Brief:

```json
{
  "subject": "Physics",
  "topic": "Newton's Second Law",
  "studentLevel": "beginner",
  "confusion": "Relationship between force, mass and acceleration",
  "learningGoal": "Understand F = ma through interactive experimentation",
  "demonstration": "Interactive box acceleration simulation"
}
```

Generation agent creates simulation.

Student manipulates:

```text
Force
Mass
```

and observes:

```text
Acceleration
Velocity
Object movement
```

---

# 54. Important Engineering Principle

Do NOT build the entire system before testing the critical path.

The critical path is:

```text
Voice
  ↓
Learning Brief
  ↓
Generation
  ↓
HTML
  ↓
iframe
```

Get this working as early as possible.

A beautiful dashboard without this pipeline is not useful for this project.

---

# 55. MVP Definition of Done

The project is considered successful when the following works end-to-end:

### Step 1

User opens:

```text
/
```

### Step 2

Clicks:

```text
Start Learning
```

### Step 3

LiveKit voice agent starts.

### Step 4

Student talks about a concept for approximately 2 minutes.

### Step 5

Agent produces a Learning Brief.

### Step 6

UI shows:

```text
Understanding your learning need...
```

### Step 7

Generation agent creates:

```text
index.html
style.css
app.js
```

### Step 8

Backend validates files.

### Step 9

UI shows:

```text
✓ Your demonstration is ready
```

### Step 10

Generated simulation appears inside iframe.

### Step 11

Student can interact with it.

### Step 12

Student can continue talking with the voice agent.

### Step 13

Session appears in:

```text
/history
```

### Step 14

Clicking the history entry opens the same simulation.

---

# 56. What NOT to Optimize Yet

Do not spend time on:

```text
database optimization
horizontal scaling
Redis
queues
Kubernetes
microservices
authentication
billing
multi-tenancy
Git versioning
complex sandbox infrastructure
cloud storage
CDN
```

The project is a demonstrator.

Focus engineering effort on:

```text
Voice quality
Learning Brief quality
Generated simulation quality
Interactive behavior
Rendering reliability
UX
```

---

# 57. Future Architecture

If this project eventually becomes a real product, it can evolve into:

```text
                   React
                     |
              Session Gateway
                     |
          ┌──────────┴──────────┐
          |                     |
     LiveKit Agent       Generation Agent
          |                     |
          |                Artifact Service
          |                     |
          |                Sandbox Runtime
          |                     |
          └──────────┬──────────┘
                     |
                 PostgreSQL
                     |
               Object Storage
```

But do NOT implement this architecture now.

---

# 58. Final Product Principle

The application should feel like:

> **"Talk to an AI tutor, and instead of merely explaining the concept, it builds an interactive experiment for you."**

The demo should visually prove that concept.

The most important user journey is:

```text
🎙 Talk
   ↓
🧠 Understand
   ↓
⚙ Build
   ↓
✓ Ready
   ↓
🧪 Experiment
   ↓
💬 Ask follow-up
```

Everything in the implementation should support this experience.