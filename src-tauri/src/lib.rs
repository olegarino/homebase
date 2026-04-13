use serde::{Serialize, Deserialize};
use futures_util::StreamExt;
use tokio::sync::Mutex;
use tauri::{ipc::Channel, State};
use ollama_rs::{generation::chat::{request::ChatMessageRequest, ChatMessage},Ollama};

struct AppState {
    ollama: Mutex<Ollama>
}

#[derive(Serialize)]
struct ChatResponse {
    message: String
}

#[derive(Deserialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>
}

#[tauri::command]
async fn get_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let models = {
        let client = state.ollama.lock().await;
        client.list_local_models()
        .await
        .map_err(|e| format!("Failed to list models {:?}", e))?
    };
    Ok(models.iter().map(|m| m.name.clone()).collect())
}

#[tauri::command]
async fn chat(
    request: ChatRequest,
    on_stream: Channel<ChatResponse>,
    state: State<'_, AppState>
) -> Result<(), String> {
    let client = state.ollama.lock().await;
    let chat_request = ChatMessageRequest::new(request.model, request.messages);
    let mut stream = client.send_chat_messages_stream(chat_request)
        .await
        .map_err(|e| format!("Failed to send chat messages, e: {:?}", e))?;

    while let Some(response) = stream.next().await {
        let response = response
            .map_err(|e| format!("Failed to receive chat response, e: {:?}", e))?;
        let chat_response = ChatResponse {
            message: response.message.content,
        };

        on_stream.send(chat_response)
            .map_err(|e| format!("Failed to send chat response, e: {:?}", e))?;
    }
    Ok(())
}

#[tauri::command]
async fn get_ollama_status() -> bool {
    reqwest::get("http://localhost:11434")
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

#[tauri::command]
async fn start_ollama() -> Result<(), String> {
    std::process::Command::new("ollama")
        .arg("serve")
        .spawn()
        .map_err(|e| format!("Failed to start Ollama: {:?}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
    Ok(())
}

#[tauri::command]
async fn stop_ollama() -> Result<(), String> {
    std::process::Command::new("pkill")
        .arg("-x")
        .arg("ollama")
        .spawn()
        .map_err(|e| format!("Failed to stop Ollama: {:?}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            ollama: Mutex::new(Ollama::default())
        })
        .invoke_handler(tauri::generate_handler![get_models, chat, get_ollama_status, start_ollama, stop_ollama])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
