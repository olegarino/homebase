# Buddy — Architecture Plan

## Vision

A local-first AI orchestration desktop app built with Tauri + Rust.  
A lightweight local model (Ollama) acts as the orchestrator and router, delegating heavy tasks to premium cloud agents (Claude, GPT-4o) via the GitHub Models API. Every decision, tool call, and response is traced locally. External tools like Jira and Atlassian are connected through a tool layer.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────┐
│               Tauri App (UI)                │
│     Chat · Trace Viewer · Tool Outputs      │
└────────────────────┬────────────────────────┘
                     │  Tauri IPC (invoke / Channel)
┌────────────────────▼────────────────────────┐
│            Rust Orchestrator                │
│  • Classifies incoming task                 │
│  • Routes to local or cloud agent           │
│  • Manages tool calls and results           │
│  • Writes structured trace logs             │
│  • Manages session memory                   │
└────┬───────────────────────┬────────────────┘
     │                       │
┌────▼──────┐     ┌──────────▼──────────────────┐
│  Ollama   │     │     GitHub Models API        │
│ llama3.2  │     │  Claude 3.7 → coding tasks   │
│ (router + │     │  GPT-4o    → reasoning tasks │
│  simple)  │     │  Llama 3.3 → fallback        │
└───────────┘     └─────────────────────────────┘
                             │
┌────────────────────────────▼────────────────┐
│                 Tool Layer                  │
│   Jira · Confluence · GitHub · filesystem   │
└─────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────┐
│              Persistence Layer              │
│        SQLite — traces, memory, config      │
└─────────────────────────────────────────────┘
```

---

## Layers in Detail

### 1. UI Layer — Tauri (React + TypeScript)

**Responsibilities:**
- Chat interface (already built in `ChatComponent.tsx`)
- Trace viewer: shows each routing decision, tool call, and agent response
- Tool output panel: displays structured results (e.g. Jira tickets, file diffs)
- Settings: manage API keys, model preferences, tool connections

**Communication with Rust:**
- `invoke()` for request/response commands
- `Channel<T>` for streaming responses (already wired up)

---

### 2. Rust Orchestrator — `lib.rs`

The core of the app. Responsible for the full lifecycle of a task.

**Step-by-step flow:**

```
User sends message
      │
      ▼
[Classifier] — asks llama3.2 locally:
  "What type of task is this?"
  → coding / data / search / tool_call / simple_chat
      │
      ▼
[Router] — picks agent based on task type:
  coding       → Claude 3.7 Sonnet (GitHub Models)
  data/excel   → GPT-4o or qwen2.5:14b (local)
  tool_call    → Tool Layer
  simple_chat  → llama3.2 (local, free)
      │
      ▼
[Agent Execution] — streams response back to UI
      │
      ▼
[Tracer] — writes structured log to SQLite
```

**Key Rust modules to build:**

| Module | File | Role |
|---|---|---|
| `orchestrator` | `orchestrator.rs` | Main routing logic |
| `classifier` | `classifier.rs` | Calls llama3.2 to classify task |
| `agents/local` | `agents/local.rs` | Ollama via `ollama-rs` |
| `agents/cloud` | `agents/cloud.rs` | GitHub Models via `async-openai` |
| `tools` | `tools/mod.rs` | Tool dispatch layer |
| `tracer` | `tracer.rs` | Writes to SQLite via `rusqlite` |
| `memory` | `memory.rs` | Retrieves past context from SQLite |

---

### 3. Agent Layer

#### Local Agent — Ollama
- **Model:** `llama3.2` (3B, fast, always-on)
- **Role:** Task classification, simple chat, low-stakes tasks
- **Crate:** `ollama-rs` (already installed)
- **Endpoint:** `http://localhost:11434`

#### Cloud Agent — GitHub Models API
- **Models:**
  - `claude-3-7-sonnet` → coding, code review, refactoring
  - `gpt-4o` → reasoning, planning, summarisation
  - `meta-llama-3.3-70b-instruct` → general fallback
- **Crate:** `async-openai` with custom base URL
- **Auth:** GitHub Personal Access Token (stored in app config)
- **Endpoint:** `https://models.inference.ai.azure.com`

