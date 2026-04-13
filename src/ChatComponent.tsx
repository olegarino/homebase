import { invoke, Channel } from "@tauri-apps/api/core";
import { useEffect, FormEvent } from "react";
import { useChatStore } from "@/store/chatStore";
import { useTraceStore } from "@/store/traceStore";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatResponse {
  message: string;
}

const ChatComponent = () => {
  const { addTrace } = useTraceStore();
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
  } = useChatStore();

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

  const sendMessage = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || !selectedModel || isStreaming) return;

    const userMessage = { role: "user", content: input };
    addMessage(userMessage);
    setInput("");
    setIsStreaming(true);
    const startTime = Date.now();
    let assistantResponse = "";

    const channel = new Channel<ChatResponse>();
    channel.onmessage = (data: ChatResponse) => {
      assistantResponse += data.message;
      appendToLastMessage(data.message);
    };

    try {
      await invoke("chat", {
        request: {
          model: selectedModel,
          messages: [...messages, userMessage],
        },
        onStream: channel,
      });
      addTrace({
        input: userMessage.content,
        taskType: "simple_chat",
        agentUsed: selectedModel,
        output: assistantResponse,
        durationMs: Date.now() - startTime,
      });
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
        <span className="text-xs text-muted-foreground font-medium">Model:</span>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Start a conversation...
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
              Thinking...
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
          placeholder="Type your message..."
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
