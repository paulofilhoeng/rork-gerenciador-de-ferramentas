import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

export default function Tools() {
  const { db } = useData();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [filterOwnership, setFilterOwnership] = useState<ToolOwnership | null>(null);
  const [filterStatus, setFilterStatus] = useState<ToolStatus | null>(null);
  const [filterResponsible, setFilterResponsible] = useState<string | null>(null);
  const [showDisabled, setShowDisabled] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Apply filters passed via router state (from Dashboard "Ver minhas ferramentas" / status matrix).
  useEffect(() => {
    const state = location.state as { filterStatus?: ToolStatus; filterResponsible?: string } | null;
    if (state?.filterStatus) setFilterStatus(state.filterStatus);
    if (state?.filterResponsible !== undefined) setFilterResponsible(state.filterResponsible ?? null);
  }, [location.state]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const siteQ = siteSearch.trim().toLowerCase();
    return [...db.tools]
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .filter((tool) => {
        // Disabled tools are hidden from default list; shown only via explicit filter or search
        const isVisibleDisabled = tool.baseStatus === "disabled" && !showDisabled && filterStatus !== "disabled" && q === "";
        if (isVisibleDisabled) return false;
        const matchesSearch =
          q === "" ||
          tool.name.toLowerCase().includes(q) ||
          tool.brand.toLowerCase().includes(q) ||
          tool.serialNumber.toLowerCase().includes(q);
        const matchesOwnership = filterOwnership === null || tool.ownership === filterOwnership;
        const matchesStatus = filterStatus === null || effectiveStatus(tool) === filterStatus;
        const matchesResponsible = filterResponsible === null || tool.currentUserId === filterResponsible;
        const siteName = tool.currentSiteId ? db.sites.find((s) => s.id === tool.currentSiteId)?.name ?? "" : "";
        const matchesSite = siteQ === "" || siteName.toLowerCase().includes(siteQ);
        return matchesSearch && matchesOwnership && matchesStatus && matchesResponsible && matchesSite;
      });
  }, [db.tools, db.sites, search, siteSearch, filterOwnership, filterStatus, filterResponsible, showDisabled]);

  const clearResponsibleFilter = () => setFilterResponsible(null);

  return (
    <PageContainer title="Ferramentas">
      <div className="flex flex-col gap-4 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Nome, marca ou série" />
        <SearchInput value={siteSearch} onChange={setSiteSearch} placeholder="Filtrar por obra (digite o nome)" />

        {filterResponsible && (
          <button
            type="button"
            onClick={clearResponsibleFilter}
            className="flex items-center justify-between rounded-lg border border-app-accent/30 bg-app-accent/10 px-3 py-2 text-xs font-semibold text-app-accent"
          >
            <span>Filtrado: somente minhas ferramentas</span>
            <span>Limpar ×</span>
          </button>
        )}

        {siteSearch && (
          <button
            type="button"
            onClick={() => setSiteSearch("")}
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
            onClick={() => {
              setFilterOwnership(null);
              setFilterStatus(null);
            }}
          />
          <FilterChip
            label={OWNERSHIP_LABEL.own + "s"}
            isActive={filterOwnership === "own"}
            onClick={() => setFilterOwnership(filterOwnership === "own" ? null : "own")}
          />
          <FilterChip
            label={OWNERSHIP_LABEL.rented + "s"}
            isActive={filterOwnership === "rented"}
            onClick={() => setFilterOwnership(filterOwnership === "rented" ? null : "rented")}
          />
          <FilterChip
            label={OWNERSHIP_LABEL.client + "s"}
            isActive={filterOwnership === "client"}
            onClick={() => setFilterOwnership(filterOwnership === "client" ? null : "client")}
          />
          <FilterChip
            label="Em Uso"
            isActive={filterStatus === "inUse"}
            onClick={() => setFilterStatus(filterStatus === "inUse" ? null : "inUse")}
          />
          <FilterChip
            label="Disponíveis"
            isActive={filterStatus === "available"}
            onClick={() => setFilterStatus(filterStatus === "available" ? null : "available")}
          />
          <FilterChip
            label="Atrasadas"
            isActive={filterStatus === "overdue"}
            onClick={() => setFilterStatus(filterStatus === "overdue" ? null : "overdue")}
          />
          <FilterChip
            label="Manutenção"
            isActive={filterStatus === "maintenance"}
            onClick={() => setFilterStatus(filterStatus === "maintenance" ? null : "maintenance")}
          />
          <FilterChip
            label="Avariadas"
            isActive={filterStatus === "damaged"}
            onClick={() => setFilterStatus(filterStatus === "damaged" ? null : "damaged")}
          />
          <FilterChip
            label="Desativadas"
            isActive={filterStatus === "disabled" || showDisabled}
            onClick={() => {
              setShowDisabled((v) => !v);
              setFilterStatus(filterStatus === "disabled" ? null : "disabled");
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
