import { useState } from "react";
import { BellRing, Clock, Download, Info, KeyRound, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { PageContainer } from "@/components/Layout";
import { Card, IconTile, SectionHeader, Separator, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { daysRemaining, effectiveStatus } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { generateMovementsReport, generateRentalReport, generateToolsReport } from "@/lib/reports";

export default function Settings() {
  const { db, updateSettings } = useData();
  const { profile, isAdmin } = useAuth();
  const [exporting, setExporting] = useState(false);

  const scheduledCount = db.tools.filter((t) => t.ownership === "rented" && t.rentalEndDate).length;

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      await updateSettings({ notificationsEnabled: false });
      return;
    }
    if (!("Notification" in window)) {
      toast.error("Este navegador não suporta notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await updateSettings({ notificationsEnabled: true });
      toast.success("Alertas de vencimento ativados");
    } else {
      toast.error("Permissão de notificações negada.");
    }
  };

  const checkNow = () => {
    const alertDays = db.settings.alertDaysBefore;
    const dueTools = db.tools.filter((t) => {
      const days = daysRemaining(t);
      return days !== null && days <= alertDays;
    });

    if (dueTools.length === 0) {
      toast.success("Nenhum aluguel vencendo no período configurado.");
      return;
    }

    for (const tool of dueTools) {
      const days = daysRemaining(tool) ?? 0;
      const company = tool.rentalCompanyId ? db.companies.find((c) => c.id === tool.rentalCompanyId)?.name ?? "—" : "—";
      const body =
        days < 0
          ? `"${tool.name}" está com a devolução atrasada. Contate ${company} imediatamente.`
          : `"${tool.name}" deve ser devolvida em ${formatShortDate(tool.rentalEndDate)}. Locadora: ${company}`;

      if (db.settings.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
        new Notification(days < 0 ? "Aluguel Atrasado!" : "Vencimento de Aluguel", { body });
      } else {
        toast.warning(body);
      }
    }
  };

  const reports = [
    {
      title: "Inventário Completo",
      description: "Todas as ferramentas com status e localização",
      icon: Wrench,
      action: async () => {
        setExporting(true);
        try {
          await generateToolsReport(db);
          toast.success("Inventário exportado");
        } finally {
          setExporting(false);
        }
      },
    },
    {
      title: "Relatório de Alugueis",
      description: "Ferramentas alugadas com custos e prazos",
      icon: KeyRound,
      action: () => {
        generateRentalReport(db);
        toast.success("Relatório de aluguéis exportado");
      },
    },
    {
      title: "Histórico de Movimentações",
      description: `Todas as movimentações (${db.movements.length})`,
      icon: Clock,
      action: () => {
        generateMovementsReport(db);
        toast.success("Histórico exportado");
      },
    },
  ];

  const overdueCount = db.tools.filter((t) => effectiveStatus(t) === "overdue").length;

  return (
    <PageContainer title="Ajustes">
      <div className="flex flex-col gap-5 pb-6">
        {/* User info */}
        {profile && (
          <Card className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-app-accent/20 text-lg font-bold text-app-accent">
              {profile.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <div className="flex-1">
              <p className="text-base font-bold text-white">{profile.name || "Sem nome"}</p>
              <p className="text-xs text-app-muted">{profile.email}</p>
              <p className="text-[11px] font-semibold text-app-accent">
                {profile.role === "admin" ? "Administrador" : "Usuário Padrão"}
              </p>
            </div>
          </Card>
        )}

        {/* Notifications */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Notificações" />
          <Card className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold text-white">Alertas de Vencimento</p>
                <p className="text-xs text-app-muted">Receba notificações antes do vencimento de aluguéis</p>
              </div>
              <Switch
                checked={db.settings.notificationsEnabled}
                onCheckedChange={(checked) => void toggleNotifications(checked)}
                className="data-[state=checked]:bg-app-accent"
              />
            </div>

            {db.settings.notificationsEnabled && (
              <>
                <Separator />
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-app-muted">
                  <span>Alertar com</span>
                  <select
                    className={inputClass + " w-auto py-1.5"}
                    value={db.settings.alertDaysBefore}
                    onChange={(e) => void updateSettings({ alertDaysBefore: Number(e.target.value) })}
                  >
                    <option value={1}>1 dia</option>
                    <option value={2}>2 dias</option>
                    <option value={3}>3 dias</option>
                    <option value={5}>5 dias</option>
                    <option value={7}>7 dias</option>
                    <option value={15}>15 dias</option>
                  </select>
                  <span>de antecedência</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-app-muted">
                    <BellRing size={12} className="text-app-accent" />
                    {scheduledCount} alerta(s) monitorado(s)
                  </span>
                  <button type="button" onClick={checkNow} className="text-xs font-semibold text-app-accent hover:opacity-80">
                    Verificar agora
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Reports */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Relatórios" />
          <Card className="flex flex-col gap-2.5">
            {reports.map((report, index) => (
              <div key={report.title}>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => void report.action()}
                  className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  <IconTile icon={report.icon} color="accent" size={36} iconSize={16} />
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-white">{report.title}</p>
                    <p className="text-xs text-app-muted">{report.description}</p>
                  </div>
                  <Download size={14} className="shrink-0 text-app-muted" />
                </button>
                {index < reports.length - 1 && <Separator />}
              </div>
            ))}
          </Card>
        </div>

        {/* About */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Sobre" />
          <Card className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <Info size={14} className="w-7 text-app-accent" />
              <span className="flex-1 text-sm font-medium text-app-muted">Versão</span>
              <span className="text-sm font-semibold text-white">2.0.0</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Wrench size={14} className="w-7 text-app-accent" />
              <span className="flex-1 text-sm font-medium text-app-muted">Ferramentas</span>
              <span className="text-sm font-semibold text-white">{db.tools.length}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Clock size={14} className="w-7 text-app-accent" />
              <span className="flex-1 text-sm font-medium text-app-muted">Movimentações</span>
              <span className="text-sm font-semibold text-white">{db.movements.length}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <BellRing size={14} className="w-7 text-app-accent" />
              <span className="flex-1 text-sm font-medium text-app-muted">Aluguéis atrasados</span>
              <span className={`text-sm font-semibold ${overdueCount > 0 ? "text-status-red" : "text-white"}`}>{overdueCount}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Info size={14} className="w-7 text-app-accent" />
              <span className="flex-1 text-sm font-medium text-app-muted">Usuários</span>
              <span className="text-sm font-semibold text-white">{db.users.length}</span>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
