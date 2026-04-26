import { useState } from "react";
import { useT } from "@/i18n";
import { useLocaleStore } from "@/store/localeStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { Locale } from "@/i18n";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

export default function SettingsPage() {
  const t = useT();
  const { locale, setLocale } = useLocaleStore();
  const { compressionEnabled, setCompressionEnabled, githubToken, setGithubToken } = useSettingsStore();
  const [tokenDraft, setTokenDraft] = useState(githubToken);
  const [tokenSaved, setTokenSaved] = useState(false);

  const handleSaveToken = () => {
    setGithubToken(tokenDraft.trim());
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-semibold">{t.settings.title}</h1>

      {/* Language */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t.settings.language}
        </h2>
        <div className="relative flex w-fit rounded-lg border bg-muted/40 p-1 gap-0">
          <span
            className="absolute top-1 bottom-1 rounded-md bg-background shadow-sm transition-all duration-200"
            style={{ width: `calc(50% - 4px)`, left: locale === "en" ? "4px" : "calc(50%)" }}
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

      {/* Compression */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t.settings.compression.label}
        </h2>
        <div
          onClick={() => setCompressionEnabled(!compressionEnabled)}
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{t.settings.compression.label}</span>
            <span className="text-xs text-muted-foreground">{t.settings.compression.description}</span>
          </div>
          <div
            role="switch"
            aria-checked={compressionEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
              compressionEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                compressionEnabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      </section>

      {/* GitHub Token */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{t.settings.fields.githubToken}</label>
          <p className="text-xs text-muted-foreground">{t.settings.fields.githubTokenDescription}</p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="ghp_..."
              value={tokenDraft}
              onChange={(e) => { setTokenDraft(e.target.value); setTokenSaved(false); }}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSaveToken}
              disabled={tokenDraft.trim() === githubToken}
              className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40"
            >
              {tokenSaved ? `✓ ${t.settings.fields.githubTokenSaved}` : t.nav.settings}
            </button>
          </div>
        </div>
      </section>

      {/* Integrations */}
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
