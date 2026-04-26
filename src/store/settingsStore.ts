import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InferenceProvider = "ollama" | "copilot";

export type CopilotModel = string;

interface SettingsStore {
  compressionEnabled: boolean;
  setCompressionEnabled: (enabled: boolean) => void;
  githubToken: string;
  setGithubToken: (token: string) => void;
  inferenceProvider: InferenceProvider;
  setInferenceProvider: (provider: InferenceProvider) => void;
  copilotModel: CopilotModel;
  setCopilotModel: (model: CopilotModel) => void;
  copilotModels: CopilotModel[];
  setCopilotModels: (models: CopilotModel[]) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      compressionEnabled: false,
      setCompressionEnabled: (enabled) => set({ compressionEnabled: enabled }),
      githubToken: "",
      setGithubToken: (token) => set({ githubToken: token }),
      inferenceProvider: "ollama",
      setInferenceProvider: (provider) => set({ inferenceProvider: provider }),
      copilotModel: "",
      setCopilotModel: (model) => set({ copilotModel: model }),
      copilotModels: [],
      setCopilotModels: (models) => set({ copilotModels: models }),
    }),
    {
      name: "homebase-settings",
      // don't persist the model list — always fetch fresh
      partialize: (s) => ({
        compressionEnabled: s.compressionEnabled,
        githubToken: s.githubToken,
        inferenceProvider: s.inferenceProvider,
        copilotModel: s.copilotModel,
      }),
    }
  )
);
