import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ClipboardList, Hammer, LayoutGrid, LogOut, Settings, Shield, Users, ArrowLeftRight, Upload, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { USER_ROLE_LABEL } from "@/lib/types";
import { toast } from "sonner";

const NAV_ITEMS = [
  { to: "/", label: "Painel", icon: LayoutGrid },
  { to: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/locadoras", label: "Locadoras", icon: Shield },
  { to: "/obras", label: "Obras", icon: Hammer },
  { to: "/relatorios", label: "Relatórios", icon: ClipboardList },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
];

const ADMIN_ONLY_ITEMS = [
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/tipos-movimentacao", label: "Tipos de Mov.", icon: ArrowLeftRight },
  { to: "/importacao", label: "Importação", icon: Upload },
];

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/login");
  };

  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ONLY_ITEMS] : NAV_ITEMS;

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
            <p className="text-[11px] font-medium text-app-muted">Gestão de Ativos</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {items.map(({ to, label, icon: Icon }) => (
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
        <div className="border-t border-app-separator px-3 py-3">
          <div className="mb-2 flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-app-accent/20 text-xs font-bold text-app-accent">
              {profile?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{profile?.name || "—"}</p>
              <p className="truncate text-[10px] text-app-muted">
                {profile ? USER_ROLE_LABEL[profile.role] : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-status-red transition-colors hover:bg-status-red/10"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="pb-24 md:ml-60 md:pb-8">{children}</main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t-[0.5px] border-app-separator bg-[#17171A]/95 backdrop-blur-md md:hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex min-w-[64px] flex-1 flex-col items-center gap-1 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2.5 text-[10px] font-semibold transition-colors",
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
