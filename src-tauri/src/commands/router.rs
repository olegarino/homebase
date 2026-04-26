use serde::Deserialize;

#[derive(Deserialize)]
struct OllamaGenerateResponse {
    response: String,
}

/// Classifies a user message into one of: simple_chat, coding, reasoning, data, tool_call.
/// Uses the local Ollama model to perform the classification.
#[tauri::command]
pub async fn classify_task(message: String, model: String) -> Result<String, String> {
    let prompt = format!(
        "Classify this request into exactly one of: simple_chat, coding, reasoning, data, tool_call.\n\
         Reply with only the category name, nothing else.\n\
         Request: {}",
        message
    );

    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:11434/api/generate")
        .json(&serde_json::json!({
            "model": model,
            "prompt": prompt,
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| format!("Ollama unreachable: {e}"))?
        .json::<OllamaGenerateResponse>()
        .await
        .map_err(|e| format!("Failed to parse classification response: {e}"))?;

    let task_type = response.response.trim().to_lowercase();
    let valid = ["simple_chat", "coding", "reasoning", "data", "tool_call"];
    if valid.contains(&task_type.as_str()) {
        Ok(task_type)
    } else {
        // Fall back gracefully if the model doesn't return a recognised label
        Ok("simple_chat".to_string())
    }
}
