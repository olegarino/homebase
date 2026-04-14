import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Status = "checking" | "running" | "stopped";

const STATUS_DOT: Record<Status, string> = {
  checking: "bg-yellow-400 animate-pulse",
  running: "bg-green-500",
  stopped: "bg-red-500",
};

export default function StatusPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);
  const t = useT();

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

  const stateConfig = t.status.states[status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-base font-semibold">{t.status.title}</h1>
          <p className="text-xs text-muted-foreground">{t.status.subtitle}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={checkStatus} disabled={status === "checking"}>
          <RefreshCw size={14} className={status === "checking" ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Status card */}
        <div className="rounded-lg border bg-card p-6 flex items-center gap-4">
          <span className={`h-3 w-3 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{stateConfig.label}</span>
            <span className="text-xs text-muted-foreground">{stateConfig.description}</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t.status.infoLabels.host, value: "localhost" },
            { label: t.status.infoLabels.port, value: "11434" },
            { label: t.status.infoLabels.protocol, value: "HTTP / REST" },
            { label: t.status.infoLabels.client, value: "ollama-rs" },
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
            {t.status.startOllama}
          </Button>
          <Button
            variant="outline"
            onClick={handleStop}
            disabled={loading || status === "stopped"}
            className="flex-1"
          >
            {t.status.stopOllama}
          </Button>
        </div>

        {status === "stopped" && (
          <p className="text-xs text-muted-foreground text-center">
            {t.status.installHint}{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">brew install ollama</code>{" "}
            {t.status.installHintSuffix}
          </p>
        )}
      </div>
    </div>
  );
}
