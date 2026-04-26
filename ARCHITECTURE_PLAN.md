# Homebase — Architecture Plan

## Vision

A local-first AI orchestration desktop app built with Tauri + Rust.
A lightweight local model (Ollama) acts as the orchestrator and router, delegating heavy tasks to premium cloud agents (Claude, GPT-4o) via the GitHub Models API. Every decision, tool call, and response is traced locally. External tools like Jira and Atlassian are connected through a tool layer.

---

## High-Level Architecture

```
+---------------------------------------------+
|               Tauri App (UI)                |
|  Chat · Trace Viewer · Status · Settings    |
+--------------------+------------------------+
                     |  Tauri IPC (invoke / Channel)
+--------------------v------------------------+
|            Rust Orchestrator                |
|  * Classifies incoming task                 |
|  * Routes to local or cloud agent           |
|  * Manages tool calls and results           |
|  * Writes structured trace logs to SQLite   |
|  * Manages session memory                   |
+----+-------------------+--------------------+
     |                   |
+----v------+   +--------v--------------------+
|  Ollama   |   |     GitHub Models API        |
| llama3.2  |   |  Claude 3.7 -> coding tasks  |
| (router + |   |  GPT-4o    -> reasoning      |
|  simple)  |   |  Llama 3.3 -> fallback       |
+-----------+   +-----------------------------+
                            |
+---------------------------v-----------------+
|                 Tool Layer                  |
|   Jira * Confluence * GitHub * filesystem * Teams * Outlook   |
+---------------------------------------------+
                            |
+---------------------------v-----------------+
|              Persistence Layer              |
|        SQLite -- traces, memory, config     |
+---------------------------------------------+
```

---

## Layers in Detail

### 1. UI Layer -- Tauri (React + TypeScript)

**Responsibilities:**
- `ChatComponent.tsx` -- streaming chat with model selector + Ollama status indicator
- `TracesPage.tsx` -- expandable trace list, loaded from SQLite on mount
- `StatusPage.tsx` -- live Ollama service monitor with start/stop controls
- `SettingsPage.tsx` -- language toggle (EN/FR), API key management (coming soon)
- `Layout.tsx` -- sidebar navigation, i18n-aware nav labels

**Communication with Rust:**
- `invoke()` for request/response commands
- `Channel<T>` for streaming responses

**State management:**
- Zustand stores: `chatStore`, `traceStore`, `localeStore` (persisted)

**Internationalisation:**
- All UI strings go through `useT()` from `src/i18n/`
- EN/FR dictionaries in `src/i18n/translations.ts`
- See `CLAUDE.md` for contribution rules

---

### 2. Rust Backend -- Module Structure

The backend is split into focused modules under `src-tauri/src/`:

| File | Role |
|---|---|
| `lib.rs` | App entry point -- wiring only, no business logic |
| `state.rs` | `AppState` struct -- `AsyncMutex<Ollama>` + `Mutex<Connection>` |
| `db.rs` | SQLite init, WAL mode, schema migrations |
| `commands/mod.rs` | Re-exports all command modules |
| `commands/chat.rs` | `get_models`, `chat` (streaming via `Channel`) |
| `commands/ollama.rs` | `get_ollama_status`, `start_ollama`, `stop_ollama` |
| `commands/traces.rs` | `save_trace`, `get_traces` |

**Planned additions:**

| Module | File | Role |
|---|---|---|
| `orchestrator` | `orchestrator.rs` | Main routing logic |
| `classifier` | `classifier.rs` | Calls llama3.2 to classify task type |
| `agents/cloud` | `agents/cloud.rs` | GitHub Models via `async-openai` |
| `tools` | `tools/mod.rs` | Tool dispatch layer |
| `memory` | `memory.rs` | Session context from SQLite |

---

### 3. Agent Layer

#### Local Agent -- Ollama
- **Model:** `llama3.2` (3B, fast, always-on)
- **Role:** Task classification, simple chat, low-stakes tasks
- **Crate:** `ollama-rs` (installed)
- **Endpoint:** `http://localhost:11434`

