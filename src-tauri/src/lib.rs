use ollama_rs::Ollama;
use tauri::Manager;
use tokio::sync::Mutex;

mod commands;
mod db;
mod state;

use commands::{
    chat::{chat, get_models},
    copilot::run_copilot_agent,
    ollama::{delete_ollama_model, get_ollama_status, list_local_ollama_models, list_ollama_registry_models, pull_ollama_model, start_ollama, stop_ollama},
    router::classify_task,
    traces::{delete_traces, get_traces, save_trace},
};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_path = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir")
                .join("homebase.db");

            std::fs::create_dir_all(db_path.parent().unwrap())
                .expect("Failed to create app data directory");

            let conn = db::init_db(db_path.to_str().unwrap());

            app.manage(AppState {
                ollama: Mutex::new(Ollama::default()),
                db: std::sync::Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_models,
            chat,
            get_ollama_status,
            start_ollama,
            stop_ollama,
            pull_ollama_model,
            list_local_ollama_models,
            delete_ollama_model,
            list_ollama_registry_models,
            save_trace,
            get_traces,
            delete_traces,
            classify_task,
            run_copilot_agent,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

