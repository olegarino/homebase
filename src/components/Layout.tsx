import { NavLink } from "react-router-dom";
import { MessageSquare, Activity, Settings, Radio, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

export default function Layout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const navItems = [
    { to: "/", label: t.nav.chat, icon: MessageSquare },
    { to: "/traces", label: t.nav.traces, icon: Activity },
    { to: "/models", label: t.nav.models, icon: HardDrive },
    { to: "/status", label: t.nav.status, icon: Radio },
    { to: "/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-muted/40 p-3 gap-1">
        <div className="mb-4 px-2 py-3 text-center">
          <h1 className="text-lg font-bold tracking-tight">Homebase</h1>
          <p className="text-xs text-muted-foreground">{t.appSubtitle}</p>
        </div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
