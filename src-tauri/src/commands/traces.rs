use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::state::AppState;

#[derive(Deserialize)]
pub struct TracePayload {
    pub input: String,
    pub task_type: String,
    pub agent_used: String,
    pub output: String,
    pub duration_ms: i64,
    pub compressed: bool,
    pub tokens_saved: i64,
}

#[derive(Serialize)]
pub struct TraceRow {
    pub id: String,
    pub timestamp: String,
    pub input: String,
    pub task_type: String,
    pub agent_used: String,
    pub output: String,
    pub duration_ms: i64,
    pub compressed: bool,
    pub tokens_saved: i64,
}

#[tauri::command]
pub async fn save_trace(
    state: State<'_, AppState>,
    trace: TracePayload,
) -> Result<(), String> {
    let id = Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().to_rfc3339();

    let db = state.db.lock().map_err(|e| format!("DB lock error: {}", e))?;
    db.execute(
        "INSERT INTO traces (id, timestamp, input, task_type, agent_used, output, duration_ms, compressed, tokens_saved)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            id, timestamp, trace.input,
            trace.task_type, trace.agent_used, trace.output, trace.duration_ms,
            trace.compressed, trace.tokens_saved
        ],
    ).map_err(|e| format!("Failed to save trace: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_traces(state: State<'_, AppState>) -> Result<Vec<TraceRow>, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {}", e))?;
    let mut stmt = db
        .prepare("SELECT id, timestamp, input, task_type, agent_used, output, duration_ms, compressed, tokens_saved FROM traces ORDER BY timestamp DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(TraceRow {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                input: row.get(2)?,
                task_type: row.get(3)?,
                agent_used: row.get(4)?,
                output: row.get(5)?,
                duration_ms: row.get(6)?,
                compressed: row.get(7)?,
                tokens_saved: row.get(8)?,
            })
        })
        .map_err(|e| format!("Failed to query traces: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect traces: {}", e))?;

    Ok(rows)
}

#[tauri::command]
pub async fn delete_traces(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("DB lock error: {}", e))?;
    db.execute("DELETE FROM traces", [])
        .map_err(|e| format!("Failed to delete traces: {}", e))?;
    Ok(())
}
