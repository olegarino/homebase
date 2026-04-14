import { useLocaleStore } from "@/store/localeStore";
import { translations } from "./translations";

export { translations };
export type { Locale, Translations } from "./translations";

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return translations[locale];
}
