use futures_util::StreamExt;
use serde::Serialize;
use tauri::ipc::Channel;

#[derive(Serialize, Clone)]
pub struct CopilotChunk {
    pub message: String,
}

/// Sends a prompt to the GitHub Models (Azure AI Inference) API and streams
/// the response back token-by-token through `on_stream`.
///
/// The API endpoint is compatible with the OpenAI chat-completions spec and
/// uses Server-Sent Events (SSE) when `stream: true` is set.
#[tauri::command]
pub async fn run_copilot_agent(
    prompt: String,
    task_type: String,
    github_token: String,
    model: String,
    on_stream: Channel<CopilotChunk>,
) -> Result<(), String> {
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

    let client = reqwest::Client::new();
    let response = client
        .post("https://models.inference.ai.azure.com/chat/completions")
        .header("Authorization", format!("Bearer {}", github_token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to reach GitHub Models API: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("GitHub Models API error {status}: {text}"));
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
