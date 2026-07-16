import { memo, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Hammer,
  Key,
  KeyRound,
  PlayCircle,
  PlusCircle,
  RefreshCw,
  StickyNote,
  UserMinus,
  UserPlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MovementType, StatusColor, ToolOwnership, ToolStatus } from "@/lib/types";

// MARK: - Color class maps (static strings for Tailwind JIT)

export const COLOR_TEXT: Record<StatusColor, string> = {
  green: "text-status-green",
  blue: "text-status-blue",
  red: "text-status-red",
  orange: "text-status-orange",
  gray: "text-status-gray",
};

export const COLOR_BG_SOFT: Record<StatusColor, string> = {
  green: "bg-status-green/15",
  blue: "bg-status-blue/15",
  red: "bg-status-red/15",
  orange: "bg-status-orange/15",
  gray: "bg-status-gray/15",
};

export const COLOR_BG_SOLID: Record<StatusColor, string> = {
  green: "bg-status-green",
  blue: "bg-status-blue",
  red: "bg-status-red",
  orange: "bg-status-orange",
  gray: "bg-status-gray",
};

export const COLOR_BORDER: Record<StatusColor, string> = {
  green: "border-status-green/30",
  blue: "border-status-blue/30",
  red: "border-status-red/30",
  orange: "border-status-orange/30",
  gray: "border-status-gray/30",
};

// MARK: - Icon maps

export const TOOL_STATUS_ICON: Record<ToolStatus, LucideIcon> = {
  available: CheckCircle2,
  inUse: PlayCircle,
  maintenance: Wrench,
  overdue: AlertTriangle,
};

export const OWNERSHIP_ICON: Record<ToolOwnership, LucideIcon> = {
  own: Wrench,
  rented: KeyRound,
};

export const MOVEMENT_ICON: Record<MovementType, LucideIcon> = {
  created: PlusCircle,
  siteAssigned: Hammer,
  siteRemoved: Hammer,
  siteChanged: Hammer,
  employeeAssigned: UserPlus,
  employeeRemoved: UserMinus,
  employeeChanged: UserPlus,
  statusChanged: RefreshCw,
  rentalStarted: Key,
  rentalEnded: Key,
  ownershipChanged: ArrowLeftRight,
  notesChanged: StickyNote,
};

// MARK: - Building blocks

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("app-card", className)}>{children}</div>;
}

export const StatusBadge = memo(function StatusBadge({
  label,
  color,
  icon: Icon,
}: {
  label: string;
  color: StatusColor;
  icon: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white",
        COLOR_BG_SOLID[color],
      )}
    >
      <Icon size={11} strokeWidth={3} />
      {label}
    </span>
  );
});

export function IconTile({
  icon: Icon,
  color,
  size = 40,
  iconSize = 18,
  className,
}: {
  icon: LucideIcon;
  color: StatusColor | "accent" | "appOrange";
  size?: number;
  iconSize?: number;
  className?: string;
}) {
  const text =
    color === "accent" ? "text-app-accent" : color === "appOrange" ? "text-app-orange" : COLOR_TEXT[color];
  const bg =
    color === "accent" ? "bg-app-accent/15" : color === "appOrange" ? "bg-app-orange/15" : COLOR_BG_SOFT[color];
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-[10px]", text, bg, className)}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} />
    </span>
  );
}

export function SectionHeader({
  title,
  count,
  actionTitle,
  onAction,
}: {
  title: string;
  count?: number;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-[22px] font-bold text-white">{title}</h2>
      {count !== undefined && <span className="font-mono text-sm font-semibold text-app-accent">{count}</span>}
      <span className="flex-1" />
      {actionTitle && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-semibold text-app-accent transition-opacity hover:opacity-80"
        >
          {actionTitle}
        </button>
      )}
    </div>
  );
}

export function FilterChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
        isActive
          ? "bg-app-accent text-app-bg"
          : "border-[0.5px] border-app-separator bg-app-card text-app-muted hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-3 py-12">
      <Icon size={44} className="text-app-muted/50" />
      <p className="text-[17px] font-semibold text-app-muted">{title}</p>
      <p className="text-center text-sm text-app-muted/70">{subtitle}</p>
    </div>
  );
}

export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-app-accent text-app-bg shadow-[0_4px_20px_rgba(245,158,10,0.4)] transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
    >
      <PlusCircle size={26} strokeWidth={2.5} />
    </button>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-0.5">
      <span className="text-sm font-medium text-app-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export function Separator() {
  return <div className="h-px w-full bg-app-separator" />;
}

// MARK: - Form primitives

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[10px] border-[0.5px] border-app-separator bg-app-elevated px-3 py-2.5 text-sm text-white placeholder:text-app-muted/60 outline-none focus:border-app-accent transition-colors";

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}