```rust
let config = OpenAIConfig::new()
    .with_api_base("https://models.inference.ai.azure.com")
    .with_api_key(github_token);
```

> GitHub Models API is OpenAI-compatible — same client works for all models.

---

### 4. Tool Layer

Each tool is a Rust struct implementing a common `Tool` trait:

```rust
trait Tool {
    fn name(&self) -> &str;
    async fn call(&self, input: serde_json::Value) -> Result<serde_json::Value, String>;
}
```

**Tools to build:**

| Tool | API | Use case |
|---|---|---|
| `JiraTool` | Jira REST API v3 | Create/search/update tickets |
| `ConfluenceTool` | Confluence REST API | Search docs, create pages |
| `GitHubTool` | GitHub REST API | PRs, issues, file content |
| `FilesystemTool` | Local FS | Read/write local files |
| `ShellTool` | `std::process::Command` | Run terminal commands locally |

**Auth:** API tokens stored encrypted in SQLite config table (never in code).

---

### 5. Tracing Layer

Every task execution is fully logged to local SQLite.

**Trace schema:**

```sql
CREATE TABLE traces (
    id          TEXT PRIMARY KEY,
    timestamp   TEXT NOT NULL,
    input       TEXT NOT NULL,       -- user message
    task_type   TEXT NOT NULL,       -- classified type
    agent_used  TEXT NOT NULL,       -- e.g. "claude-3-7-sonnet"
    tool_calls  TEXT,                -- JSON array of tool calls made
    output      TEXT NOT NULL,       -- final response
    duration_ms INTEGER NOT NULL
);
```

**Crates:** `rusqlite` for SQLite, `tracing` + `tracing-subscriber` for structured logs.

---

### 6. Memory Layer

Provides context from past sessions to the active agent.

**Strategy:**
- Store the last N messages per "topic" in SQLite
- On each new message, retrieve relevant past context and prepend to the prompt
- Later: upgrade to vector search with local `qdrant` for semantic retrieval

---

## Crates Summary

| Crate | Purpose |
|---|---|
| `tauri` | Desktop app shell |
| `ollama-rs` | Local Ollama client |
| `async-openai` | GitHub Models / OpenAI API client |
| `reqwest` | HTTP client for tool APIs (Jira, etc.) |
| `rusqlite` | Local SQLite persistence |
| `serde` / `serde_json` | Serialisation |
| `tokio` | Async runtime |
| `futures-util` | Stream handling |
| `tracing` | Structured logging |
| `uuid` | Trace IDs |

---

## Task Routing Decision Table

| Task type | Trigger keywords / signals | Agent |
|---|---|---|
| `coding` | "write code", "fix bug", "refactor", file extension in context | Claude 3.7 |
| `reasoning` | "explain", "plan", "analyse", "compare" | GPT-4o |
| `data` | "spreadsheet", "Excel", "CSV", "calculate" | qwen2.5:14b (local) |
| `tool_call` | "create ticket", "open PR", "search Jira" | Tool Layer |
| `simple_chat` | everything else | llama3.2 (local) |

---

## Configuration (stored in SQLite)

```
github_token        → GitHub PAT for Models API
jira_base_url       → e.g. https://yourorg.atlassian.net
jira_api_token      → Jira API token
confluence_url      → Confluence base URL
default_local_model → e.g. llama3.2
preferred_code_model → e.g. claude-3-7-sonnet
```

---

## Development Phases

### Phase 1 — Foundation (current)
- [x] Tauri + React shell
- [x] Ollama integration with streaming
- [x] Model selector in UI

### Phase 2 — Orchestrator
- [ ] Task classifier (llama3.2 prompt)
- [ ] GitHub Models API connection (`async-openai`)
- [ ] Basic router (local vs cloud)

### Phase 3 — Tracing
- [ ] SQLite setup (`rusqlite`)
- [ ] Trace writer on every request
- [ ] Trace viewer in UI

### Phase 4 — Tool Layer
- [ ] `Tool` trait definition
- [ ] Jira tool
- [ ] Confluence tool
- [ ] GitHub tool

### Phase 5 — Memory & Polish
- [ ] Session memory from SQLite
- [ ] Settings UI (API keys, model prefs)
- [ ] Error handling and retry logic
