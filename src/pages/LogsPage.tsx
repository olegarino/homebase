import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useT } from "@/i18n";

interface LogRow {
  id: number;
  timestamp: string;
  level: "INFO" | "DEBUG" | "ERROR" | "WARN";
  context: string;
  message: string;
}

const LEVEL_COLOR: Record<string, string> = {
  ERROR: "text-destructive font-semibold",
  WARN:  "text-yellow-500",
  INFO:  "text-foreground",
  DEBUG: "text-muted-foreground",
};

export default function LogsPage() {
  const t = useT();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const rows = await invoke<LogRow[]>("get_logs");
      setLogs(rows);
    } catch (e) {
      console.error("get_logs failed:", e);
    }
  };

  const clearLogs = async () => {
    await invoke("clear_logs").catch(console.error);
    setLogs([]);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchLogs, 1500);
    return () => clearInterval(id);
  }, [autoRefresh]);

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.logs.title}</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-primary"
            />
            {t.logs.autoRefresh}
          </label>
          <button
            onClick={clearLogs}
            className="rounded-md border px-3 py-1 text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
          >
            {t.logs.clear}
          </button>
          <button
            onClick={fetchLogs}
            className="rounded-md border px-3 py-1 text-xs hover:bg-muted transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Log table */}
      <div className="flex-1 overflow-y-auto rounded-md border bg-muted/20 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="p-4 text-muted-foreground">{t.logs.empty}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background border-b z-10">
              <tr>
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium w-44">Time</th>
                <th className="text-left px-2 py-1.5 text-muted-foreground font-medium w-16">Level</th>
                <th className="text-left px-2 py-1.5 text-muted-foreground font-medium w-32">Context</th>
                <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-3 py-1 text-muted-foreground whitespace-nowrap">
                    {new Date(row.timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className={`px-2 py-1 whitespace-nowrap ${LEVEL_COLOR[row.level] ?? ""}`}>
                    {row.level}
                  </td>
                  <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">{row.context}</td>
                  <td className="px-2 py-1 break-all">{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
