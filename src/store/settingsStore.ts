import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  compressionEnabled: boolean;
  setCompressionEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      compressionEnabled: false,
      setCompressionEnabled: (enabled) => set({ compressionEnabled: enabled }),
    }),
    { name: "homebase-settings" }
  )
);
