import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Building2, Hammer, LayoutGrid, Settings, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Painel", icon: LayoutGrid },
  { to: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/locadoras", label: "Locadoras", icon: Building2 },
  { to: "/obras", label: "Obras", icon: Hammer },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r-[0.5px] border-app-separator bg-[#17171A] md:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-accent text-app-bg">
            <Wrench size={20} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-lg font-extrabold leading-tight text-white">ToolsLoc</p>
            <p className="text-[11px] font-medium text-app-muted">Gestão de Ferramentas</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  isActive ? "bg-app-accent/12 text-app-accent" : "text-app-muted hover:bg-white/5 hover:text-white",
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-4 text-[11px] text-app-muted/60">v1.0.0</p>
      </aside>

      {/* Content */}
      <main className="pb-24 md:ml-60 md:pb-8">{children}</main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t-[0.5px] border-app-separator bg-[#17171A]/95 backdrop-blur-md md:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2.5 text-[10px] font-semibold transition-colors",
                isActive ? "text-app-accent" : "text-app-muted",
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function PageContainer({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 md:px-8 md:pt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-white md:text-xl">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  );
}
