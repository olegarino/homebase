import { useTraceStore, TaskType } from "@/store/traceStore";
import { Button } from "@/components/ui/button";

const taskTypeColors: Record<TaskType, string> = {
  simple_chat: "bg-blue-100 text-blue-700",
  coding:      "bg-purple-100 text-purple-700",
  data:        "bg-green-100 text-green-700",
  tool_call:   "bg-orange-100 text-orange-700",
  reasoning:   "bg-yellow-100 text-yellow-700",
};

export default function TracesPage() {
  const { traces, clearTraces } = useTraceStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-base font-semibold">Traces</h1>
          <p className="text-xs text-muted-foreground">{traces.length} recorded</p>
        </div>
        {traces.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearTraces}>
            Clear all
          </Button>
        )}
      </div>

      {/* Trace list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {traces.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No traces yet. Start a conversation to see activity.
          </div>
        ) : (
          traces.map((trace) => (
            <div key={trace.id} className="rounded-lg border bg-card p-4 space-y-3 text-sm">
              {/* Top row */}
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${taskTypeColors[trace.taskType]}`}>
                  {trace.taskType.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {trace.durationMs}ms
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(trace.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Agent */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Agent:</span>
                <span>{trace.agentUsed}</span>
              </div>

              {/* Input */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input</p>
                <p className="rounded-md bg-muted px-3 py-2 text-sm">{trace.input}</p>
              </div>

              {/* Output */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output</p>
                <p className="rounded-md bg-muted px-3 py-2 text-sm line-clamp-4 whitespace-pre-wrap">
                  {trace.output}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

