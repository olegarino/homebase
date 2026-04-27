use ollama_rs::Ollama;
use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as AsyncMutex;

pub struct AppState {
    pub ollama: AsyncMutex<Ollama>,
    /// Arc so it can be cloned and passed across async boundaries without
    /// holding the guard over an await point.
    pub db: Arc<Mutex<Connection>>,
}
