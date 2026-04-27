import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useT } from "@/i18n";
import { useLocaleStore } from "@/store/localeStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { Locale } from "@/i18n";

type AuthStep =
  | { kind: "idle" }
  | { kind: "pending"; userCode: string; verificationUri: string; deviceCode: string; interval: number }
  | { kind: "error"; message: string };

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

export default function SettingsPage() {
  const t = useT();
  const { locale, setLocale } = useLocaleStore();
  const { compressionEnabled, setCompressionEnabled, githubToken, setGithubToken } = useSettingsStore();

  const [authStep, setAuthStep] = useState<AuthStep>({ kind: "idle" });
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [githubUser, setGithubUser] = useState<{ login: string; avatar_url?: string } | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [copilotOk, setCopilotOk] = useState<boolean | null>(null); // null = unchecked

  // Fetch GitHub username + verify Copilot access whenever a valid token is stored
  useEffect(() => {
    if (!githubToken.startsWith("gho_") && !githubToken.startsWith("ghu_")) {
      setGithubUser(null);
      setUserError(null);
      setCopilotOk(null);
      return;
    }
    setUserLoading(true);
    setUserError(null);
    setCopilotOk(null);

    invoke<{ login: string; name?: string; avatar_url?: string }>("get_github_user", { githubToken })
      .then((u) => {
        setGithubUser({ login: u.login, avatar_url: u.avatar_url });
        setUserError(null);
      })
      .catch((e) => {
        setGithubUser(null);
        setUserError(String(e));
      })
      .finally(() => setUserLoading(false));

    // Also ping Copilot to verify the subscription is active
    invoke<string[]>("list_copilot_models", { githubToken })
      .then((ids) => setCopilotOk(ids.length > 0))
      .catch(() => setCopilotOk(false));
  }, [githubToken]);

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const isConnected = githubToken.startsWith("gho_") || githubToken.startsWith("ghu_");

  const startLogin = async () => {
    setAuthStep({ kind: "idle" }); // reset
    try {
      const res = await invoke<{ device_code: string; user_code: string; verification_uri: string; interval: number }>(
        "start_github_login"
      );
      setAuthStep({
        kind: "pending",
        userCode: res.user_code,
        verificationUri: res.verification_uri,
        deviceCode: res.device_code,
        interval: res.interval,
      });
      schedulePoll(res.device_code, res.interval);
    } catch (e) {
      setAuthStep({ kind: "error", message: String(e) });
    }
  };

  const schedulePoll = (deviceCode: string, interval: number) => {
    pollRef.current = setTimeout(() => doPoll(deviceCode, interval), interval * 1000);
  };

  const doPoll = async (deviceCode: string, interval: number) => {
    try {
      const token = await invoke<string>("poll_github_login", { deviceCode });
      setGithubToken(token);
      setAuthStep({ kind: "idle" });
    } catch (e) {
      const msg = String(e);
      if (msg === "pending" || msg === "slow_down") {
        schedulePoll(deviceCode, msg === "slow_down" ? interval + 5 : interval);
      } else if (msg === "expired" || msg === "denied") {
        setAuthStep({ kind: "error", message: t.settings.fields.githubAuthFailed });
      } else {
        schedulePoll(deviceCode, interval); // network hiccup — retry
      }
    }
  };

  const disconnect = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setGithubToken("");
    setAuthStep({ kind: "idle" });
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

      {/* GitHub Copilot */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          GitHub Copilot
        </h2>

        {isConnected ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3">
            {/* Top row: identity + disconnect */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {userLoading ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  </span>
                ) : githubUser?.avatar_url ? (
                  <img src={githubUser.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    GH
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {userLoading
                      ? "Loading…"
                      : githubUser
                      ? `@${githubUser.login}`
                      : userError
                      ? t.settings.fields.githubConnected
                      : t.settings.fields.githubConnected}
                  </span>
                  <span className="text-xs text-muted-foreground">GitHub</span>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                {t.settings.fields.githubDisconnect}
              </button>
            </div>

            {/* Copilot access status row */}
            <div className="flex items-center gap-2 pt-1 border-t">
              {copilotOk === null ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">{t.settings.fields.githubCopilotChecking}</span>
                </>
              ) : copilotOk ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">{t.settings.fields.githubCopilotOk}</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs text-destructive">{t.settings.fields.githubCopilotFail}</span>
                </>
              )}
            </div>

            {/* Show user fetch error if any */}
            {userError && (
              <p className="text-xs text-muted-foreground">{t.settings.fields.githubProfileError}: {userError}</p>
            )}
          </div>
        ) : authStep.kind === "pending" ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-4">
            <p className="text-sm text-muted-foreground">{t.settings.fields.githubDevicePrompt}</p>
            <div className="flex items-center gap-3">
              <code className="rounded-md bg-muted px-3 py-1.5 text-lg font-mono font-semibold tracking-widest">
                {authStep.userCode}
              </code>
              <a
                href={authStep.verificationUri}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                {authStep.verificationUri} ↗
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              {t.settings.fields.githubWaiting}
            </div>
            <button
              onClick={() => { if (pollRef.current) clearTimeout(pollRef.current); setAuthStep({ kind: "idle" }); }}
              className="w-fit text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.settings.fields.githubCancel}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{t.settings.fields.githubTokenDescription}</p>
            {authStep.kind === "error" && (
              <p className="text-xs text-destructive">{authStep.message}</p>
            )}
            <button
              onClick={startLogin}
              className="w-fit flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                  0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                  -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
                  .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
                  -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0
                  1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
                  1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
                  1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              {t.settings.fields.githubConnect}
            </button>
          </div>
        )}
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
