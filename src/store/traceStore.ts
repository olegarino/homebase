import { create } from "zustand";

export type TaskType = "simple_chat" | "coding" | "data" | "tool_call" | "reasoning";

export interface TraceEntry {
  id: string;
  timestamp: string;
  input: string;
  taskType: TaskType;
  agentUsed: string;
  output: string;
  durationMs: number;
}

interface TraceStore {
  traces: TraceEntry[];
  addTrace: (trace: Omit<TraceEntry, "id" | "timestamp">) => void;
  clearTraces: () => void;
}

export const useTraceStore = create<TraceStore>((set) => ({
  traces: [],

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

  clearTraces: () => set({ traces: [] }),
}));
