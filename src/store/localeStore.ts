import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/i18n/translations";

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "en" as Locale,
      setLocale: (locale) => set({ locale }),
    }),
    { name: "homebase-locale" }
  )
);
