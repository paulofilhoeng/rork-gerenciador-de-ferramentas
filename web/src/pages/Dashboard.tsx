import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Hammer,
  HardHat,
  KeyRound,
  Link2,
  PlayCircle,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/Layout";
import { Card, COLOR_TEXT, IconTile, MOVEMENT_ICON, SectionHeader, Separator, StatusBadge, TOOL_STATUS_COLOR, TOOL_STATUS_ICON } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { StatusColor, Tool, ToolStatus } from "@/lib/types";
import { MOVEMENT_COLOR, MOVEMENT_LABEL, OWNERSHIP_LABEL, TOOL_STATUS_LABEL, auditDaysRemaining, daysRemaining, effectiveStatus, isAuditDue, isRentalEndingSoon, isRentalTracked, totalRentalCost } from "@/lib/types";
import { formatCurrency, formatRelativeTime, formatShortDate, formatShortDateWithWeekday } from "@/lib/format";
import { generateMovementsReport, generateRentalReport, generateToolsReport } from "@/lib/reports";
import { cn } from "@/lib/utils";

function AlertCard({
  title,
  subtitle,
  icon: Icon,
  color,
  tools,
  companyName,
  showWeekday = false,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: StatusColor;
  tools: Tool[];
  companyName: (id: string | null) => string;
  showWeekday?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <IconTile icon={Icon} color={color} size={36} iconSize={18} />
        <div>
          <p className="text-[15px] font-bold text-white">{title}</p>
          <p className="text-xs text-app-muted">{subtitle}</p>
        </div>
      </div>
      {tools.slice(0, 3).map((tool) => (
        <div key={tool.id} className="flex items-center justify-between gap-2 pl-[46px]">
          <span className="truncate text-[13px] font-medium text-app-muted">{tool.name}</span>
          <span className="shrink-0 text-[11px] text-app-muted/60">
            {showWeekday && tool.rentalEndDate ? formatShortDateWithWeekday(tool.rentalEndDate) : companyName(tool.rentalCompanyId)}
          </span>
        </div>
      ))}
      {tools.length > 3 && (
        <p className={cn("pl-[46px] text-xs font-medium", COLOR_TEXT[color])}>+ {tools.length - 3} outra(s)</p>
      )}
    </Card>
  );
}

