import { invoke, Channel } from "@tauri-apps/api/core";
import { useEffect, useState, useCallback, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/store/chatStore";
import { useTraceStore } from "@/store/traceStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useT } from "@/i18n";
import { cavemanCompress, estimateTokens } from "@/lib/caveman";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatResponse {
  message: string;
}

type OllamaStatus = "checking" | "running" | "stopped";

const ChatComponent = () => {
  const { addTrace } = useTraceStore();
  const navigate = useNavigate();
  const t = useT();
  const { compressionEnabled, inferenceProvider, setInferenceProvider, copilotModel, setCopilotModel, copilotModels, setCopilotModels, githubToken } = useSettingsStore();
  const [
    ollamaStatus, setOllamaStatus
  ] = useState<OllamaStatus>("checking");
  const {
    messages,
    input,
    models,
    selectedModel,
    isStreaming,
    setInput,
    setModels,
    setSelectedModel,
    setIsStreaming,
    addMessage,
    appendToLastMessage,
    clearMessages,
  } = useChatStore();

  const checkOllama = useCallback(async () => {
    try {
      const running: boolean = await invoke("get_ollama_status");
      setOllamaStatus(running ? "running" : "stopped");
    } catch {
      setOllamaStatus("stopped");
    }
  }, []);

  useEffect(() => {
    checkOllama();
    const interval = setInterval(checkOllama, 8000);
    return () => clearInterval(interval);
  }, [checkOllama]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const fetchedModels: string[] = await invoke("get_models");
        setModels(fetchedModels);
        if (fetchedModels.length > 0) {
          setSelectedModel(fetchedModels[0]);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (!githubToken) return;
    fetch("https://models.inference.ai.azure.com/models", {
      headers: { Authorization: `Bearer ${githubToken}` },
    })
      .then((r) => r.json())
      .then((data: { id: string }[]) => {
        const ids = data.map((m) => m.id).sort();
        setCopilotModels(ids);
        if (!copilotModel || !ids.includes(copilotModel)) {
          setCopilotModel(ids[0] ?? "");
        }
      })
      .catch((err) => console.error("Failed to fetch Copilot models:", err));
  }, [githubToken]);

  const sendMessage = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || !selectedModel || isStreaming) return;

    const userMessage = { role: "user", content: input };
    addMessage(userMessage);
    setInput("");
    setIsStreaming(true);
    const startTime = Date.now();
    let assistantResponse = "";

    // When compression is enabled, compress every message in the context window
    // before sending — both history and the new user message. The UI always
    // displays the original uncompressed text.
    const compressMsg = (msg: { role: string; content: string }) =>
      compressionEnabled
        ? { ...msg, content: cavemanCompress(msg.content) }
        : msg;

    const historyToSend = messages.map(compressMsg);
    const messageToSend = compressMsg(userMessage);

    const channel = new Channel<ChatResponse>();
    channel.onmessage = (data: ChatResponse) => {
      assistantResponse += data.message;
      appendToLastMessage(data.message);
    };

    try {
      await invoke("chat", {
        request: {
          model: selectedModel,
          messages: [...historyToSend, messageToSend],
        },
        onStream: channel,
      });
      const durationMs = Date.now() - startTime;

      // Compute how many tokens were saved by compression across the full context
      const fullContext = [...messages, userMessage]
        .map((m) => m.content)
        .join(" ");
      const compressedContext = [...historyToSend, messageToSend]
        .map((m) => m.content)
        .join(" ");
      const tokensSaved = compressionEnabled
        ? Math.max(0, estimateTokens(fullContext) - estimateTokens(compressedContext))
        : 0;

      addTrace({
        input: userMessage.content,
        taskType: "simple_chat",
        agentUsed: selectedModel,
        output: assistantResponse,
        durationMs,
        compressed: compressionEnabled,
        tokensSaved,
      });
      invoke("save_trace", {
        trace: {
          input: userMessage.content,
          task_type: "simple_chat",
          agent_used: selectedModel,
          output: assistantResponse,
          duration_ms: durationMs,
          compressed: compressionEnabled,
          tokens_saved: tokensSaved,
        }
      }).catch((err) => console.error("Failed to persist trace to SQLite:", err));
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage({ role: "assistant", content: "Error: " + (error as Error).message });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Model selector */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <span className="text-xs text-muted-foreground font-medium">{t.chat.model}:</span>
        {inferenceProvider === "ollama" ? (
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        ) : (
          <select
            value={copilotModel}
            onChange={(e) => setCopilotModel(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {copilotModels.length === 0 ? (
              <option value="">No token set</option>
            ) : (
              copilotModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))
            )}
          </select>
        )}
        <div className="relative flex rounded-md border bg-muted/40 p-0.5 gap-0">
          <span
            className="absolute top-0.5 bottom-0.5 rounded bg-background shadow-sm transition-all duration-200"
            style={{ width: "calc(50% - 2px)", left: inferenceProvider === "ollama" ? "2px" : "calc(50%)" }}
          />
          {(["ollama", "copilot"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setInferenceProvider(p)}
              className={`relative z-10 px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 ${
                inferenceProvider === p ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "ollama" ? "Local" : "Copilot"}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
            title={t.chat.clearChat}
          >
            {t.chat.clearChat}
          </button>
        )}
        <button
          onClick={() => navigate("/status")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title={t.chat.ollamaTooltip}
        >
          <span
            className={`size-2 rounded-full ${
              ollamaStatus === "running"
                ? "bg-green-500 shadow-[0_0_4px_1px_rgba(34,197,94,0.6)]"
                : ollamaStatus === "stopped"
                ? "bg-red-500"
                : "bg-yellow-400 animate-pulse"
            }`}
          />
          <span>{ollamaStatus === "running" ? t.chat.ollamaRunning : ollamaStatus === "stopped" ? t.chat.ollamaOffline : t.chat.ollamaChecking}</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t.chat.startConversation}
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2 text-sm text-muted-foreground animate-pulse">
              {t.chat.thinking}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.chat.placeholder}
          disabled={isStreaming}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ChatComponent;
