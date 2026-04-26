import { useState, useEffect, useCallback } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { useT } from "@/i18n";

interface LocalModel {
  name: string;
  size: number;
}

interface RegistryModel {
  name: string;
  size: number;
}

interface PullProgress {
  status: string;
  completed?: number;
  total?: number;
}

type PullState = "idle" | "pulling" | "done" | "error";

export default function ModelsPage() {
  const t = useT();

  // Installed
  const [installedModels, setInstalledModels] = useState<LocalModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [installedError, setInstalledError] = useState<"offline" | null>(null);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);

  // Registry (full list fetched once)
  const [registryModels, setRegistryModels] = useState<RegistryModel[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [registryError, setRegistryError] = useState("");

  // Search / add
  const [searchQuery, setSearchQuery] = useState("");

  // Pull
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullState, setPullState] = useState<PullState>("idle");
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [pullError, setPullError] = useState("");

  const refreshInstalled = useCallback(async () => {
    setLoadingModels(true);
    try {
      const models: LocalModel[] = await invoke("list_local_ollama_models");
      setInstalledModels(models);
      setInstalledError(null);
    } catch {
      setInstalledModels([]);
      setInstalledError("offline");
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => { refreshInstalled(); }, [refreshInstalled]);

  useEffect(() => {
    setLoadingRegistry(true);
    invoke<RegistryModel[]>("list_ollama_registry_models", { limit: 50 })
      .then(setRegistryModels)
      .catch((err) => setRegistryError(String(err)))
      .finally(() => setLoadingRegistry(false));
  }, []);

  const handleDelete = async (name: string) => {
    setDeletingModel(name);
    try {
      await invoke("delete_ollama_model", { name });
      await refreshInstalled();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingModel(null);
    }
  };

  const handlePull = async (tag: string) => {
    if (pulling) return;
    setPulling(tag);
    setPullState("pulling");
    setPullProgress(null);
    setPullError("");

    const channel = new Channel<PullProgress>();
    channel.onmessage = (data) => setPullProgress(data);

    try {
      await invoke("pull_ollama_model", { name: tag, onProgress: channel });
      setPullState("done");
      setSearchQuery("");
      await refreshInstalled();
    } catch (err) {
      setPullState("error");
      setPullError(String(err));
    } finally {
      setPulling(null);
      setTimeout(() => { setPullState("idle"); setPullProgress(null); }, 3000);
    }
  };

  const isInstalled = (name: string) =>
    installedModels.some(
      (m) => m.name === name || m.name.startsWith(name.split(":")[0] + ":")
    );

  // What to show in the "Add" section:
  // - If search is empty → top 10 from registry
  // - If search matches registry entries → show matches (up to 10)
  // - If search doesn't match any registry entry → show it as a custom option
  const query = searchQuery.trim().toLowerCase();
  const filteredRegistry = query
    ? registryModels.filter((m) => m.name.toLowerCase().includes(query))
    : registryModels.slice(0, 10);
  const showCustomOption =
    query.length > 0 &&
    !registryModels.some((m) => m.name.toLowerCase() === query);

  const progressPercent =
    pullProgress?.total && pullProgress.total > 0
      ? Math.round(((pullProgress.completed ?? 0) / pullProgress.total) * 100)
      : null;

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-semibold">{t.models.title}</h1>

      {/* Pull progress banner */}
      {pulling && pullState === "pulling" && (
        <div className="rounded-lg border bg-muted/30 px-3 py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-foreground">{pulling}</span>
            <span className="text-xs text-muted-foreground">
              {pullProgress?.status ?? t.settings.modelManager.downloading}
            </span>
          </div>
          {progressPercent !== null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}
      {pullState === "error" && (
        <p className="text-xs text-destructive">{pullError}</p>
      )}

      {/* Installed models */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t.models.installed}
          </h2>
          <button
            onClick={refreshInstalled}
            disabled={loadingModels}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            ↻
          </button>
        </div>

        {loadingModels ? (
          <p className="text-xs text-muted-foreground animate-pulse">{t.models.loading}</p>
        ) : installedError === "offline" ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Ollama is not running.</p>
            <button
              onClick={async () => {
                await invoke("start_ollama").catch(() => {});
                refreshInstalled();
              }}
              className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted/50 transition-colors"
            >
              Start Ollama
            </button>
          </div>
        ) : installedModels.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t.models.noModels}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {installedModels.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono">{m.name}</span>
                  {m.size > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {(m.size / 1e9).toFixed(1)} GB
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(m.name)}
                  disabled={deletingModel === m.name}
                  className="rounded-md border border-destructive/40 bg-destructive/5 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/15 transition-colors disabled:opacity-40"
                >
                  {deletingModel === m.name ? t.models.deleting : t.models.delete}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add a model */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t.models.add}
        </h2>

        <input
          type="text"
          placeholder={t.models.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {loadingRegistry ? (
          <p className="text-xs text-muted-foreground animate-pulse">{t.models.loadingRegistry}</p>
        ) : registryError ? (
          <p className="text-xs text-destructive">{registryError}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredRegistry.map((model) => {
              const installed = isInstalled(model.name);
              const isBeingPulled = pulling === model.name;
              const sizeGb = model.size > 0 ? `${(model.size / 1e9).toFixed(1)} GB` : null;
              return (
                <div
                  key={model.name}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono">{model.name}</span>
                    {sizeGb && (
                      <span className="text-xs text-muted-foreground">~{sizeGb}</span>
                    )}
                    {installed && (
                      <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        ✓
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePull(model.name)}
                    disabled={!!pulling || installed}
                    className="ml-3 shrink-0 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-40"
                  >
                    {isBeingPulled
                      ? t.models.downloading
                      : installed
                      ? `✓ ${t.models.downloaded}`
                      : t.models.download}
                  </button>
                </div>
              );
            })}

            {/* Custom / no-match option */}
            {showCustomOption && (
              <div className="flex items-center justify-between rounded-lg border border-dashed bg-card px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono">{searchQuery.trim()}</span>
                  <span className="text-xs text-muted-foreground">{t.models.customHint}</span>
                </div>
                <button
                  onClick={() => handlePull(searchQuery.trim())}
                  disabled={!!pulling}
                  className="ml-3 shrink-0 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-40"
                >
                  {pulling === searchQuery.trim() ? t.models.downloading : t.models.download}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