/** Status matrix row — one row per status, with count. */
function StatusMatrixRow({ status, count, tools, siteFilterIds }: { status: ToolStatus; count: number; tools: Tool[]; siteFilterIds: string[] | null }) {
  const Icon = TOOL_STATUS_ICON[status];
  const color = TOOL_STATUS_COLOR[status];
  const visibleTools = siteFilterIds === null ? tools : tools.filter((t) => t.currentSiteId && siteFilterIds.includes(t.currentSiteId));
  const visibleCount = siteFilterIds === null ? count : visibleTools.length;
  return (
    <Link
      to={`/ferramentas?status=${status}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
    >
      <IconTile icon={Icon} color={color} size={32} iconSize={15} />
      <span className="flex-1 text-sm font-semibold text-white">{TOOL_STATUS_LABEL[status]}</span>
      <span className={cn("text-lg font-bold", COLOR_TEXT[color])}>{visibleCount}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { db, visibleSiteIds } = useData();
  const { profile, isAdmin } = useAuth();
  const [exporting, setExporting] = useState(false);

  const companyName = (id: string | null) => (id ? db.companies.find((c) => c.id === id)?.name ?? "" : "");

  // Transversal filter: standard users only see tools/sites linked to their obras.
  const siteFilterIds = useMemo(
    () => (profile ? visibleSiteIds(profile.id, isAdmin) : null),
    [profile, isAdmin, visibleSiteIds],
  );

  const visibleTools = useMemo(
    () => (siteFilterIds === null ? db.tools : db.tools.filter((t) => (t.currentSiteId && siteFilterIds.includes(t.currentSiteId)) || t.currentUserId === profile?.id)),
    [db.tools, siteFilterIds, profile?.id],
  );

  const visibleSites = useMemo(
    () => (siteFilterIds === null ? db.sites : db.sites.filter((s) => siteFilterIds.includes(s.id))),
    [db.sites, siteFilterIds],
  );

  // My panel: tools under my responsibility
  const myPanel = useMemo(() => {
    const userRecord = db.users.find((u) => u.id === profile?.id) ?? null;
    if (!userRecord) return null;
    const myTools = db.tools.filter((t) => t.currentUserId === userRecord.id);
    const mySites = db.sites.filter((s) =>
      myTools.some((t) => t.currentSiteId === s.id),
    );
    const myToolsByStatus = {
      available: myTools.filter((t) => effectiveStatus(t) === "available").length,
      inUse: myTools.filter((t) => effectiveStatus(t) === "inUse").length,
      maintenance: myTools.filter((t) => effectiveStatus(t) === "maintenance").length,
      overdue: myTools.filter((t) => effectiveStatus(t) === "overdue").length,
      damaged: myTools.filter((t) => effectiveStatus(t) === "damaged").length,
    };
    return { userRecord, myTools, mySites, myToolsByStatus };
  }, [db.users, db.tools, db.sites, profile?.id]);

  const stats = useMemo(() => {
    const activeTools = visibleTools.filter((t) => t.baseStatus !== "disabled");
    const ownTools = activeTools.filter((t) => t.ownership === "own");
    const rentedTools = activeTools.filter((t) => t.ownership === "rented");
    const clientTools = activeTools.filter((t) => t.ownership === "client");
    const overdueTools = activeTools.filter((t) => effectiveStatus(t) === "overdue");
    const endingSoonTools = activeTools.filter((t) => isRentalEndingSoon(t));
    const inMaintenance = activeTools.filter((t) => t.baseStatus === "maintenance");
    const inUseTools = activeTools.filter((t) => t.baseStatus === "inUse");
    const availableTools = activeTools.filter((t) => effectiveStatus(t) === "available");
    const damagedTools = activeTools.filter((t) => t.baseStatus === "damaged");
    const activeSites = visibleSites.filter((s) => s.status === "active");
    const total = [...rentedTools, ...clientTools].reduce((sum, t) => sum + totalRentalCost(t), 0);
    const auditDueTools = activeTools.filter((t) => isAuditDue(t));
    return { ownTools, rentedTools, clientTools, overdueTools, endingSoonTools, inMaintenance, inUseTools, availableTools, damagedTools, activeSites, total, auditDueTools };
  }, [visibleTools, visibleSites]);

  const recentMovements = useMemo(() => {
    const visibleToolIds = new Set(visibleTools.map((t) => t.id));
    return [...db.movements]
      .filter((m) => visibleToolIds.has(m.toolId))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5);
  }, [db.movements, visibleTools]);

  const toolName = (id: string) => db.tools.find((t) => t.id === id)?.name ?? "—";
  const siteName = (id: string | null) => (id ? db.sites.find((s) => s.id === id)?.name ?? "—" : "—");

  const exportTools = async () => {
    setExporting(true);
    try {
      await generateToolsReport(db);
      toast.success("Relatório de inventário exportado");
    } finally {
      setExporting(false);
    }
  };

  const headerCount = siteFilterIds === null ? db.tools.length : visibleTools.length;
  const headerSites = siteFilterIds === null ? stats.activeSites.length : stats.activeSites.length;

  return (
    <PageContainer
      title="ToolsLoc"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" disabled={exporting} className="flex items-center gap-2 rounded-[10px] bg-app-accent/15 px-3.5 py-2 text-sm font-semibold text-app-accent hover:bg-app-accent/25">
              <Download size={15} /> Exportar
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-app-separator bg-app-card text-white">
            <DropdownMenuItem onClick={() => void exportTools()} className="gap-2">
              <Wrench size={14} /> Inventário Completo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { generateRentalReport(db); toast.success("Relatório de aluguéis exportado"); }} className="gap-2">
              <KeyRound size={14} /> Relatório de Alugueis
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { generateMovementsReport(db); toast.success("Histórico exportado"); }} className="gap-2">
              <Clock size={14} /> Histórico de Movimentações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <div className="flex flex-col gap-5 pb-6">
        {/* Header */}
        <div>
          <h2 className="text-[28px] font-extrabold leading-tight text-white">Gestão de Ferramentas</h2>
          <p className="text-sm font-medium text-app-muted">
            {headerCount} ferramentas · {headerSites} obras ativas
          </p>
          {profile && (
            <p className="text-xs text-app-muted/70">Olá, {profile.name || profile.email}</p>
          )}
          {!isAdmin && siteFilterIds && (
            <p className="text-[11px] font-medium text-app-accent/80">
              Exibindo dados das obras às quais você está vinculado
            </p>
          )}
        </div>

        {/* My Panel */}
        {myPanel && (
          <div className="flex flex-col gap-3">
            <SectionHeader title={isAdmin ? "Meu Painel" : "Minha Responsabilidade"} />
            <Card className="flex flex-col gap-3 border-app-accent/25 bg-app-accent/[0.04] p-4">
              {/* User identity */}
              <div className="flex items-center gap-3">
                <IconTile icon={HardHat} color="accent" size={40} iconSize={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-white">{myPanel.userRecord.name}</p>
                  <p className="truncate text-xs text-app-muted">
                    {myPanel.userRecord.jobRole}{myPanel.userRecord.jobRole && myPanel.userRecord.level ? " • " : ""}{myPanel.userRecord.level}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Sites I'm on */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Obra(s) Vinculada(s)</p>
                {myPanel.mySites.length > 0 ? (
                  myPanel.mySites.map((site) => (
                    <Link key={site.id} to={`/obras/${site.id}`} className="flex items-center gap-2.5">
                      <Hammer size={15} className="shrink-0 text-status-green" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{site.name}</p>
                        <p className="truncate text-[11px] text-app-muted">{site.address || "Sem endereço"}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="flex items-center gap-2 text-sm text-app-muted/60">
                    <Link2 size={14} /> Sem obra vinculada no momento
                  </p>
                )}
              </div>

              <Separator />

              {/* Tools under my responsibility */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-app-accent" />
                  <span className="text-sm font-semibold text-white">Ferramentas sob minha responsabilidade</span>
                </div>
                <span className="text-2xl font-extrabold text-app-accent">{myPanel.myTools.length}</span>
              </div>

              {myPanel.myTools.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {(["available", "inUse", "maintenance", "damaged", "overdue"] as const).map((st) => (
                    <div key={st} className="flex flex-col items-center rounded-lg bg-app-elevated py-2">
                      <span className={cn("text-lg font-bold", COLOR_TEXT[TOOL_STATUS_COLOR[st]])}>
                        {myPanel.myToolsByStatus[st]}
                      </span>
                      <span className="text-[10px] font-medium text-app-muted">{TOOL_STATUS_LABEL[st]}</span>
                    </div>
                  ))}
                </div>
              )}

              {myPanel.myTools.length > 0 && (
                <Link
                  to={`/ferramentas?resp=${profile?.id}`}
                  className="text-center text-xs font-semibold text-app-accent hover:opacity-80"
                >
                  Ver minhas ferramentas →
                </Link>
              )}
            </Card>
          </div>
        )}

        {/* Status matrix (replaces 7 stat cards) */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Painel-Resumo" />
          <Card className="flex flex-col gap-1 p-2">
            <StatusMatrixRow status="available" count={stats.availableTools.length} tools={stats.availableTools} siteFilterIds={siteFilterIds} />
            <Separator />
            <StatusMatrixRow status="inUse" count={stats.inUseTools.length} tools={stats.inUseTools} siteFilterIds={siteFilterIds} />
            <Separator />
            <StatusMatrixRow status="maintenance" count={stats.inMaintenance.length} tools={stats.inMaintenance} siteFilterIds={siteFilterIds} />
            <Separator />
            <StatusMatrixRow status="damaged" count={stats.damagedTools.length} tools={stats.damagedTools} siteFilterIds={siteFilterIds} />
            <Separator />
            <StatusMatrixRow status="overdue" count={stats.overdueTools.length} tools={stats.overdueTools} siteFilterIds={siteFilterIds} />
          </Card>

          {/* Ownership summary */}
          <Card className="grid grid-cols-3 gap-2 p-3">
            <div className="flex flex-col items-center rounded-lg bg-app-elevated py-2.5">
              <IconTile icon={Wrench} color="accent" size={28} iconSize={14} />
              <span className="mt-1 text-xl font-bold text-white">{stats.ownTools.length}</span>
              <span className="text-[10px] font-medium text-app-muted">Próprias</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-app-elevated py-2.5">
              <IconTile icon={KeyRound} color="appOrange" size={28} iconSize={14} />
              <span className="mt-1 text-xl font-bold text-white">{stats.rentedTools.length}</span>
              <span className="text-[10px] font-medium text-app-muted">Alugadas</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-app-elevated py-2.5">
              <IconTile icon={Users} color="blue" size={28} iconSize={14} />
              <span className="mt-1 text-xl font-bold text-white">{stats.clientTools.length}</span>
              <span className="text-[10px] font-medium text-app-muted">Clientes</span>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {(stats.overdueTools.length > 0 || stats.endingSoonTools.length > 0 || stats.inMaintenance.length > 0 || stats.auditDueTools.length > 0) && (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Alertas" />
            {stats.auditDueTools.length > 0 && (
              <Card className="flex flex-col gap-2 border-status-orange/30">
                <div className="flex items-center gap-2.5">
                  <IconTile icon={ClipboardCheck} color="orange" size={36} iconSize={18} />
                  <div>
                    <p className="text-[15px] font-bold text-white">{stats.auditDueTools.length} auditoria(s) pendente(s)</p>
                    <p className="text-xs text-app-muted">Conferência física de ativos vencida</p>
                  </div>
                </div>
                {stats.auditDueTools.slice(0, 3).map((tool) => {
                  const days = auditDaysRemaining(tool);
                  return (
                    <Link key={tool.id} to={`/ferramentas/${tool.id}`} className="flex items-center justify-between pl-[46px] hover:opacity-80">
                      <span className="text-[13px] font-medium text-app-muted">{tool.name}</span>
                      <span className="text-[11px] font-semibold text-status-orange">
                        {days !== null && days < 0 ? `Atrasada ${Math.abs(days)}d` : "Vence hoje"}
                        {" · "}{siteName(tool.currentSiteId)}
                      </span>
                    </Link>
                  );
                })}
                {stats.auditDueTools.length > 3 && (
                  <p className="pl-[46px] text-xs font-medium text-status-orange">+ {stats.auditDueTools.length - 3} outra(s)</p>
                )}
              </Card>
            )}
            {stats.overdueTools.length > 0 && (
              <AlertCard
                title={`${stats.overdueTools.length} aluguel(éis) atrasado(s)`}
                subtitle="Devolução vencida — contate a locadora"
                icon={AlertTriangle}
                color="red"
                tools={stats.overdueTools}
                companyName={companyName}
                showWeekday
              />
            )}
            {stats.endingSoonTools.length > 0 && (
              <AlertCard
                title={`${stats.endingSoonTools.length} aluguel(éis) vencendo`}
                subtitle="Devolução nos próximos 3 dias"
                icon={Clock}
                color="orange"
                tools={stats.endingSoonTools}
                companyName={companyName}
                showWeekday
              />
            )}
            {stats.inMaintenance.length > 0 && (
              <AlertCard
                title={`${stats.inMaintenance.length} em manutenção`}
                subtitle="Ferramentas indisponíveis para uso"
                icon={Wrench}
                color="gray"
                tools={stats.inMaintenance}
                companyName={companyName}
              />
            )}
          </div>
        )}

        {/* Rental cost */}
        {(stats.rentedTools.length > 0 || stats.clientTools.length > 0) && (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Custo de Aluguel" />
            <Card className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-app-muted">Custo acumulado</p>
                  <p className="text-[26px] font-bold text-app-accent">{formatCurrency(stats.total)}</p>
                </div>
                <BarChart3 size={32} className="text-app-accent/30" />
              </div>
              <Separator />
              {[...stats.rentedTools, ...stats.clientTools].slice(0, 4).map((tool) => {
                const days = daysRemaining(tool);
                return (
                  <Link key={tool.id} to={`/ferramentas/${tool.id}`} className="flex items-center gap-2">
                    <KeyRound size={12} className="w-7 shrink-0 text-app-orange" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{tool.name}</p>
                      {days !== null && (
                        <p className={cn("text-[11px] font-medium", days < 0 ? "text-status-red" : "text-app-muted")}>
                          {days < 0 ? `Atrasado ${Math.abs(days)}d` : `Faltam ${days}d`}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-sm font-semibold text-app-muted">{formatCurrency(totalRentalCost(tool))}</span>
                  </Link>
                );
              })}
            </Card>
          </div>
        )}

        {/* Active sites — admin only */}
        {isAdmin && stats.activeSites.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Obras Ativas" />
            <Card className="flex flex-col gap-2.5">
              {stats.activeSites.map((site) => {
                const toolCount = db.tools.filter((t) => t.currentSiteId === site.id).length;
                return (
                  <Link key={site.id} to={`/obras/${site.id}`} className="flex items-center gap-3">
                    <IconTile icon={Hammer} color="green" size={32} iconSize={16} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-white">{site.name}</p>
                      <p className="truncate text-xs text-app-muted">{toolCount} ferramentas · {site.responsibleName}</p>
                    </div>
                  </Link>
                );
              })}
            </Card>
          </div>
        )}

        {/* Recent movements */}
        {recentMovements.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Movimentações Recentes" />
            <Card className="flex flex-col">
              {recentMovements.map((mov, index) => {
                const Icon = MOVEMENT_ICON[mov.type];
                return (
                  <div key={mov.id}>
                    <div className="flex items-center gap-3 py-1.5">
                      <IconTile icon={Icon} color={MOVEMENT_COLOR[mov.type]} size={30} iconSize={13} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{MOVEMENT_LABEL[mov.type]}</p>
                        <p className="truncate text-xs text-app-muted">{toolName(mov.toolId)}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-app-muted/60">{formatRelativeTime(mov.timestamp)}</span>
                    </div>
                    {index < recentMovements.length - 1 && <Separator />}
                  </div>
                );
              })}
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