#### Cloud Agent -- GitHub Models API
- **Models:**
  - `claude-3-7-sonnet` -- coding, code review, refactoring
  - `gpt-4o` -- reasoning, planning, summarisation
  - `meta-llama-3.3-70b-instruct` -- general fallback
- **Crate:** `async-openai` with custom base URL
- **Auth:** GitHub Personal Access Token (stored in SQLite config table)
- **Endpoint:** `https://models.inference.ai.azure.com`

```rust
let config = OpenAIConfig::new()
    .with_api_base("https://models.inference.ai.azure.com")
    .with_api_key(github_token);
```

> GitHub Models API is OpenAI-compatible -- same client works for all models.

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
| `OutlookTool` | Microsoft Graph API | Read/send emails, search inbox, manage calendar |
| `TeamsTool` | Microsoft Graph API | Send messages, read channels, create meetings |

---

### 4b. Microsoft Graph API — Teams & Outlook

**Auth flow:** OAuth 2.0 Device Authorization Grant (best for desktop apps — no redirect URI needed).
The user logs in once via a browser pop-up, receives an access token + refresh token stored in the `config` SQLite table.

**Endpoints used:**

| Capability | Endpoint |
|---|---|
| Read inbox | `GET /me/messages` |
| Send email | `POST /me/sendMail` |
| Search email | `GET /me/messages?$search="..."` |
| List calendar events | `GET /me/calendarView` |
| Create meeting | `POST /me/events` |
| List Teams channels | `GET /me/joinedTeams` |
| Read channel messages | `GET /teams/{id}/channels/{id}/messages` |
| Send Teams message | `POST /teams/{id}/channels/{id}/messages` |

**Scopes required (Microsoft Entra app registration):**
```
Mail.Read  Mail.Send  Calendars.ReadWrite
Team.ReadBasic.All  ChannelMessage.Read.All  ChannelMessage.Send
```

**Rust implementation plan:**

- Add `OutlookTool` and `TeamsTool` structs implementing the `Tool` trait
- Auth handled in a new `src-tauri/src/commands/msgraph.rs` module:
  - `msgraph_login()` — triggers device code flow, opens browser, polls for token
  - `msgraph_logout()` — clears stored tokens
  - `msgraph_status()` — returns whether a valid token exists
- Token refresh handled automatically on each API call (check expiry, refresh if needed)
- HTTP calls via `reqwest` (already installed)

**Crate to add:**
```
oauth2 = "4"   # handles device flow + token refresh
```

**Settings page additions needed:**
- "Connect Microsoft account" button → calls `msgraph_login()`
- Shows connected account email once authenticated
- "Disconnect" button → calls `msgraph_logout()`

**App registration (one-time setup by developer):**
1. Go to https://portal.azure.com → Microsoft Entra ID → App registrations
2. New registration — platform: **Mobile and desktop**, redirect URI: `https://login.microsoftonline.com/common/oauth2/nativeclient`
3. Enable **Allow public client flows** (for device code grant)
4. Copy the **Application (client) ID** → hardcode in Rust as a constant
5. Add required API permissions listed above

---

Every task execution is fully logged to local SQLite at:
`~/Library/Application Support/Homebase/homebase.db`

**Schema (implemented):**

