use futures_util::StreamExt;
use ollama_rs::generation::chat::{request::ChatMessageRequest, ChatMessage};
use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};

use crate::state::AppState;

#[derive(Serialize)]
pub struct ChatResponse {
    pub message: String,
}

#[derive(Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
}

#[tauri::command]
pub async fn get_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let client = state.ollama.lock().await;
    let models = client
        .list_local_models()
        .await
        .map_err(|e| format!("Failed to list models: {:?}", e))?;
    Ok(models.iter().map(|m| m.name.clone()).collect())
}

#[tauri::command]
pub async fn chat(
    request: ChatRequest,
    on_stream: Channel<ChatResponse>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let client = state.ollama.lock().await;
    let chat_request = ChatMessageRequest::new(request.model, request.messages);
    let mut stream = client
        .send_chat_messages_stream(chat_request)
        .await
        .map_err(|e| format!("Failed to send chat messages: {:?}", e))?;

    while let Some(response) = stream.next().await {
        let response = response
            .map_err(|e| format!("Failed to receive chat response: {:?}", e))?;
        on_stream
            .send(ChatResponse { message: response.message.content })
            .map_err(|e| format!("Failed to send chat response: {:?}", e))?;
    }
    Ok(())
}
