import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Status = "checking" | "running" | "stopped";

export default function StatusPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    setStatus("checking");
    const running: boolean = await invoke("get_ollama_status");
    setStatus(running ? "running" : "stopped");
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await invoke("start_ollama");
      await checkStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await invoke("stop_ollama");
      await checkStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    checking: {
      dot: "bg-yellow-400 animate-pulse",
      label: "Checking...",
      description: "Connecting to Ollama at localhost:11434",
    },
    running: {
      dot: "bg-green-500",
      label: "Running",
      description: "Ollama is active and ready at localhost:11434",
    },
    stopped: {
      dot: "bg-red-500",
      label: "Stopped",
      description: "Ollama is not running. Start it to use the chat.",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-base font-semibold">Status</h1>
          <p className="text-xs text-muted-foreground">Ollama service monitor</p>
        </div>
        <Button variant="ghost" size="icon" onClick={checkStatus} disabled={status === "checking"}>
          <RefreshCw size={14} className={status === "checking" ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Status card */}
        <div className="rounded-lg border bg-card p-6 flex items-center gap-4">
          <span className={`h-3 w-3 rounded-full shrink-0 ${config.dot}`} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{config.label}</span>
            <span className="text-xs text-muted-foreground">{config.description}</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Host", value: "localhost" },
            { label: "Port", value: "11434" },
            { label: "Protocol", value: "HTTP / REST" },
            { label: "Client", value: "ollama-rs" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-md border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            onClick={handleStart}
            disabled={loading || status === "running"}
            className="flex-1"
          >
            Start Ollama
          </Button>
          <Button
            variant="outline"
            onClick={handleStop}
            disabled={loading || status === "stopped"}
            className="flex-1"
          >
            Stop Ollama
          </Button>
        </div>

        {status === "stopped" && (
          <p className="text-xs text-muted-foreground text-center">
            Make sure Ollama is installed. Run{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">brew install ollama</code>{" "}
            if it's not.
          </p>
        )}
      </div>
    </div>
  );
}
