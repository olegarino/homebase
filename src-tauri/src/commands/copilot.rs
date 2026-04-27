use chrono::{DateTime, Duration, Utc};
use futures_util::StreamExt;
use serde::Serialize;
use std::sync::{Arc, Mutex, OnceLock};
use tauri::{ipc::Channel, State};

use crate::{commands::logs::db_log, state::AppState};

#[derive(Serialize, Clone)]
pub struct CopilotChunk {
    pub message: String,
}

// ---------------------------------------------------------------------------
// Session-token cache
// ---------------------------------------------------------------------------

struct TokenCache {
    token: String,
    expires_at: DateTime<Utc>,
}

static TOKEN_CACHE: OnceLock<Mutex<Option<TokenCache>>> = OnceLock::new();

fn token_cache() -> &'static Mutex<Option<TokenCache>> {
    TOKEN_CACHE.get_or_init(|| Mutex::new(None))
}

/// Log without holding the guard across an await.
fn alog(db: &Arc<Mutex<rusqlite::Connection>>, level: &str, ctx: &str, msg: &str) {
    if let Ok(conn) = db.lock() {
        db_log(&conn, level, ctx, msg);
    }
}

/// Exchange a GitHub PAT for a short-lived Copilot session token.
///
/// The token is cached in memory and reused until it's within 60 seconds of
/// expiry, at which point a fresh exchange is performed.
/// For fine-grained PATs (github_pat_...) we use the token directly as a
/// Bearer on api.githubcopilot.com — no exchange step needed.
///
/// For OAuth tokens (gho_...) we first exchange via copilot_internal/v2/token
/// to get a short-lived session token, which is then cached.
async fn get_copilot_token(
    github_token: &str,
    db: &Arc<Mutex<rusqlite::Connection>>,
) -> Result<String, String> {
    // Fine-grained PATs are used directly — skip the exchange.
    if github_token.starts_with("github_pat_") {
        alog(db, "INFO", "copilot_auth",
            "Fine-grained PAT detected — using directly as Bearer token");
        return Ok(github_token.to_string());
    }

    // OAuth / other tokens: check cache first.
    {
        let cache = token_cache().lock().unwrap();
        if let Some(ref cached) = *cache {
            if Utc::now() < cached.expires_at - Duration::seconds(60) {
                alog(db, "DEBUG", "copilot_auth", "Using cached session token");
                return Ok(cached.token.clone());
            }
        }
    }

    let prefix = &github_token[..github_token.len().min(16)];
    alog(db, "INFO", "copilot_auth",
        &format!("Exchanging OAuth token (prefix: {prefix}...) for session token"));

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/copilot_internal/v2/token")
        .header("Authorization", format!("token {github_token}"))
        .header("User-Agent", "GithubCopilot/1.138.0")
        .header("Editor-Version", "vscode/1.85.0")
        .header("Editor-Plugin-Version", "copilot/1.138.0")
        .header("Copilot-Integration-Id", "vscode-chat")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| { let m = format!("Token exchange network error: {e}"); alog(db, "ERROR", "copilot_auth", &m); m })?;

    let status = response.status();
    alog(db, "INFO", "copilot_auth", &format!("Token exchange HTTP {status}"));

    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        *token_cache().lock().unwrap() = None;
        let msg = format!(
            "Token exchange {status}: {text} — use a fine-grained PAT (github_pat_...) \
             with 'Copilot Requests' permission."
        );
        alog(db, "ERROR", "copilot_auth", &msg);
        return Err(msg);
    }

    let raw = response.text().await.map_err(|e| format!("Read token body: {e}"))?;
    alog(db, "DEBUG", "copilot_auth", &format!("Token exchange raw body: {raw}"));

    let data: serde_json::Value =
        serde_json::from_str(&raw).map_err(|e| format!("Parse token response: {e}"))?;

    let token = match data["token"].as_str() {
        Some(t) => t.to_string(),
        None => {
            let msg = format!("Missing 'token' field. Body: {raw}");
            alog(db, "ERROR", "copilot_auth", &msg);
            return Err(msg);
        }
    };

    let expires_at = data["expires_at"]
        .as_str()
        .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now() + Duration::minutes(25));

    alog(db, "INFO", "copilot_auth",
        &format!("Session token obtained, expires at {expires_at}"));

    {
        let mut cache = token_cache().lock().unwrap();
        *cache = Some(TokenCache { token: token.clone(), expires_at });
    }

    Ok(token)
}

// ---------------------------------------------------------------------------
// list_copilot_models
// ---------------------------------------------------------------------------

