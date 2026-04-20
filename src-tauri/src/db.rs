use rusqlite::Connection;

pub fn init_db(path: &str) -> Connection {
    let conn = Connection::open(path).expect("Failed to open database");

    conn.execute_batch("PRAGMA journal_mode=WAL;")
        .expect("Failed to enable WAL mode");

    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS traces (
            id          TEXT PRIMARY KEY,
            timestamp   TEXT NOT NULL,
            input       TEXT NOT NULL,
            task_type   TEXT NOT NULL,
            agent_used  TEXT NOT NULL,
            output      TEXT NOT NULL,
            compressed   INTEGER NOT NULL DEFAULT 0,
            tokens_saved INTEGER NOT NULL DEFAULT 0,
            duration_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memory (
            id          TEXT PRIMARY KEY,
            workspace   TEXT NOT NULL DEFAULT 'default',
            kind        TEXT NOT NULL,
            content     TEXT NOT NULL,
            created_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS config (
            key         TEXT PRIMARY KEY,
            value       TEXT NOT NULL
        );
    ").expect("Failed to run migrations");

    conn
}
