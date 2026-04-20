import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTraceStore, TaskType, TraceEntry } from "@/store/traceStore";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface RawTraceRow {
  id: string;
  timestamp: string;
  input: string;
  task_type: string;
  agent_used: string;
  output: string;
  duration_ms: number;
  compressed: boolean;
  tokens_saved: number;
}

const taskTypeColors: Record<TaskType, string> = {
  simple_chat: "bg-blue-100 text-blue-700",
  coding:      "bg-purple-100 text-purple-700",
  data:        "bg-green-100 text-green-700",
  tool_call:   "bg-orange-100 text-orange-700",
  reasoning:   "bg-yellow-100 text-yellow-700",
};

function TraceRow({ trace }: { trace: TraceEntry }) {
  const [expanded, setExpanded] = useState(false);
  const t = useT();
  const summary = trace.input.length > 60
    ? trace.input.slice(0, 60).trimEnd() + "…"
    : trace.input;

  return (
    <div className="rounded-lg border bg-card text-sm overflow-hidden">
      {/* One-liner row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded
          ? <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
          : <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
        }
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${taskTypeColors[trace.taskType]}`}>
          {t.traces.taskTypes[trace.taskType] ?? trace.taskType.replace("_", " ")}
        </span>
        <span className="flex-1 truncate text-sm">{summary}</span>
        {trace.compressed && trace.tokensSaved > 0 && (
          <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium shrink-0">
            -{trace.tokensSaved} tk
          </span>
        )}
        <span className="text-xs text-muted-foreground shrink-0">{trace.durationMs}ms</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(trace.timestamp).toLocaleTimeString()}
        </span>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t.traces.agent}:</span>
            <span>{trace.agentUsed}</span>
            <span className="mx-1">·</span>
            <span>{new Date(trace.timestamp).toLocaleString()}</span>
            <span className="mx-1">·</span>
            <span>{trace.durationMs}ms</span>
            {trace.compressed && (
              <>
                <span className="mx-1">·</span>
                <span className="text-emerald-600 font-medium">{t.traces.compressed} {trace.tokensSaved > 0 ? `(${t.traces.tokensSaved(trace.tokensSaved)})` : ""}</span>
              </>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.traces.input}</p>
            <p className="rounded-md bg-muted px-3 py-2 text-sm">{trace.input}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.traces.output}</p>
            <p className="rounded-md bg-muted px-3 py-2 text-sm whitespace-pre-wrap">{trace.output}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TracesPage() {
  const { traces, sqliteLoaded, setTraces, clearTraces } = useTraceStore();
  const t = useT();

  useEffect(() => {
    if (sqliteLoaded) return;
    invoke<RawTraceRow[]>("get_traces")
      .then((rows) =>
        setTraces(
          rows.map((r) => ({
            id: r.id,
            timestamp: r.timestamp,
            input: r.input,
            taskType: r.task_type as TraceEntry["taskType"],
            agentUsed: r.agent_used,
            output: r.output,
            durationMs: r.duration_ms,
            compressed: r.compressed,
            tokensSaved: r.tokens_saved,
          }))
        )
      )
      .catch((err) => console.error("Failed to load traces:", err));
  }, [sqliteLoaded]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-base font-semibold">{t.traces.title}</h1>
          <p className="text-xs text-muted-foreground">{t.traces.recorded(traces.length)}</p>
        </div>
        {traces.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearTraces}>
            {t.traces.clearAll}
          </Button>
        )}
      </div>

      {/* Trace list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5">
        {traces.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t.traces.empty}
          </div>
        ) : (
          traces.map((trace) => <TraceRow key={trace.id} trace={trace} />)
        )}
      </div>
    </div>
  );
}


