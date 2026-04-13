# Homebase

A local-first AI orchestration desktop app built with Tauri, Rust, and React.

Homebase runs a lightweight local model via Ollama as an intelligent router, delegating complex tasks to premium cloud agents (Claude, GPT-4o) through the GitHub Models API — all while keeping a full trace of every decision and response on your machine.

---

## What it does

### 🤖 AI Orchestration
- Routes tasks automatically between a local model (Ollama) and cloud agents (Claude, GPT-4o) based on complexity and task type
- Local model handles simple chat and task classification — fast, free, and private
- Cloud agents handle coding, reasoning, and data tasks via GitHub Models API (no separate billing beyond your GitHub subscription)

### 💬 Chat
- Streaming chat interface with model selector
- Supports any model pulled into Ollama (llama3.2, qwen2.5, deepseek-coder, etc.)
- Conversation history preserved across the session

### 🔍 Tracing
- Every request is logged: input, output, agent used, task type, and duration
- Expandable one-liner trace entries for quick review
- Full detail view per trace on click

### 🛠 Tool Integration *(coming soon)*
- Jira — create, search, and update tickets by natural language
- Confluence — search docs and create pages
- GitHub — browse PRs, issues, and file contents
- Local filesystem — read and write files
- Excel / CSV — AI-generated data transformations via Python

### 📊 Status Monitor
- Live Ollama service status (polling every 5 seconds)
- Start and stop Ollama directly from the app
- Connection info and install guidance if Ollama is not found

### ⚙️ Settings *(coming soon)*
- GitHub API token management
- Jira and Confluence connection config
- Model preferences per task type

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand |
| Routing | React Router (HashRouter) |
| Backend | Rust (async, Tokio) |
| Local AI | Ollama via `ollama-rs` |
| Cloud AI | GitHub Models API via `async-openai` *(coming soon)* |
| Persistence | SQLite via `rusqlite` *(coming soon)* |

---

## Getting Started

### Prerequisites
- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.com/) — `brew install ollama`
- At least one model pulled: `ollama pull llama3.2`

### Run in development

```bash
npm install
ollama serve
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
