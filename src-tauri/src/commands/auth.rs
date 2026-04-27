use serde::Serialize;
use tauri::State;

use crate::{commands::logs::db_log, state::AppState};

// The GitHub OAuth App used by the official Copilot VS Code extension.
// Using this client_id means our token will have Copilot access.
const CLIENT_ID: &str = "Iv1.b507a08c87ecfe98";

#[derive(Serialize, Clone)]
pub struct DeviceCodeResponse {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

/// Step 1: Request a device + user code pair from GitHub.
/// Returns the data the frontend needs to show the user.
#[tauri::command]
pub async fn start_github_login(
    state: State<'_, AppState>,
) -> Result<DeviceCodeResponse, String> {
    let db = std::sync::Arc::clone(&state.db);
    if let Ok(conn) = db.lock() {
        db_log(&conn, "INFO", "auth", "Starting GitHub device flow");
    }

    let client = reqwest::Client::new();
    let body = format!("client_id={CLIENT_ID}&scope=");
    let response = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .header("User-Agent", "buddy/1.0")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Device code request failed: {e}"))?;

    if !response.status().is_success() {
        let text = response.text().await
            .map_err(|e| format!("Read error body: {e}"))?;
        return Err(format!("Device code error: {text}"));
    }

    let data: serde_json::Value = response.json().await
        .map_err(|e| format!("Parse device code response: {e}"))?;

    if let Ok(conn) = db.lock() {
        db_log(&conn, "DEBUG", "auth", &format!("Device code response: {data}"));
    }

    Ok(DeviceCodeResponse {
        device_code:      data["device_code"].as_str().unwrap_or("").to_string(),
        user_code:        data["user_code"].as_str().unwrap_or("").to_string(),
        verification_uri: data["verification_uri"].as_str().unwrap_or("https://github.com/login/device").to_string(),
        expires_in:       data["expires_in"].as_u64().unwrap_or(900),
        interval:         data["interval"].as_u64().unwrap_or(5),
    })
}

/// Step 2: Poll GitHub until the user has authorized the device code.
/// Returns the OAuth access token (gho_...) on success.
#[tauri::command]
pub async fn poll_github_login(
    state: State<'_, AppState>,
    device_code: String,
) -> Result<String, String> {
    let db = std::sync::Arc::clone(&state.db);

    let client = reqwest::Client::new();
    let body = format!(
        "client_id={CLIENT_ID}&device_code={device_code}&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code"
    );
    let response = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .header("User-Agent", "buddy/1.0")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Poll request failed: {e}"))?;

    let data: serde_json::Value = response.json().await
        .map_err(|e| format!("Parse poll response: {e}"))?;

    if let Ok(conn) = db.lock() {
        // Log without the actual token value
        let safe = if data.get("access_token").is_some() {
            "access_token present".to_string()
        } else {
            format!("{data}")
        };
        db_log(&conn, "DEBUG", "auth", &format!("Poll response: {safe}"));
    }

    if let Some(token) = data["access_token"].as_str() {
        if let Ok(conn) = db.lock() {
            db_log(&conn, "INFO", "auth", "OAuth token obtained successfully");
        }
        return Ok(token.to_string());
    }

    // Distinguish "not yet authorized" from real errors
    let error = data["error"].as_str().unwrap_or("unknown");
    match error {
        "authorization_pending" => Err("pending".to_string()),
        "slow_down"             => Err("slow_down".to_string()),
        "expired_token"         => Err("expired".to_string()),
        "access_denied"         => Err("denied".to_string()),
        _                       => Err(format!("error:{error}")),
    }
}

// ---------------------------------------------------------------------------
// get_github_user
// ---------------------------------------------------------------------------

#[derive(Serialize, Clone)]
pub struct GitHubUser {
    pub login: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

/// Fetch the authenticated GitHub user's profile using a `gho_` OAuth token.
/// Used by the frontend to display "Connected as @username".
#[tauri::command]
pub async fn get_github_user(
    state: State<'_, AppState>,
    github_token: String,
) -> Result<GitHubUser, String> {
    let db = std::sync::Arc::clone(&state.db);

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {github_token}"))
        .header("User-Agent", "buddy/1.0")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("GitHub user request failed: {e}"))?;

    let status = response.status();
    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        if let Ok(conn) = db.lock() {
            db_log(&conn, "ERROR", "auth", &format!("get_github_user {status}: {text}"));
        }
        return Err(format!("GitHub user error {status}"));
    }

    let data: serde_json::Value = response.json().await
        .map_err(|e| format!("Parse user response: {e}"))?;

    Ok(GitHubUser {
        login: data["login"].as_str().unwrap_or("unknown").to_string(),
        name: data["name"].as_str().map(|s| s.to_string()),
        avatar_url: data["avatar_url"].as_str().map(|s| s.to_string()),
    })
}
