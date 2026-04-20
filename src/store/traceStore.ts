import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export type TaskType = "simple_chat" | "coding" | "data" | "tool_call" | "reasoning";

export interface TraceEntry {
  id: string;
  timestamp: string;
  input: string;
  taskType: TaskType;
  agentUsed: string;
  output: string;
  durationMs: number;
  compressed: boolean;
  tokensSaved: number;
}

interface TraceStore {
  traces: TraceEntry[];
  sqliteLoaded: boolean;
  addTrace: (trace: Omit<TraceEntry, "id" | "timestamp">) => void;
  setTraces: (traces: TraceEntry[]) => void;
  clearTraces: () => Promise<void>;
}

export const useTraceStore = create<TraceStore>((set) => ({
  traces: [],
  sqliteLoaded: false,

  addTrace: (trace) =>
    set((state) => ({
      traces: [
        {
          ...trace,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
        ...state.traces,
      ],
    })),

  setTraces: (traces) => set({ traces, sqliteLoaded: true }),

  clearTraces: async () => {
    await invoke("delete_traces");
    set({ traces: [], sqliteLoaded: true });
  },
}));
