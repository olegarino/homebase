use ollama_rs::Ollama;
use rusqlite::Connection;
use std::sync::Mutex;
use tokio::sync::Mutex as AsyncMutex;

pub struct AppState {
    pub ollama: AsyncMutex<Ollama>,
    pub db: Mutex<Connection>,
}
