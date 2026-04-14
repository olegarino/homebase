import { useT } from "@/i18n";
import { useLocaleStore } from "@/store/localeStore";
import type { Locale } from "@/i18n";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

export default function SettingsPage() {
  const t = useT();
  const { locale, setLocale } = useLocaleStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">{t.settings.title}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t.settings.language}
        </h2>
        <div className="relative flex w-fit rounded-lg border bg-muted/40 p-1 gap-0">
          {/* sliding pill */}
          <span
            className="absolute top-1 bottom-1 rounded-md bg-background shadow-sm transition-all duration-200"
            style={{
              width: `calc(50% - 4px)`,
              left: locale === "en" ? "4px" : "calc(50%)",
            }}
          />
          {LOCALES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLocale(value)}
              className={`relative z-10 min-w-24 rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                locale === value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t.settings.sections.cloudApi}
        </h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{t.settings.fields.githubToken}</label>
          <input
            type="password"
            placeholder="ghp_..."
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t.settings.sections.integrations}
        </h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{t.settings.fields.jiraBaseUrl}</label>
          <input
            type="text"
            placeholder="https://yourorg.atlassian.net"
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{t.settings.fields.jiraApiToken}</label>
          <input
            type="password"
            placeholder="..."
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>
    </div>
  );
}
