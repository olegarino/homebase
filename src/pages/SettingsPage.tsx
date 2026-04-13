export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Cloud API
        </h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">GitHub Token</label>
          <input
            type="password"
            placeholder="ghp_..."
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Integrations
        </h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Jira Base URL</label>
          <input
            type="text"
            placeholder="https://yourorg.atlassian.net"
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Jira API Token</label>
          <input
            type="password"
            placeholder="Your Jira API token"
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>
    </div>
  );
}
