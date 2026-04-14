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
