#[tauri::command]
pub async fn get_ollama_status() -> bool {
    reqwest::get("http://localhost:11434")
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

#[tauri::command]
pub async fn start_ollama() -> Result<(), String> {
    std::process::Command::new("ollama")
        .arg("serve")
        .spawn()
        .map_err(|e| format!("Failed to start Ollama: {:?}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
    Ok(())
}

#[tauri::command]
pub async fn stop_ollama() -> Result<(), String> {
    std::process::Command::new("pkill")
        .arg("-x")
        .arg("ollama")
        .spawn()
        .map_err(|e| format!("Failed to stop Ollama: {:?}", e))?;
    Ok(())
}

use futures_util::StreamExt;
use serde::Serialize;
use tauri::ipc::Channel;

#[derive(Serialize, Clone)]
pub struct PullProgress {
    pub status: String,
    pub completed: Option<u64>,
    pub total: Option<u64>,
}

#[derive(Serialize)]
pub struct LocalModel {
    pub name: String,
    pub size: u64,
}

#[tauri::command]
pub async fn pull_ollama_model(
    name: String,
    on_progress: Channel<PullProgress>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:11434/api/pull")
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await
        .map_err(|e| format!("Ollama unreachable: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Ollama returned {}", response.status()));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {e}"))?;
        buffer.push_str(std::str::from_utf8(&chunk).unwrap_or(""));
        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer = buffer[pos + 1..].to_string();
            if line.is_empty() { continue; }
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                if let Some(err) = val.get("error") {
                    return Err(err.as_str().unwrap_or("Unknown error").to_string());
                }
                let status = val.get("status").and_then(|s| s.as_str()).unwrap_or("").to_string();
                let completed = val.get("completed").and_then(|v| v.as_u64());
                let total = val.get("total").and_then(|v| v.as_u64());
                let _ = on_progress.send(PullProgress { status, completed, total });
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn list_local_ollama_models() -> Result<Vec<LocalModel>, String> {
    let response = reqwest::get("http://localhost:11434/api/tags")
        .await
        .map_err(|e| format!("Ollama unreachable: {e}"))?;
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {e}"))?;
    let models = json
        .get("models")
        .and_then(|m| m.as_array())
        .map(|arr| {
            arr.iter()
                .map(|m| LocalModel {
                    name: m.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string(),
                    size: m.get("size").and_then(|s| s.as_u64()).unwrap_or(0),
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(models)
}

#[tauri::command]
pub async fn delete_ollama_model(name: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let response = client
        .delete("http://localhost:11434/api/delete")
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await
        .map_err(|e| format!("Ollama unreachable: {e}"))?;
    if !response.status().is_success() {
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Delete failed: {text}"));
    }
    Ok(())
}

#[derive(Serialize)]
pub struct RegistryModel {
    pub name: String,
    pub size: u64,
}

#[tauri::command]
pub async fn list_ollama_registry_models(limit: Option<u32>) -> Result<Vec<RegistryModel>, String> {
    let n = limit.unwrap_or(40);
    let url = format!("https://ollama.com/api/tags?sort=popular&limit={n}");
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to reach Ollama registry: {e}"))?;
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse registry response: {e}"))?;
    let models = json
        .get("models")
        .and_then(|m| m.as_array())
        .map(|arr| {
            arr.iter()
                .map(|m| RegistryModel {
                    name: m.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string(),
                    size: m.get("size").and_then(|s| s.as_u64()).unwrap_or(0),
                })
                .filter(|m| !m.name.is_empty())
                .collect()
        })
        .unwrap_or_default();
    Ok(models)
}
