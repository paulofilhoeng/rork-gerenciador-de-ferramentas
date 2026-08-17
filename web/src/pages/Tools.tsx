import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Clock, Hammer, User, Wrench } from "lucide-react";
import { PageContainer } from "@/components/Layout";
import {
  Card,
  EmptyState,
  Fab,
  FilterChip,
  IconTile,
  OWNERSHIP_ICON,
  SearchInput,
  StatusBadge,
  TOOL_STATUS_ICON,
} from "@/components/shared";
import { ToolEditDialog } from "@/components/ToolEditDialog";
import { useData } from "@/lib/store";
import type { Tool, ToolOwnership, ToolStatus } from "@/lib/types";
import {
  OWNERSHIP_LABEL,
  TOOL_STATUS_COLOR,
  TOOL_STATUS_LABEL,
  daysRemaining,
  effectiveStatus,
  isRentalTracked,
  totalRentalCost,
} from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function ToolRow({ tool }: { tool: Tool }) {
  const { db } = useData();
  const status = effectiveStatus(tool);
  const days = daysRemaining(tool);
  const site = tool.currentSiteId ? db.sites.find((s) => s.id === tool.currentSiteId) : null;
  const user = tool.currentUserId ? db.users.find((u) => u.id === tool.currentUserId) : null;

  return (
    <Link to={`/ferramentas/${tool.id}`}>
      <Card className="flex flex-col gap-2 transition-colors hover:border-app-accent/40">
        <div className="flex items-start gap-3">
          <IconTile icon={OWNERSHIP_ICON[tool.ownership]} color={isRentalTracked(tool) ? "appOrange" : "accent"} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">{tool.name}</p>
            {tool.serialNumber && (
              <p className="truncate text-xs text-app-muted">
                {tool.serialNumber}
              </p>
            )}
          </div>
          <StatusBadge label={TOOL_STATUS_LABEL[status]} color={TOOL_STATUS_COLOR[status]} icon={TOOL_STATUS_ICON[status]} />
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-app-muted">
          <span className="flex min-w-0 items-center gap-1.5">
            <Hammer size={11} className="shrink-0" />
            <span className="truncate">{site?.name ?? "Sem obra"}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <User size={11} className="shrink-0" />
            <span className="truncate">{user?.name ?? (tool.baseStatus !== "maintenance" ? "Sem responsável" : "—")}</span>
          </span>
        </div>

        {isRentalTracked(tool) && days !== null && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold",
              days < 0 ? "text-status-red" : days <= 3 ? "text-status-orange" : "text-app-muted",
            )}
          >
            <Calendar size={10} />
            {days < 0
              ? `Atrasado ${Math.abs(days)} dia(s) · ${formatCurrency(totalRentalCost(tool))}`
              : `Faltam ${days} dia(s) · ${formatCurrency(totalRentalCost(tool))}`}
          </div>
        )}

        {tool.statusUpdatedAt && (
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-app-muted/60">
            <Clock size={9} />
            <span>Status atualizado em {formatDateTime(tool.statusUpdatedAt)}</span>
          </div>
        )}
      </Card>
    </Link>
  );
}

const OWNERSHIP_VALUES: ToolOwnership[] = ["own", "rented", "client"];
const STATUS_VALUES: ToolStatus[] = ["inUse", "available", "overdue", "maintenance", "damaged", "disabled"];

