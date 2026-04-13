import { create } from "zustand";

export interface ChatMessage {
  role: string;
  content: string;
}

interface ChatStore {
  messages: ChatMessage[];
  input: string;
  models: string[];
  selectedModel: string;
  isStreaming: boolean;
  setInput: (input: string) => void;
  setModels: (models: string[]) => void;
  setSelectedModel: (model: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (content: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  input: "",
  models: [],
  selectedModel: "",
  isStreaming: false,

  setInput: (input) => set({ input }),
  setModels: (models) => set({ models }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant") {
        messages[messages.length - 1] = {
          ...last,
          content: last.content + content,
        };
      } else {
        messages.push({ role: "assistant", content });
      }
      return { messages };
    }),

  clearMessages: () => set({ messages: [] }),
}));