```sql
CREATE TABLE traces (
    id          TEXT PRIMARY KEY,
    timestamp   TEXT NOT NULL,
    input       TEXT NOT NULL,
    task_type   TEXT NOT NULL,
    agent_used  TEXT NOT NULL,
    output      TEXT NOT NULL,
    duration_ms INTEGER NOT NULL
);

CREATE TABLE memory (
    id         TEXT PRIMARY KEY,
    workspace  TEXT NOT NULL DEFAULT 'default',
    kind       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

Traces are persisted from `commands/traces.rs` and loaded by `TracesPage` on mount via `get_traces`.

---

### 6. Memory Layer *(planned)*

- Store last N messages per topic in SQLite `memory` table
- Prepend relevant past context to each new prompt
- Future: vector search with local `qdrant` for semantic retrieval

---

## Crates Summary

| Crate | Purpose | Status |
|---|---|---|
| `tauri` | Desktop app shell | installed |
| `ollama-rs` | Local Ollama client | installed |
| `rusqlite` (bundled) | SQLite persistence | installed |
| `uuid` | Trace IDs | installed |
| `chrono` | Timestamps | installed |
| `tokio` | Async runtime | installed |
| `futures-util` | Stream handling | installed |
| `serde` / `serde_json` | Serialisation | installed |
| `async-openai` | GitHub Models API | planned |
| `reqwest` | HTTP for tool APIs | installed |
| `oauth2` | MS Graph device auth flow + token refresh | planned |
| `tracing` | Structured logging | planned |

---

## Task Routing Decision Table

| Task type | Trigger signals | Agent |
|---|---|---|
| `coding` | "write code", "fix bug", "refactor", file extension in context | Claude 3.7 |
| `reasoning` | "explain", "plan", "analyse", "compare" | GPT-4o |
| `data` | "spreadsheet", "Excel", "CSV", "calculate" | qwen2.5:14b (local) |
| `tool_call` | "create ticket", "open PR", "search Jira" | Tool Layer |
| `tool_call` | "send email", "check inbox", "schedule meeting", "message in Teams" | Tool Layer → MS Graph |
| `simple_chat` | everything else | llama3.2 (local) |

---

## Development Phases

### Phase 1 -- Foundation
- [x] Tauri + React shell
- [x] Ollama integration with streaming
- [x] Model selector in UI
- [x] Sidebar layout and routing (HashRouter)

### Phase 2 -- UI & State
- [x] Tailwind v4 + shadcn/ui
- [x] Zustand stores (chat, trace)
- [x] Chat page with streaming
- [x] Status page with live polling + start/stop
- [x] Settings page with language toggle
- [x] EN/FR i18n system with `useT()` hook and persisted locale
- [x] AI provider toggle (Ollama vs Copilot) in Settings — persisted in `settingsStore`
- [x] Copilot model selector (gpt-4o, claude-3-7-sonnet, o3-mini, etc.) in Settings
- [x] Ollama model downloader UI in Settings (`pull_ollama_model` Tauri command — see Pending Rust)
- [ ] Disable Ollama provider option when Ollama is not detected (check via `get_ollama_status`)

### Phase 3 -- Tracing & Persistence
- [x] SQLite setup with WAL mode and migrations
- [x] `save_trace` command (Rust)
- [x] `get_traces` command (Rust)
- [x] Trace writer on every chat completion
- [x] Traces page with expandable rows
- [x] Traces loaded from SQLite on app launch

### Phase 4 -- Orchestrator
- [ ] Task classifier (llama3.2 prompt)
- [ ] GitHub Models API connection (`async-openai`)
- [ ] Basic router (local vs cloud by task type)
- [ ] `pull_ollama_model(name: String)` Tauri command — calls `POST http://localhost:11434/api/pull`, streams progress events back via `Channel<String>`, registered in `lib.rs`
- [ ] Respect `inferenceProvider` setting in `ChatComponent` — if `"copilot"`, skip Ollama and call Copilot SDK with selected `copilotModel`

### Phase 5 -- Tool Layer
- [ ] `Tool` trait definition
- [ ] Jira tool
- [ ] Confluence tool
- [ ] GitHub tool
- [ ] Microsoft Graph auth (`msgraph_login` / `msgraph_logout` / token refresh)
- [ ] Outlook tool (read inbox, send email, calendar)
- [ ] Teams tool (read channels, send messages, create meetings)
- [ ] Settings page: "Connect Microsoft account" button + connected state

### Phase 6 -- Memory & Polish
- [ ] Session memory from SQLite
- [ ] Settings persistence (API keys, model prefs) via config table
- [ ] Error handling and retry logic
- [ ] Vector search for semantic memory (qdrant)
