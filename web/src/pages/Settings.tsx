import { useEffect, useState } from "react";
import { BellRing, Clock, Download, Info, KeyRound, Lock, Pencil, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageContainer } from "@/components/Layout";
import { Card, IconTile, SectionHeader, Separator, inputClass } from "@/components/shared";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { daysRemaining, effectiveStatus } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { generateMovementsReport, generateRentalReport, generateToolsReport } from "@/lib/reports";

export default function Settings() {
  const { db, updateSettings } = useData();
  const { profile, isAdmin, updateOwnName, updatePassword } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);

  const scheduledCount = db.tools.filter((t) => (t.ownership === "rented" || t.ownership === "client") && t.rentalEndDate).length;

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      void updateSettings({ notificationsEnabled: false });
      return;
    }
    if (!("Notification" in window)) {
      toast.error("Este navegador não suporta notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      void updateSettings({ notificationsEnabled: true });
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
          <Card className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
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
            </div>
            <Separator />
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditNameOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                <Pencil size={14} /> Editar Nome
              </button>
              <button
                type="button"
                onClick={() => setEditPasswordOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                <Lock size={14} /> Alterar Senha
              </button>
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

      <EditNameDialog
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        currentName={profile?.name ?? ""}
        onSave={async (name) => {
          await updateOwnName(name);
          toast.success("Nome atualizado");
          setEditNameOpen(false);
        }}
      />
      <EditPasswordDialog
        open={editPasswordOpen}
        onClose={() => setEditPasswordOpen(false)}
        onSave={async (pw) => {
          await updatePassword(pw);
          toast.success("Senha alterada com sucesso");
          setEditPasswordOpen(false);
        }}
      />
    </PageContainer>
  );
}

function EditNameDialog({
  open,
  onClose,
  currentName,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setLoading(true);
    try {
      await onSave(name.trim());
    } catch {
      toast.error("Falha ao atualizar nome");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Nome</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nome</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-3 text-sm font-semibold text-app-muted hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading}
              className="flex-1 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditPasswordDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirm("");
    }
  }, [open]);

  const handleSave = async () => {
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await onSave(password);
    } catch {
      toast.error("Falha ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-app-separator bg-app-card">
        <DialogHeader>
          <DialogTitle className="text-white">Alterar Senha</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nova Senha</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Confirmar Senha</span>
            <input
              type="password"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-[0.5px] border-app-separator bg-app-elevated py-3 text-sm font-semibold text-app-muted hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading}
              className="flex-1 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Alterar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
