import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  Hammer,
  KeyRound,
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
import { Card, COLOR_TEXT, IconTile, MOVEMENT_ICON, SectionHeader, Separator } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { StatusColor, Tool } from "@/lib/types";
import { MOVEMENT_COLOR, MOVEMENT_LABEL, auditDaysRemaining, daysRemaining, effectiveStatus, isAuditDue, isRentalEndingSoon, totalRentalCost } from "@/lib/types";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { generateMovementsReport, generateRentalReport, generateToolsReport } from "@/lib/reports";
import { cn } from "@/lib/utils";

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: LucideIcon; color: "accent" | "appOrange" | StatusColor }) {
  return (
    <Card className="flex flex-col items-start gap-2.5 p-3.5">
      <IconTile icon={Icon} color={color} size={38} iconSize={20} />
      <span className="text-3xl font-bold text-white">{value}</span>
      <span className="text-[13px] font-medium text-app-muted">{title}</span>
    </Card>
  );
}

function AlertCard({
  title,
  subtitle,
  icon: Icon,
  color,
  tools,
  companyName,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: StatusColor;
  tools: Tool[];
  companyName: (id: string | null) => string;
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
        <div key={tool.id} className="flex items-center justify-between pl-[46px]">
          <span className="text-[13px] font-medium text-app-muted">{tool.name}</span>
          <span className="text-[11px] text-app-muted/60">{companyName(tool.rentalCompanyId)}</span>
        </div>
      ))}
      {tools.length > 3 && (
        <p className={cn("pl-[46px] text-xs font-medium", COLOR_TEXT[color])}>+ {tools.length - 3} outra(s)</p>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { db } = useData();
  const { profile } = useAuth();
  const [exporting, setExporting] = useState(false);

  const companyName = (id: string | null) => (id ? db.companies.find((c) => c.id === id)?.name ?? "" : "");

  const stats = useMemo(() => {
    const ownTools = db.tools.filter((t) => t.ownership === "own");
    const rentedTools = db.tools.filter((t) => t.ownership === "rented");
    const overdueTools = db.tools.filter((t) => effectiveStatus(t) === "overdue");
    const endingSoonTools = db.tools.filter((t) => isRentalEndingSoon(t));
    const inMaintenance = db.tools.filter((t) => t.baseStatus === "maintenance");
    const inUseTools = db.tools.filter((t) => t.baseStatus === "inUse");
    const availableTools = db.tools.filter((t) => effectiveStatus(t) === "available");
    const activeSites = db.sites.filter((s) => s.status === "active");
    const total = rentedTools.reduce((sum, t) => sum + totalRentalCost(t), 0);
    const auditDueTools = db.tools.filter((t) => isAuditDue(t));
    return { ownTools, rentedTools, overdueTools, endingSoonTools, inMaintenance, inUseTools, availableTools, activeSites, total, auditDueTools };
  }, [db.tools, db.sites]);

  const recentMovements = useMemo(
    () => [...db.movements].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5),
    [db.movements],
  );

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
            {db.tools.length} ferramentas · {stats.activeSites.length} obras ativas
          </p>
          {profile && (
            <p className="text-xs text-app-muted/70">Olá, {profile.name || profile.email}</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard title="Próprias" value={stats.ownTools.length} icon={Wrench} color="accent" />
          <StatCard title="Alugadas" value={stats.rentedTools.length} icon={KeyRound} color="appOrange" />
          <StatCard title="Em Uso" value={stats.inUseTools.length} icon={PlayCircle} color="blue" />
          <StatCard title="Disponíveis" value={stats.availableTools.length} icon={CheckCircle2} color="green" />
          <StatCard title="Locadoras" value={db.companies.length} icon={Building2} color="accent" />
          <StatCard title="Funcionários" value={db.employees.length} icon={Users} color="appOrange" />
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
              <AlertCard title={`${stats.overdueTools.length} aluguel(éis) atrasado(s)`} subtitle="Devolução vencida — contate a locadora" icon={AlertTriangle} color="red" tools={stats.overdueTools} companyName={companyName} />
            )}
            {stats.endingSoonTools.length > 0 && (
              <AlertCard title={`${stats.endingSoonTools.length} aluguel(éis) vencendo`} subtitle="Devolução nos próximos 3 dias" icon={Clock} color="orange" tools={stats.endingSoonTools} companyName={companyName} />
            )}
            {stats.inMaintenance.length > 0 && (
              <AlertCard title={`${stats.inMaintenance.length} em manutenção`} subtitle="Ferramentas indisponíveis para uso" icon={Wrench} color="gray" tools={stats.inMaintenance} companyName={companyName} />
            )}
          </div>
        )}

        {/* Rental cost */}
        {stats.rentedTools.length > 0 && (
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
              {stats.rentedTools.slice(0, 4).map((tool) => {
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

        {/* Active sites */}
        {stats.activeSites.length > 0 && (
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
                    <ChevronRight size={14} className="shrink-0 text-app-muted/50" />
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