export default function Tools() {
  const { db } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdd, setShowAdd] = useState(false);

  // Read filters from URL search params — survives navigation and F5.
  const search = searchParams.get("q") ?? "";
  const siteSearch = searchParams.get("obra") ?? "";
  const tipoParam = searchParams.get("tipo");
  const filterOwnership: ToolOwnership | null =
    tipoParam && OWNERSHIP_VALUES.includes(tipoParam as ToolOwnership) ? (tipoParam as ToolOwnership) : null;
  const statusParam = searchParams.get("status");
  const filterStatus: ToolStatus | null =
    statusParam && STATUS_VALUES.includes(statusParam as ToolStatus) ? (statusParam as ToolStatus) : null;
  const filterResponsible = searchParams.get("resp");
  const showDisabled = searchParams.get("desc") === "1";

  /** Merge param updates into the current URL, preserving untouched params. */
  const updateParams = (updates: Record<string, string | null>, replace = false) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      replace ? { replace: true } : undefined,
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const siteQ = siteSearch.trim().toLowerCase();
    return [...db.tools]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((tool) => {
        // Disabled tools are hidden from default list; shown only via explicit filter or search.
        const isVisibleDisabled = tool.baseStatus === "disabled" && !showDisabled && filterStatus !== "disabled" && q === "";
        if (isVisibleDisabled) return false;
        const rentalCompanyName = tool.rentalCompanyId
          ? db.companies.find((c) => c.id === tool.rentalCompanyId)?.name ?? ""
          : "";
        const matchesSearch =
          q === "" ||
          tool.name.toLowerCase().includes(q) ||
          tool.brand.toLowerCase().includes(q) ||
          tool.serialNumber.toLowerCase().includes(q) ||
          rentalCompanyName.toLowerCase().includes(q);
        const matchesOwnership = filterOwnership === null || tool.ownership === filterOwnership;
        const matchesStatus = filterStatus === null || effectiveStatus(tool) === filterStatus;
        const matchesResponsible = filterResponsible === null || tool.currentUserId === filterResponsible;
        const siteName = tool.currentSiteId ? db.sites.find((s) => s.id === tool.currentSiteId)?.name ?? "" : "";
        const matchesSite = siteQ === "" || siteName.toLowerCase().includes(siteQ);
        return matchesSearch && matchesOwnership && matchesStatus && matchesResponsible && matchesSite;
      });
  }, [db.tools, db.sites, db.companies, search, siteSearch, filterOwnership, filterStatus, filterResponsible, showDisabled]);

  return (
    <PageContainer title="Ferramentas">
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={(v) => updateParams({ q: v }, true)} placeholder="Nome, marca, série ou locadora" />
        <SearchInput value={siteSearch} onChange={(v) => updateParams({ obra: v }, true)} placeholder="Filtrar por obra (digite o nome)" />

        {filterResponsible && (
          <button
            type="button"
            onClick={() => updateParams({ resp: null })}
            className="flex items-center justify-between rounded-lg border border-app-accent/30 bg-app-accent/10 px-3 py-2 text-xs font-semibold text-app-accent"
          >
            <span>Filtrado: somente minhas ferramentas</span>
            <span>Limpar ×</span>
          </button>
        )}

        {siteSearch && (
          <button
            type="button"
            onClick={() => updateParams({ obra: null })}
            className="flex items-center justify-between rounded-lg border border-app-orange/30 bg-app-orange/10 px-3 py-2 text-xs font-semibold text-app-orange"
          >
            <span>Filtrado por obra: {siteSearch}</span>
            <span>Limpar ×</span>
          </button>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            label="Todas"
            isActive={filterOwnership === null && filterStatus === null}
            onClick={() => updateParams({ tipo: null, status: null })}
          />
          <FilterChip
            label={OWNERSHIP_LABEL.own + "s"}
            isActive={filterOwnership === "own"}
            onClick={() => updateParams({ tipo: filterOwnership === "own" ? null : "own" })}
          />
          <FilterChip
            label={OWNERSHIP_LABEL.rented + "s"}
            isActive={filterOwnership === "rented"}
            onClick={() => updateParams({ tipo: filterOwnership === "rented" ? null : "rented" })}
          />
          <FilterChip
            label={OWNERSHIP_LABEL.client + "s"}
            isActive={filterOwnership === "client"}
            onClick={() => updateParams({ tipo: filterOwnership === "client" ? null : "client" })}
          />
          <FilterChip
            label="Em Uso"
            isActive={filterStatus === "inUse"}
            onClick={() => updateParams({ status: filterStatus === "inUse" ? null : "inUse" })}
          />
          <FilterChip
            label="Disponíveis"
            isActive={filterStatus === "available"}
            onClick={() => updateParams({ status: filterStatus === "available" ? null : "available" })}
          />
          <FilterChip
            label="Atrasadas"
            isActive={filterStatus === "overdue"}
            onClick={() => updateParams({ status: filterStatus === "overdue" ? null : "overdue" })}
          />
          <FilterChip
            label="Manutenção"
            isActive={filterStatus === "maintenance"}
            onClick={() => updateParams({ status: filterStatus === "maintenance" ? null : "maintenance" })}
          />
          <FilterChip
            label="Avariadas"
            isActive={filterStatus === "damaged"}
            onClick={() => updateParams({ status: filterStatus === "damaged" ? null : "damaged" })}
          />
          <FilterChip
            label="Desativadas"
            isActive={filterStatus === "disabled" || showDisabled}
            onClick={() => {
              updateParams({
                desc: showDisabled ? null : "1",
                status: filterStatus === "disabled" ? null : "disabled",
              });
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Wrench} title="Nenhuma ferramenta" subtitle="Toque em + para adicionar a primeira ferramenta" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((tool) => (
              <ToolRow key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>

      <Fab label="Nova ferramenta" onClick={() => setShowAdd(true)} />
      <ToolEditDialog tool={null} open={showAdd} onClose={() => setShowAdd(false)} />
    </PageContainer>
  );
}