/// Fetch the list of models available through the GitHub Copilot API.
/// Returns a sorted Vec of model IDs that can be passed to `run_copilot_agent`.
#[tauri::command]
pub async fn list_copilot_models(
    state: State<'_, AppState>,
    github_token: String,
) -> Result<Vec<String>, String> {
    let db = Arc::clone(&state.db);
    alog(&db, "INFO", "copilot_models", "list_copilot_models called");

    let session_token = get_copilot_token(&github_token, &db).await?;

    alog(&db, "INFO", "copilot_models", "Fetching from api.githubcopilot.com/models");
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.githubcopilot.com/models")
        .header("Authorization", format!("Bearer {session_token}"))
        .header("User-Agent", "GithubCopilot/1.138.0")
        .header("Editor-Version", "vscode/1.85.0")
        .header("Editor-Plugin-Version", "copilot/1.138.0")
        .header("Copilot-Integration-Id", "vscode-chat")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| { let m = format!("Models endpoint unreachable: {e}"); alog(&db, "ERROR", "copilot_models", &m); m })?;

    let status = response.status();
    alog(&db, "INFO", "copilot_models", &format!("Models HTTP {status}"));

    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        let msg = format!("Copilot models error {status}: {text}");
        alog(&db, "ERROR", "copilot_models", &msg);
        return Err(msg);
    }

    let raw = response.text().await.map_err(|e| format!("Read models body: {e}"))?;
    alog(&db, "DEBUG", "copilot_models",
        &format!("Models raw body (first 500): {}", &raw[..raw.len().min(500)]));

    let data: serde_json::Value =
        serde_json::from_str(&raw).map_err(|e| format!("Parse models: {e}"))?;

    let mut ids: Vec<String> = data["data"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|m| m["id"].as_str().map(|s| s.to_string()))
        .collect();
    ids.sort();

    alog(&db, "INFO", "copilot_models", &format!("Found {} models", ids.len()));
    Ok(ids)
}

// ---------------------------------------------------------------------------
// run_copilot_agent
// ---------------------------------------------------------------------------

/// Sends a prompt to the GitHub Copilot API and streams the response
/// token-by-token through `on_stream`.
///
/// Authentication is a two-step process: the supplied GitHub PAT is first
/// exchanged for a short-lived Copilot session token (cached for its lifetime),
/// which is then used to call the OpenAI-compatible
/// `api.githubcopilot.com/chat/completions` endpoint.
#[tauri::command]
pub async fn run_copilot_agent(
    state: State<'_, AppState>,
    prompt: String,
    task_type: String,
    github_token: String,
    model: String,
    on_stream: Channel<CopilotChunk>,
) -> Result<(), String> {
    let db = Arc::clone(&state.db);
    alog(&db, "INFO", "copilot_agent",
        &format!("run_copilot_agent — model={model} task_type={task_type}"));

    let session_token = get_copilot_token(&github_token, &db).await?;

    // Build a system message that varies by task type so the cloud model is
    // primed appropriately for the kind of work being requested.
    let system_content = match task_type.as_str() {
        "coding" => "You are an expert software engineer. Provide clear, correct code with brief explanations.",
        "reasoning" => "You are a careful analytical thinker. Work through problems step by step.",
        "data" => "You are a data analyst. Provide structured analysis and insights.",
        "tool_call" => "You are an AI assistant capable of using tools. Describe the steps and any actions needed.",
        _ => "You are a helpful AI assistant.",
    };

    let body = serde_json::json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system_content },
            { "role": "user", "content": prompt }
        ],
        "stream": true
    });

    alog(&db, "INFO", "copilot_agent",
        "Sending to api.githubcopilot.com/chat/completions");
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.githubcopilot.com/chat/completions")
        .header("Authorization", format!("Bearer {session_token}"))
        .header("Content-Type", "application/json")
        .header("User-Agent", "GithubCopilot/1.138.0")
        .header("Editor-Version", "vscode/1.85.0")
        .header("Editor-Plugin-Version", "copilot/1.138.0")
        .header("Copilot-Integration-Id", "vscode-chat")
        .json(&body)
        .send()
        .await
        .map_err(|e| { let m = format!("Copilot API unreachable: {e}"); alog(&db, "ERROR", "copilot_agent", &m); m })?;

    let status = response.status();
    alog(&db, "INFO", "copilot_agent", &format!("Chat completions HTTP {status}"));

    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        let msg = format!("Copilot API error {status}: {text}");
        alog(&db, "ERROR", "copilot_agent", &msg);
        return Err(msg);
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {e}"))?;
        buffer.push_str(std::str::from_utf8(&chunk).unwrap_or(""));

        // Process all complete lines in the buffer
        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].trim().to_string();
            buffer = buffer[newline_pos + 1..].to_string();

            if line.is_empty() || line == "data: [DONE]" {
                continue;
            }

            if let Some(json_str) = line.strip_prefix("data: ") {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(json_str) {
                    if let Some(content) = val
                        .get("choices")
                        .and_then(|c| c.get(0))
                        .and_then(|c| c.get("delta"))
                        .and_then(|d| d.get("content"))
                        .and_then(|c| c.as_str())
                    {
                        if !content.is_empty() {
                            on_stream
                                .send(CopilotChunk { message: content.to_string() })
                                .map_err(|e| format!("Channel error: {e}"))?;
                        }
                    }
                }
            }
        }
    }

    Ok(())
}
