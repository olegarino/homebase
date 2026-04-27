use serde::Serialize;
use tauri::State;

use crate::state::AppState;

#[derive(Serialize, Clone)]
pub struct LogRow {
    pub id: i64,
    pub timestamp: String,
    pub level: String,
    pub context: String,
    pub message: String,
}

pub fn db_log(db: &rusqlite::Connection, level: &str, context: &str, message: &str) {
    let timestamp = chrono::Utc::now().to_rfc3339();
    let _ = db.execute(
        "INSERT INTO logs (timestamp, level, context, message) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![timestamp, level, context, message],
    );
}

#[tauri::command]
pub async fn write_log(
    state: State<'_, AppState>,
    level: String,
    context: String,
    message: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("DB lock: {e}"))?;
    db_log(&db, &level, &context, &message);
    Ok(())
}

#[tauri::command]
pub async fn get_logs(state: State<'_, AppState>) -> Result<Vec<LogRow>, String> {
    let db = state.db.lock().map_err(|e| format!("DB lock: {e}"))?;
    let mut stmt = db
        .prepare(
            "SELECT id, timestamp, level, context, message \
             FROM logs ORDER BY id DESC LIMIT 500",
        )
        .map_err(|e| format!("Prepare: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(LogRow {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                level: row.get(2)?,
                context: row.get(3)?,
                message: row.get(4)?,
            })
        })
        .map_err(|e| format!("Query: {e}"))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

#[tauri::command]
pub async fn clear_logs(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| format!("DB lock: {e}"))?;
    db.execute("DELETE FROM logs", [])
        .map_err(|e| format!("Clear logs: {e}"))?;
    Ok(())
}
